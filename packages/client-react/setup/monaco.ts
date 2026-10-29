import type { MonacoSetupReturn } from '@slidev/types'
import setups from '#slidev/setups/monaco'
import { createSingletonPromise } from '@antfu/utils'
import { shikiToMonaco } from '@shikijs/monaco'
import { setupTypeAcquisition } from '@typescript/ata'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import ts from 'typescript'
import { configs } from '../env'
import { isDark, subscribeToDarkMode } from '../logic/dark'
import { lockShortcuts } from '../state/shortcuts'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker()
    if (['css', 'scss', 'less'].includes(label)) return new CssWorker()
    if (['html', 'handlebars', 'razor'].includes(label)) return new HtmlWorker()
    if (['typescript', 'javascript'].includes(label)) return new TsWorker()
    return new EditorWorker()
  },
}

export default createSingletonPromise(async () => {
  const defaults = monaco.typescript.typescriptDefaults
  defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), strict: true,
    moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.typescript.ModuleKind.ESNext })
  const ata = configs.monacoTypesSource === 'cdn'
    ? setupTypeAcquisition({ projectName: 'Slidev', typescript: ts, logger: console, delegate: {
        receivedFile(code, path) {
          defaults.addExtraLib(code, `file://${path}`)
          const uri = monaco.Uri.file(path)
          if (!monaco.editor.getModel(uri)) monaco.editor.createModel(code, 'typescript', uri)
        },
      } })
    : async () => {}
  const { getEagerHighlighter, languageNames, themeOption } = await (await import('./shiki')).default()
  for (const id of languageNames) monaco.languages.register({ id })
  const editorOptions: MonacoSetupReturn['editorOptions'] & object = {}
  for (const setup of setups) Object.assign(editorOptions, (await setup(monaco))?.editorOptions)
  const editorSubscription = monaco.editor.onDidCreateEditor(editor => {
    let release: (() => void) | undefined
    const focus = editor.onDidFocusEditorWidget(() => { release?.(); release = lockShortcuts() })
    const blur = editor.onDidBlurEditorWidget(() => { release?.(); release = undefined })
    editor.onDidDispose(() => { release?.(); focus.dispose(); blur.dispose() })
  })
  shikiToMonaco(await getEagerHighlighter(), monaco)
  const setTheme = () => monaco.editor.setTheme(typeof themeOption === 'string' ? themeOption : isDark.value ? themeOption.dark || 'vitesse-dark' : themeOption.light || 'vitesse-light')
  setTheme()
  const unsubscribe = subscribeToDarkMode(setTheme)
  import.meta.hot?.dispose(() => { unsubscribe(); editorSubscription.dispose() })
  return { monaco, ata, editorOptions }
})

const files = new Map<string, Promise<void>>()
export function addFile(raw: () => Promise<{ default: string }>, path: string) {
  let pending = files.get(path)
  if (!pending) {
    pending = raw().then(({ default: code }) => {
      monaco.typescript.typescriptDefaults.addExtraLib(code, `file:///${path}`)
      const uri = monaco.Uri.file(path)
      if (!monaco.editor.getModel(uri)) monaco.editor.createModel(code, 'typescript', uri)
    }).catch(error => { files.delete(path); throw error })
    files.set(path, pending)
  }
  return pending
}
