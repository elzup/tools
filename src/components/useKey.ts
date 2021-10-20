import { useCallback, useEffect, useState, useRef } from 'react'

type KeyEvent = (key: string) => void

type KeyElement = HTMLElement | Window | null

export const useKeyPress = ({
  element = window,
  onKeyDown = () => {},
  onKeyUp = () => {},
}: {
  element: KeyElement
  onKeyDown: KeyEvent
  onKeyUp: KeyEvent
}) => {
  const keyDownHandler = useRef<KeyEvent>()
  const keyUpHandler = useRef<KeyEvent>()

  useEffect(() => {
    keyDownHandler.current = onKeyDown
  }, [onKeyDown])

  useEffect(() => {
    keyUpHandler.current = onKeyUp
  }, [onKeyUp])

  useEffect(
    () => {
      const isSupported = element && element.addEventListener

      if (!isSupported) return
      const handleKeyDown = ({ key }: KeyboardEvent) => {
        keyDownHandler.current?.(key)
      }
      const handleKeyUp = ({ key }: KeyboardEvent) => {
        keyUpHandler.current?.(key)
      }

      element.addEventListener('keydown', handleKeyDown)
      element.addEventListener('keyup', handleKeyUp)

      return () => {
        // element.removeEventListener(eventName, eventListener)
      }
    },
    [eventName, element] // Re-run if eventName or element changes
  )
  const ref = useCallback(
    (node: HTMLElement) => {
      if (node === null) return
      const upHandler = ({ key }: KeyboardEvent) => onKeyDown?.(key)
      const downHandler = ({ key }: KeyboardEvent) => onKeyUp?.(key)

      node.addEventListener('keydown', downHandler)
      node.addEventListener('keyup', upHandler)

      return () => {
        node.removeEventListener('keydown', downHandler)
        node.removeEventListener('keyup', upHandler)
      }
    },
    [onKeyDown, onKeyUp]
  )

  return { ref }
}

export const useGlobalKeyPress = (events: {
  onKeyDown?: KeyEvent
  onKeyUp?: KeyEvent
}) => {
  // const { ref } = useRefKeyPress(events)

  const { onKeyDown, onKeyUp } = events

  useEffect(() => {
    console.log('global registered')

    const upHandler = ({ key }: KeyboardEvent) => onKeyDown?.(key)
    const downHandler = ({ key }: KeyboardEvent) => onKeyUp?.(key)

    window.addEventListener('keydown', downHandler)
    window.addEventListener('keyup', upHandler)

    return () => {
      window.removeEventListener('keydown', downHandler)
      window.removeEventListener('keyup', upHandler)
    }
  }, [onKeyDown, onKeyUp])
}

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

export const useGlobalKeyChangePress = ({
  onKeyDown,
  onKeyUp,
  onKeyDownJust,
  onKeyUpJust,
}: {
  onKeyDown?: KeyEvent
  onKeyUp?: KeyEvent
  onKeyDownJust?: KeyEvent
  onKeyUpJust?: KeyEvent
}) => {
  const { handleKeyDown, handleKeyUp } = useKeyJust({
    onKeyDownJust,
    onKeyUpJust,
  })

  useGlobalKeyPress({
    onKeyDown: (key) => {
      onKeyDown?.(key)
      handleKeyDown(key)
    },
    onKeyUp: (key) => {
      onKeyUp?.(key)
      handleKeyUp(key)
    },
  })
}

export const useKeyQueue = () => {
  const [pressQueue, setPressQueue] = useState<string[]>([])
  const [changePressQueue, setChangePressQueue] = useState<string[]>([])

  const { handleKeyDown, handleKeyUp } = useKeyJust({
    onKeyDownJust: (key: string) => {
      setChangePressQueue((v) => [...v, key].slice(-10))
    },
  })

  return {
    handleKeyDown: (key: string) => {
      handleKeyDown(key)
      setPressQueue((v) => [...v, key].slice(-10))
    },
    handleKeyUp: (key: string) => {
      handleKeyUp(key)
    },
    pressQueue,
    changePressQueue,
  }
}

export const useGlobalKeyQueue = () => {
  const { pressQueue, changePressQueue, handleKeyDown, handleKeyUp } =
    useKeyQueue()

  useGlobalKeyPress({ onKeyDown: handleKeyDown, onKeyUp: handleKeyUp })

  return {
    pressQueue,
    changePressQueue,
  }
}
