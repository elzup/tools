import { useEffect, useRef, useState } from 'react'

type KeyEvent = (key: string) => void

type KeyElement = HTMLElement | null

export const useKeyEvent = (
  eventType: 'keypress' | 'keydown' | 'keyup',
  onKeyEvent: KeyEvent | undefined,
  element: KeyElement
) => {
  const handler = useRef<KeyEvent>()

  useEffect(() => {
    handler.current = onKeyEvent
  }, [onKeyEvent])

  useEffect(() => {
    const isSupported = element && element.addEventListener

    if (!isSupported) return

    const handleKeyDown = ({ key }: KeyboardEvent) => handler.current?.(key)

    element.addEventListener(eventType, handleKeyDown)

    return () => {
      element.removeEventListener(eventType, handleKeyDown)
    }
  }, [eventType, element])
}

export const useKeyEvents = (
  { onKeyDown, onKeyUp }: { onKeyDown?: KeyEvent; onKeyUp?: KeyEvent },
  element: KeyElement
) => {
  useKeyEvent('keyup', onKeyUp, element)
  useKeyEvent('keydown', onKeyDown, element)
}

export const useGlobalKey = (events: {
  onKeyDown?: KeyEvent
  onKeyUp?: KeyEvent
}) => useKeyEvents(events, window.document.body)

export const useKeyJust = ({
  onKeyDownJust,
  onKeyUpJust,
}: {
  onKeyDownJust?: KeyEvent
  onKeyUpJust?: KeyEvent
}) => {
  const [pressed, setPressed] = useState<Record<string, boolean>>({})

  const handleKeyDown = (key: string) => {
    if (pressed[key]) return

    onKeyDownJust?.(key)
    setPressed((v) => ({ ...v, [key]: true }))
  }
  const handleKeyUp = (key: string) => {
    if (!pressed[key]) return

    onKeyUpJust?.(key)
    setPressed((v) => ({ ...v, [key]: false }))
  }

  return { handleKeyDown, handleKeyUp }
}

export const useRefKey = (events: {
  onKeyDown?: KeyEvent
  onKeyUp?: KeyEvent
}) => {
  const ref = useRef<HTMLElement>(null)

  useKeyEvents(events, ref.current)
  return ref
}

export const useKeyQueue = () => {
  const [pressQueue, setPressQueue] = useState<string[]>([])
  const [changePressQueue, setChangePressQueue] = useState<string[]>([])

  useGlobalKey({
    onKeyDown: (key: string) => {
      handleKeyDown(key)
      setPressQueue((v) => [...v, key].slice(-10))
    },
    onKeyUp: (key: string) => {
      handleKeyUp(key)
    },
  })

  const { handleKeyDown, handleKeyUp } = useKeyJust({
    onKeyDownJust: (key: string) => {
      setChangePressQueue((v) => [...v, key].slice(-10))
    },
  })

  return {
    pressQueue,
    changePressQueue,
  }
}
