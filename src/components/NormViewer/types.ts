import { DistributionParams } from '../../lib/norm-estimator'

// 保存データの型
export type SavedEntry = {
  id: string
  params: DistributionParams
  label: string
  savedAt: number
  isAuto: boolean
}

export const STORAGE_KEY = 'norm-viewer-saved'
export const AUTO_SAVE_MAX = 10
export const AUTO_SAVE_INTERVAL = 60000 // 1 minute
