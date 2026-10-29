import type { RawAtValue } from '@slidev/types'
import type { editor, IDisposable } from 'monaco-editor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSlideContext } from '../context'
import { useNav } from '../hooks/useNav'
import { CodeRunner } from '../internals/CodeRunner'
import { makeId } from '../logic/utils'
import { decodeLzObject, decodeLzString } from './lzProps'
import './Monaco.css'

export interface MonacoProps {
  codeLz?: string
  diffLz?: string
  optionsLz?: string
  lang?: string
  readonly?: boolean
  lineNumbers?: editor.LineNumbersType
  height?: number | string
  editorOptions?: editor.IEditorOptions
  ata?: boolean
  runnable?: boolean
  writable?: string
  autorun?: boolean | 'once'
  showOutputAt?: RawAtValue
  outputHeight?: string
  highlightOutput?: boolean
  runnerOptions?: Record<string, unknown>
}

export default function Monaco(rawProps: MonacoProps) {
  // Compiler-authored object literals have the same contract as direct props.
  const options = useMemo(() => decodeLzObject(rawProps.optionsLz), [rawProps.optionsLz])
  const props: MonacoProps = { ...options, ...rawProps }
  const { codeLz, diffLz, lang = 'typescript', readonly = false, lineNumbers = 'off', height = 'initial', editorOptions, ata = true } = props
  const source = useMemo(() => decodeLzString(codeLz).trimEnd(), [codeLz])
  const [code, setCode] = useState(source)
  const [contentHeight, setContentHeight] = useState(40)
  const [error, setError] = useState<Error>()
  const container = useRef<HTMLDivElement>(null)
  const outer = useRef<HTMLDivElement>(null)
  const initialHeight = useRef<number>()
  const loadTypes = useRef<() => void>()
  const { $page, $renderContext } = useSlideContext()
  const { currentSlideNo } = useNav()
  const language = lang === 'ts' ? 'typescript' : lang === 'js' ? 'javascript' : lang
  useEffect(() => {
    let cancelled = false
    const disposables: IDisposable[] = []
    let typeTimer: ReturnType<typeof setTimeout>
    let fontTimer: ReturnType<typeof setTimeout>
    initialHeight.current = undefined
    setCode(source)
    import('../setup/monaco').then(m => m.default()).then(({ monaco, ata: acquireTypes, editorOptions: defaults }) => {
      if (cancelled || !container.current) return
      const model = monaco.editor.createModel(source, language, monaco.Uri.parse(`file:///${makeId()}.${language === 'typescript' ? 'mts' : language === 'javascript' ? 'mjs' : language}`))
      const common: editor.IStandaloneEditorConstructionOptions & editor.IDiffEditorConstructionOptions = {
        automaticLayout: true, readOnly: readonly, lineNumbers, minimap: { enabled: false },
        overviewRulerBorder: false, overviewRulerLanes: 0, padding: { top: 10, bottom: 10 },
        lineNumbersMinChars: 3, bracketPairColorization: { enabled: false }, tabSize: 2,
        fontSize: 11.5, fontFamily: 'var(--slidev-code-font-family)', scrollBeyondLastLine: false,
        useInlineViewWhenSpaceIsLimited: false, ...defaults, ...editorOptions,
      }
      let instance: editor.IStandaloneCodeEditor | editor.IStandaloneDiffEditor
      let editable: editor.IStandaloneCodeEditor
      let original: editor.IStandaloneCodeEditor | undefined
      disposables.push(model)
      if (diffLz) {
        const modified = monaco.editor.createModel(decodeLzString(diffLz).trimEnd(), language)
        const diffEditor = monaco.editor.createDiffEditor(container.current, { renderOverviewRuler: false, ...common })
        diffEditor.setModel({ original: model, modified })
        instance = diffEditor
        editable = diffEditor.getModifiedEditor()
        original = diffEditor.getOriginalEditor()
        disposables.push(modified)
      } else {
        instance = editable = monaco.editor.create(container.current, { model, lineDecorationsWidth: 0, ...common })
      }
      const updateHeight = () => {
        const nextHeight = Math.max(editable.getContentHeight(), original?.getContentHeight() ?? 0) + 4
        initialHeight.current ??= nextHeight
        setContentHeight(nextHeight)
      }
      disposables.push(instance, editable.onDidContentSizeChange(updateHeight), editable.onDidChangeModelContent(() => {
        setCode(editable.getValue())
        if (ata) { clearTimeout(typeTimer); typeTimer = setTimeout(() => void acquireTypes(editable.getValue()), 1000) }
      }))
      if (original) disposables.push(original.onDidContentSizeChange(updateHeight))
      updateHeight()
      loadTypes.current = () => { void import('#slidev/monaco-types'); if (ata) void acquireTypes(editable.getValue()); loadTypes.current = undefined }
      if (['slide', 'presenter'].includes($renderContext)) loadTypes.current()
      disposables.push(editable.addAction({ id: 'slidev-save', label: 'Save', keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS], run() {
        if (props.writable && !readonly && import.meta.hot) import.meta.hot.send('slidev:monaco-write', { file: props.writable, content: editable.getValue() })
      } }))
      monaco.editor.remeasureFonts()
      fontTimer = setTimeout(() => monaco.editor.remeasureFonts(), 1000)
    }).catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason : new Error(String(reason))) })
    return () => { cancelled = true; clearTimeout(typeTimer); clearTimeout(fontTimer); loadTypes.current = undefined; disposables.reverse().forEach(d => d.dispose()) }
  }, [source, diffLz, language, readonly, lineNumbers, editorOptions, ata, props.writable, $renderContext])
  useEffect(() => { if (Math.abs($page - currentSlideNo) <= 1) loadTypes.current?.() }, [$page, currentSlideNo])
  if (error) throw error
  const resolvedHeight = height === 'auto' ? contentHeight : height === 'initial' ? initialHeight.current ?? contentHeight : height
  return <div className="relative slidev-monaco-container">
    <div ref={outer} className="relative slidev-monaco-container-inner" style={{ height: resolvedHeight }}><div ref={container} className="absolute inset-0.5" /></div>
    {props.runnable && <CodeRunner code={code} lang={language} autorun={props.autorun ?? true} showOutputAt={props.showOutputAt} height={props.outputHeight} highlightOutput={props.highlightOutput ?? true} runnerOptions={props.runnerOptions} />}
  </div>
}
