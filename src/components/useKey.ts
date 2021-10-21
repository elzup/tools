import { useEffect, useRef, useState } from 'react'
import { useKey, useKeyPress, useKeyPressEvent } from 'react-use'
import { Handler } from 'react-use/lib/useKey'

type KeyElement = HTMLElement | null
export type KeyHandler = (event: KeyboardEvent) => void

export const useKeyEvent = (
  eventType: 'keypress' | 'keydown' | 'keyup',
  onKeyEvent: KeyHandler | undefined,
  element: KeyElement
) => {
  const handler = useRef<KeyHandler>()

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
  { onKeyDown, onKeyUp }: { onKeyDown?: KeyHandler; onKeyUp?: KeyHandler },
  element: KeyElement
) => {
  useKeyEvent('keyup', onKeyUp, element)
  useKeyEvent('keydown', onKeyDown, element)
}

const getWindow = () => {
  if (typeof window !== 'undefined') return window
  return null
}

export const useGlobalKey = (keydown: Handler, keyup: Handler) => {
  useKeyPressEvent(() => true, keydown)
}
export const useKeyPressAll = useKeyPressEvent.bind(null, () => true)
// export const useKeyPressAll = (...args) => useKeyPressEvent(() => true, ...args) みたいな感じ

/** @deprecated */
export const useGlobalKeyOld = (events: {
  onKeyDown?: KeyHandler
  onKeyUp?: KeyHandler
}) => useKeyEvents(events, getWindow()?.document.body || null)

export const useKeyJust = ({
  onKeyDownJust,
  onKeyUpJust,
}: {
  onKeyDownJust?: KeyHandler
  onKeyUpJust?: KeyHandler
}) => {
  const [pressed, setPressed] = useState<Record<string, boolean>>({})

  const handleKeyDown: KeyHandler = (e) => {
    if (pressed[e.key]) return

    onKeyDownJust?.(e)
    setPressed((v) => ({ ...v, [e.key]: true }))
  }
  const handleKeyUp: KeyHandler = (e) => {
    if (!pressed[e.key]) return

    onKeyUpJust?.(e)
    setPressed((v) => ({ ...v, [e.key]: false }))
  }

  return { handleKeyDown, handleKeyUp }
}

export const useRefKey = (events: {
  onKeyDown?: KeyHandler
  onKeyUp?: KeyHandler
}) => {
  const ref = useRef<HTMLElement>(null)

  useKeyEvents(events, ref.current)
  return ref
}

export const useKeyQueue = () => {
  const [pressQueue, setPressQueue] = useState<string[]>([])
  const [changePressQueue, setChangePressQueue] = useState<string[]>([])

  useGlobalKey({
    onKeyDown: (e) => {
      handleKeyDown(e)
      setPressQueue((v) => [...v, e.key].slice(-10))
    },
    onKeyUp: (e) => {
      handleKeyUp(e)
    },
  })

  const { handleKeyDown, handleKeyUp } = useKeyJust({
    onKeyDownJust: ({ key }) => {
      setChangePressQueue((v) => [...v, key].slice(-10))
    },
  })

  return {
    pressQueue,
    changePressQueue,
  }
}
