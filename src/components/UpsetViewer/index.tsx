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

type Elem = { name: string; sets: string[] }
type ViewMode = 'upset' | 'venn' | 'karnaugh'

const DEFAULT_INPUT = `A: 1, 2, 3, 4, 5
B: 3, 4, 5, 6, 7
C: 5, 6, 7, 8, 9`

const parseInput = (input: string): Elem[] => {
  const setMap = new Map<string, string[]>()

  input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) return
      const setName = line.slice(0, colonIndex).trim()
      const elements = line
        .slice(colonIndex + 1)
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)

      elements.forEach((el) => {
        const existing = setMap.get(el)
        if (existing) {
          existing.push(setName)
        } else {
          setMap.set(el, [setName])
        }
      })
    })

  return [...setMap.entries()].map(([name, sets]) => ({ name, sets }))
}

const UpsetViewer = () => {
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [selection, setSelection] = useState<ISetLike<Elem> | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('upset')
  const [isDark, setIsDark] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const elems = useMemo(() => parseInput(input), [input])
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
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sets (1行に1集合: &quot;名前: 要素1, 要素2, ...&quot;)
        </Typography>
        <TextField
          multiline
          fullWidth
          minRows={3}
          maxRows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'A: 1, 2, 3\nB: 2, 3, 4'}
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
