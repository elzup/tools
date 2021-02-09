import { RefObject, useEffect, useState } from 'react'

// Hook
export function useWidth(ref: RefObject<HTMLElement>) {
  const [windowSize, setWindowSize] = useState<{
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    if (!ref.current) return
    setWindowSize({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
    })
  }, [!ref.current])

  return windowSize
}
