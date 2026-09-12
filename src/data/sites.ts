import type { IconType } from 'react-icons'
import { FaGlobe, FaSquareRootAlt, FaTools } from 'react-icons/fa'

export type AnozonSite = {
  id: string
  label: string
  href: string
  icon: IconType
}

// anozon 系サイト共通の定義。並び順まで含めて
// docs/site-chrome.md を正本とする (math-kb 側の src/data/sites.ts と同じ内容)
export const ANOZON_SITES: AnozonSite[] = [
  { id: 'me', label: 'anozon.me', href: 'https://anozon.me', icon: FaGlobe },
  {
    id: 'tools',
    label: 'tools',
    href: 'https://tools.anozon.me',
    icon: FaTools,
  },
  {
    id: 'mathkb',
    label: 'mathkb',
    href: 'https://mathkb.anozon.me',
    icon: FaSquareRootAlt,
  },
]

export const SITE_ID = 'tools'
export const SITE_NAME = 'anozon/tools'
export const SITE_TAGLINE = 'mini web tools by anozon'
export const SITE_REPO = 'https://github.com/elzup/tools'
