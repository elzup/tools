import { useCallback, useEffect, useState } from 'react'

type KeyEvent = (key: string) => void

export const useRefKeyPress = ({
  onKeyDown,
  onKeyUp,
}: {
  onKeyDown?: KeyEvent
  onKeyUp?: KeyEvent
}) => {
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
  const { ref } = useRefKeyPress(events)
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
