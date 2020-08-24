import { RefObject, useEffect, useState } from 'react'

// Hook
export function useWindowSize(ref: RefObject<HTMLElement>) {
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

    return () => {}
  }, [!ref.current]) // Empty array ensures that effect is only run on mount

  return windowSize
}
