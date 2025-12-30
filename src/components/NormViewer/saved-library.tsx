import {
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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

  useEffect(() => {
    setEntries(loadSavedEntries())
  }, [])

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

  // 最新5件のみ表示
  const displayEntries = entries.slice(0, 5)

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          履歴 ({entries.length})
        </Typography>
        <Button size="small" variant="outlined" onClick={onSave} sx={{ py: 0, minHeight: 24 }}>
          保存
        </Button>
      </Stack>

      {displayEntries.length > 0 ? (
        <TableContainer>
          <Table size="small" sx={{ '& td': { py: 0.3, px: 0.5, border: 0 } }}>
            <TableBody>
              {displayEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  onClick={() => handleRestore(entry)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ width: 60, color: 'text.secondary' }}>
                    <Typography variant="caption">
                      {formatTime(entry.savedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        color: entry.isAuto ? 'text.secondary' : 'text.primary',
                        fontFamily: 'monospace',
                      }}
                      noWrap
                    >
                      {entry.label}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ width: 24 }}>
                    <IconButton
                      size="small"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        handleDelete(entry.id)
                      }}
                      sx={{ p: 0, fontSize: '0.75rem' }}
                    >
                      ×
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="caption" color="text.secondary">
          なし
        </Typography>
      )}
    </Paper>
  )
}
