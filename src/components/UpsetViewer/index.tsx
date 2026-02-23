import { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'

import { parsers, PARSER_TYPES } from './parsers'
import {
  useUpsetData,
  useChartInteraction,
  useChartExport,
} from './useUpsetData'
import { UpsetChart, ViewMode } from './UpsetChart'

const UpsetViewer = () => {
  const {
    parserType,
    parser,
    input,
    setInput,
    handleParserChange,
    sets,
    combinations,
    hasEnoughSets,
    canShowVenn,
  } = useUpsetData()

  const { selection, handleHover, handleClick, selectedElements } =
    useChartInteraction()

  const { svgRef, handleExport } = useChartExport()

  const [viewMode, setViewMode] = useState<ViewMode>('upset')
  const [isDark, setIsDark] = useState(false)
  const [showElements, setShowElements] = useState(false)

  const theme = isDark ? 'dark' : 'light'

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
                <ToggleButton value="all">All</ToggleButton>
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

              <FormControlLabel
                control={
                  <Switch
                    checked={showElements}
                    onChange={(e) => setShowElements(e.target.checked)}
                    size="small"
                  />
                }
                label="Elements"
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
            <UpsetChart
              viewMode={viewMode}
              sets={sets}
              combinations={combinations}
              selection={selection}
              canShowVenn={canShowVenn}
              theme={theme}
              svgRef={svgRef}
              onHover={handleHover}
              onClick={handleClick}
            />
          </Paper>

          {selectedElements && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedElements}
              </Typography>
            </Paper>
          )}

          {showElements && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Elements by Combination
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Combination</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell>Elements</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {combinations.map((combo, i) => {
                      const elems = [...combo.elems]
                      if (elems.length === 0) return null
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <Box
                              sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                            >
                              {combo.name.split('&').map((s) => (
                                <Chip
                                  key={s}
                                  label={s.trim()}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{elems.length}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {elems.map((e) => e.name).join(', ')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  )
}

export default UpsetViewer
