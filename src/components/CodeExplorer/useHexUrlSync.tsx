import { useEffect, useRef } from 'react'

const pickHexChar = (s: string) => s.replace(/[^0-9a-f]/gi, '')

// hex を URL の ?hex= と双方向同期する。
// 初回マウント時に URL に hex があれば localStorage より優先して復元し、
// 以降は hex の変更を history.replaceState で URL に反映する (履歴は汚さない)。
export const useHexUrlSync = (hex: string, setHex: (v: string) => void) => {
  const initialized = useRef(false)

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('hex')

    if (fromUrl) setHex(pickHexChar(fromUrl))
    initialized.current = true
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialized.current) return

    const url = new URL(window.location.href)

    if (hex) url.searchParams.set('hex', hex)
    else url.searchParams.delete('hex')

    window.history.replaceState(null, '', url.toString())
  }, [hex])
}
