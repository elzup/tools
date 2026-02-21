import { useMemo, useState, useCallback, useRef } from 'react'
import {
  Box,
  TextField,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material'
import {
  extractCombinations,
  UpSetJS,
  VennDiagram,
  KarnaughMap,
  ISetLike,
  exportSVG,
} from '@upsetjs/react'

import { Elem, ParserType, parsers, PARSER_TYPES } from './parsers'

type ViewMode = 'upset' | 'venn' | 'karnaugh'

const UpsetViewer = () => {
  const [parserType, setParserType] = useState<ParserType>('setList')
  const parser = parsers[parserType]
  const [input, setInput] = useState(parser.defaultInput)
  const [selection, setSelection] = useState<ISetLike<Elem> | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('upset')
  const [isDark, setIsDark] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleParserChange = useCallback(
    (newType: ParserType) => {
      setParserType(newType)
      setInput(parsers[newType].defaultInput)
    },
    []
  )

  const elems = useMemo(() => parser.parse(input), [parser, input])
  const { sets, combinations } = useMemo(
    () => extractCombinations(elems),
    [elems]
  )

  const handleHover = useCallback(
    (s: ISetLike<Elem> | null) => setSelection(s),
    []
  )
  const handleClick = useCallback(
    (s: ISetLike<Elem> | null) => setSelection(s),
    []
  )

  const handleExport = useCallback((type: 'svg' | 'png') => {
    if (!svgRef.current) return
    exportSVG(svgRef.current, { type, title: 'upset-viewer' })
  }, [])

  const hasEnoughSets = sets.length >= 2
  const canShowVenn = sets.length >= 2 && sets.length <= 3
  const theme = isDark ? 'dark' : 'light'

  const UpSetJSAny = UpSetJS as any
  const VennDiagramAny = VennDiagram as any
  const KarnaughMapAny = KarnaughMap as any

  const selectedElements = selection
    ? `${selection.name}: [${[...selection.elems].map((e) => e.name).join(', ')}]`
    : ''

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {PARSER_TYPES.length > 1 && (
          <ToggleButtonGroup
            value={parserType}
            exclusive
            onChange={(_, v) => v && handleParserChange(v)}
            size="small"
          >
            {PARSER_TYPES.map((t) => (
              <ToggleButton key={t} value={t}>
                {parsers[t].label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        <TextField
          multiline
          fullWidth
          minRows={3}
          maxRows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={parser.placeholder}
          variant="outlined"
          size="small"
        />
      </Paper>

      {hasEnoughSets && (
        <>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, v) => v && setViewMode(v)}
                size="small"
              >
                <ToggleButton value="upset">UpSet</ToggleButton>
                {canShowVenn && <ToggleButton value="venn">Venn</ToggleButton>}
                <ToggleButton value="karnaugh">Karnaugh</ToggleButton>
              </ToggleButtonGroup>

              <FormControlLabel
                control={
                  <Switch
                    checked={isDark}
                    onChange={(e) => setIsDark(e.target.checked)}
                    size="small"
                  />
                }
                label="Dark"
              />

              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleExport('svg')}
                >
                  SVG
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleExport('png')}
                >
                  PNG
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper
            sx={{
              p: 2,
              bgcolor: isDark ? '#1e1e1e' : undefined,
            }}
          >
            {viewMode === 'upset' && (
              <UpSetJSAny
                ref={svgRef}
                sets={sets}
                combinations={combinations}
                width={780}
                height={400}
                selection={selection}
                onHover={handleHover}
                onClick={handleClick}
                theme={theme}
              />
            )}

            {viewMode === 'venn' && canShowVenn && (
              <VennDiagramAny
                ref={svgRef}
                sets={sets}
                combinations={combinations}
                width={500}
                height={350}
                selection={selection}
                onHover={handleHover}
                onClick={handleClick}
                theme={theme}
              />
            )}

            {viewMode === 'karnaugh' && (
              <KarnaughMapAny
                ref={svgRef}
                sets={sets}
                combinations={combinations}
                width={600}
                height={400}
                selection={selection}
                onHover={handleHover}
                onClick={handleClick}
                theme={theme}
              />
            )}
          </Paper>

          {selectedElements && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedElements}
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  )
}

export default UpsetViewer
