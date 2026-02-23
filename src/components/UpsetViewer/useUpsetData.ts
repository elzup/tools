import { useMemo, useState, useCallback, useRef } from 'react'
import { extractCombinations, ISetLike, exportSVG } from '@upsetjs/react'
import { Elem, ParserType, parsers } from './parsers'

export const useUpsetData = () => {
  const [parserType, setParserType] = useState<ParserType>('setList')
  const parser = parsers[parserType]
  const [input, setInput] = useState(parser.defaultInput)

  const handleParserChange = useCallback((newType: ParserType) => {
    setParserType(newType)
    setInput(parsers[newType].defaultInput)
  }, [])

  const elems = useMemo(() => parser.parse(input), [parser, input])
  const { sets, combinations } = useMemo(
    () => extractCombinations(elems),
    [elems]
  )

  const hasEnoughSets = sets.length >= 2
  const canShowVenn = sets.length >= 2 && sets.length <= 3

  return {
    parserType,
    parser,
    input,
    setInput,
    handleParserChange,
    sets,
    combinations,
    hasEnoughSets,
    canShowVenn,
  }
}

export const useChartInteraction = () => {
  const [selection, setSelection] = useState<ISetLike<Elem> | null>(null)

  const handleHover = useCallback(
    (s: ISetLike<Elem> | null) => setSelection(s),
    []
  )
  const handleClick = useCallback(
    (s: ISetLike<Elem> | null) => setSelection(s),
    []
  )

  const selectedElements = selection
    ? `${selection.name}: [${[...selection.elems].map((e) => e.name).join(', ')}]`
    : ''

  return { selection, handleHover, handleClick, selectedElements }
}

export const useChartExport = () => {
  const svgRef = useRef<SVGSVGElement>(null)

  const handleExport = useCallback((type: 'svg' | 'png') => {
    if (!svgRef.current) return
    exportSVG(svgRef.current, { type, title: 'upset-viewer' })
  }, [])

  return { svgRef, handleExport }
}
