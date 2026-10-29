import type { CodeRunnerOutput, CodeRunnerOutputs, RawAtValue } from '@slidev/types'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useSlideContext } from '../context'
import { useClicksInfo } from '../hooks/useClicks'
import { useNav } from '../hooks/useNav'
import setupCodeRunners from '../setup/code-runners'
import { IconButton } from './IconButton'

export interface CodeRunnerProps {
  code: string
  lang?: string
  language?: string
  autorun?: boolean | 'once'
  autoRun?: boolean
  height?: string
  showOutputAt?: RawAtValue
  highlightOutput?: boolean
  runnerOptions?: Record<string, unknown>
}
function resolveOutputs(outputs: CodeRunnerOutputs): CodeRunnerOutput[] {
  const value = typeof outputs === 'function' ? outputs() : 'value' in outputs ? outputs.value : outputs
  return Array.isArray(value) ? value : [value]
}
function DomOutput({ element }: { element: HTMLElement }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => { container.current?.append(element); return () => element.remove() }, [element])
  return <div ref={container} />
}
export function CodeRunner({ code, lang, language = 'javascript', autorun, autoRun = false, height, showOutputAt, highlightOutput = true, runnerOptions }: CodeRunnerProps) {
  const [outputs, setOutputs] = useState<CodeRunnerOutput[]>()
  const [running, setRunning] = useState(false)
  const highlighter = useRef<(code: string, lang: string) => string>()
  const generation = useRef(0)
  const hasRun = useRef(false)
  const { $renderContext } = useSlideContext()
  const { isPrintMode } = useNav()
  const { isActive } = useClicksInfo(showOutputAt ?? false)
  const disabled = !['slide', 'presenter'].includes($renderContext)
  const mode = isPrintMode ? 'once' : autorun ?? autoRun
  const runCode = useCallback(async () => {
    if (disabled) return
    const request = ++generation.current
    hasRun.current = true
    setRunning(true)
    try {
      const { run, highlight } = await setupCodeRunners()
      const result = await run(code, lang ?? language, runnerOptions ?? {})
      if (request !== generation.current) return
      highlighter.current = highlight
      setOutputs(resolveOutputs(result))
    } catch (error) {
      if (request === generation.current) setOutputs([{ error: String(error) }])
    } finally {
      if (request === generation.current) setRunning(false)
    }
  }, [code, lang, language, runnerOptions, disabled])
  useEffect(() => {
    if (!mode || (mode === 'once' && hasRun.current)) return
    const timer = setTimeout(() => void runCode(), 200)
    return () => clearTimeout(timer)
  }, [mode, runCode])
  useEffect(() => () => { generation.current++ }, [])
  return <>
    <div className="relative flex flex-col rounded-b border-t border-main" style={{ height, display: showOutputAt && !isActive ? 'none' : undefined }} data-waitfor=".slidev-runner-output">
      {disabled ? <div className="text-sm text-center opacity-50">Code is disabled in the "{$renderContext}" mode</div>
        : running ? <div className="text-sm text-center opacity-50">Running...</div>
          : !outputs ? <div className="text-sm text-center opacity-50">Click the play button to run the code</div>
            : <div className="slidev-runner-output">{outputs.map((output, index) => {
                if ('html' in output) return <div key={index} dangerouslySetInnerHTML={{ __html: output.html }} />
                if ('error' in output) return <div key={index} className="text-red-500">{output.error}</div>
                if ('element' in output) return <DomOutput key={index} element={output.element} />
                const items = Array.isArray(output) ? output : [output]
                return <div key={index} className="output-line">{items.map((item, i) => <Fragment key={i}>
                  {highlightOutput && item.highlightLang && highlighter.current
                    ? <span className="highlighted" dangerouslySetInnerHTML={{ __html: highlighter.current(item.text, item.highlightLang) }} />
                    : <span className={item.class}>{item.text}</span>}
                  {i < items.length - 1 && <span className="separator">,</span>}
                </Fragment>)}</div>
              })}</div>}
    </div>
    {code.trim() && !disabled && <div className="absolute right-1 top-1 max-h-full flex gap-1"><IconButton title="Run code" className="w-8 h-8" onClick={() => void runCode()}><div className="i-carbon:play" /></IconButton></div>}
  </>
}
