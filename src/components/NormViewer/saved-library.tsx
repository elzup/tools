import {
  Button,
  IconButton,
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

// サマリーラベル生成（改善版）
export function generateLabel(params: DistributionParams): string {
  const parts: string[] = []

  // 条件数
  const validConditions = params.conditions.filter(
    (c) => c.value !== undefined && c.percentage !== undefined
  )
  if (validConditions.length > 0) {
    parts.push(`条件${validConditions.length}件`)
  }

  // データ数
  if (params.rawScores && params.rawScores.length > 0) {
    parts.push(`データ${params.rawScores.length}件`)
  }

  // 平均・標準偏差
  if (params.mean !== undefined) {
    parts.push(`μ=${Number(params.mean.toFixed(1))}`)
  }
  if (params.stdDev !== undefined) {
    parts.push(`σ=${Number(params.stdDev.toFixed(1))}`)
  }

  return parts.length > 0 ? parts.join(' / ') : '(空)'
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
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hour}:${min}`
  }

  // 最新5件のみ表示
  const displayEntries = entries.slice(0, 5)

  return (
    <Paper sx={{ p: 1.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="caption" color="text.secondary">
          履歴 ({entries.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={onSave}
          sx={{ py: 0, minHeight: 24 }}
        >
          保存
        </Button>
      </Stack>

      {displayEntries.length > 0 ? (
        <Stack spacing={0.5}>
          {displayEntries.map((entry) => (
            <Stack
              key={entry.id}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                py: 0.5,
                px: 0.5,
                borderRadius: 0.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {/* 自動/手動 */}
              <Typography
                variant="caption"
                sx={{
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: entry.isAuto ? 'grey.200' : 'primary.light',
                  color: entry.isAuto ? 'text.secondary' : 'primary.contrastText',
                  fontSize: '0.65rem',
                  flexShrink: 0,
                }}
              >
                {entry.isAuto ? '自動' : '手動'}
              </Typography>
              {/* 日時 */}
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary', flexShrink: 0 }}
              >
                {formatTime(entry.savedAt)}
              </Typography>
              {/* 内容 */}
              <Typography
                variant="caption"
                sx={{ fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {entry.label}
              </Typography>
              {/* 復元ボタン */}
              <Button
                size="small"
                variant="text"
                onClick={() => handleRestore(entry)}
                sx={{ py: 0, px: 0.5, minWidth: 0, fontSize: '0.7rem', flexShrink: 0 }}
              >
                復元
              </Button>
              {/* 削除ボタン */}
              <IconButton
                size="small"
                onClick={() => handleDelete(entry.id)}
                sx={{ p: 0.25, color: 'error.main', fontSize: '0.8rem', flexShrink: 0 }}
              >
                ×
              </IconButton>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary">
          なし
        </Typography>
      )}
    </Paper>
  )
}
