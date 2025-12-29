import {
  Box,
  Button,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { DistributionParams } from '../../lib/norm-estimator'
import {
  AUTO_SAVE_INTERVAL,
  AUTO_SAVE_MAX,
  SavedEntry,
  STORAGE_KEY,
} from './types'

// サマリーラベル生成
export function generateLabel(params: DistributionParams): string {
  const parts: string[] = []
  if (params.mean !== undefined) parts.push(`μ=${params.mean}`)
  if (params.stdDev !== undefined) parts.push(`σ=${params.stdDev}`)
  if (params.conditions.length > 0) {
    const conds = params.conditions
      .filter((c) => c.value !== undefined && c.percentage !== undefined)
      .map((c) => `${c.value}pt/${c.percentage}%`)
      .slice(0, 2)
    if (conds.length > 0) parts.push(conds.join(', '))
  }
  return parts.length > 0 ? parts.join(' | ') : 'empty'
}

// localStorage 操作
export function loadSavedEntries(): SavedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSavedEntries(entries: SavedEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// 手動保存関数
export function saveManually(params: DistributionParams) {
  const entries = loadSavedEntries()
  const newEntry: SavedEntry = {
    id: `manual-${Date.now()}`,
    params,
    label: generateLabel(params),
    savedAt: Date.now(),
    isAuto: false,
  }
  saveSavedEntries([newEntry, ...entries])
}

// 自動保存フック
export function useAutoSave(params: DistributionParams) {
  const lastSavedRef = useRef<string>('')
  const lastSaveTimeRef = useRef<number>(0)

  useEffect(() => {
    const currentJson = JSON.stringify(params)

    // Skip empty params
    if (
      params.conditions.length === 0 &&
      params.mean === undefined &&
      params.stdDev === undefined
    ) {
      return
    }

    // Check if changed
    if (currentJson === lastSavedRef.current) {
      return
    }

    // Check interval
    const now = Date.now()
    if (now - lastSaveTimeRef.current < AUTO_SAVE_INTERVAL) {
      return
    }

    // Auto save
    const entries = loadSavedEntries()
    const autoEntries = entries.filter((e) => e.isAuto)
    const manualEntries = entries.filter((e) => !e.isAuto)

    const newEntry: SavedEntry = {
      id: `auto-${now}`,
      params,
      label: generateLabel(params),
      savedAt: now,
      isAuto: true,
    }

    // Keep only latest AUTO_SAVE_MAX auto entries
    const updatedAuto = [newEntry, ...autoEntries].slice(0, AUTO_SAVE_MAX)
    const updated = [...manualEntries, ...updatedAuto]

    saveSavedEntries(updated)
    lastSavedRef.current = currentJson
    lastSaveTimeRef.current = now
  }, [params])
}

// 保存ライブラリコンポーネント
export function SavedLibrary({
  setParams,
  onSave,
}: {
  params: DistributionParams
  setParams: (params: DistributionParams) => void
  onSave: () => void
}) {
  const [entries, setEntries] = useState<SavedEntry[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setEntries(loadSavedEntries())
  }, [])

  const manualEntries = entries.filter((e) => !e.isAuto)
  const autoEntries = entries.filter((e) => e.isAuto)

  const handleRestore = (entry: SavedEntry) => {
    setParams(entry.params)
  }

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id)
    setEntries(updated)
    saveSavedEntries(updated)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="subtitle2">
          Saved ({manualEntries.length} + {autoEntries.length} auto)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" onClick={onSave}>
            Save
          </Button>
          <Button size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide' : 'Show'}
          </Button>
        </Stack>
      </Stack>

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {manualEntries.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary">
                Manual
              </Typography>
              <List dense disablePadding>
                {manualEntries.map((entry) => (
                  <ListItem
                    key={entry.id}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                      >
                        ×
                      </IconButton>
                    }
                  >
                    <ListItemButton onClick={() => handleRestore(entry)} dense>
                      <ListItemText
                        primary={entry.label}
                        secondary={formatTime(entry.savedAt)}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {autoEntries.length > 0 && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                Auto-saved
              </Typography>
              <List dense disablePadding>
                {autoEntries.slice(0, 5).map((entry) => (
                  <ListItem
                    key={entry.id}
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDelete(entry.id)}
                      >
                        ×
                      </IconButton>
                    }
                  >
                    <ListItemButton onClick={() => handleRestore(entry)} dense>
                      <ListItemText
                        primary={entry.label}
                        secondary={formatTime(entry.savedAt)}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                          color: 'text.secondary',
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {entries.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No saved entries
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  )
}
