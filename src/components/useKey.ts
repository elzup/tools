import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useKey } from 'react-use'
import { Handler } from 'react-use/lib/useKey'

type KeyElement = HTMLElement | null
export type KeyHandler = Handler

export const useKeyEvent = (
  eventType: 'keypress' | 'keydown' | 'keyup',
  onKeyEvent: KeyHandler | undefined,
  element: KeyElement
) => {
  const handler = useMemo(() => onKeyEvent, [onKeyEvent])

  useEffect(() => {
    const isSupported = element && element.addEventListener

    if (!isSupported || !handler) return

    element.addEventListener(eventType, handler)

    return () => {
      element.removeEventListener(eventType, handler)
    }
  }, [eventType, element, handler])
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

/** @deprecated */
export const useGlobalKeyOld = (events: {
  onKeyDown?: KeyHandler
  onKeyUp?: KeyHandler
}) => useKeyEvents(events, getWindow()?.document.body || null)

export const useKeyPressAll = () => {
  const [map, set] = useState<Record<string, boolean>>({})
  const [last, setLast] = useState<KeyboardEvent | null>(null)

  useKey(
    () => true,
    (e) => {
      set((v) => ({ ...v, [e.key]: true }))
      setLast(e)
    },
    { event: 'keydown' }
  )
  useKey(
    () => true,
    (e) => {
      set((v) => ({ ...v, [e.key]: false }))
      setLast(e)
    },
    { event: 'keyup' }
  )
  return { map, last }
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export const useKeyPressEventAll = (
  keydown: KeyHandler,
  keyup?: KeyHandler
) => {
  const pressed = useKeyPressAll()
  const prev = usePrevious(pressed)

  useEffect(() => {
    const key = pressed.last?.key

    if (!pressed.last || !key || !pressed.map[key]) return
    const isDownPrev = prev?.map[key]
    const isDown = pressed.map[key]

    if (isDown === isDownPrev) return

    if (isDown) {
      keydown(pressed.last)
    } else {
      keyup?.(pressed.last)
    }
  }, [prev, pressed])
}

export const useRefKey = (events: {
  onKeyDown?: KeyHandler
  onKeyUp?: KeyHandler
}) => {
  const ref = useRef<HTMLElement>(null)

  useKeyEvents(events, ref.current)
  return ref
}

const updateQueue = <T>(arr: T[], size: number, item: T) =>
  [...arr, item].slice(-size)

export const useQueue = <T>(size: number, initArr: T[] = []) => {
  return useReducer((v: T[], item: T) => updateQueue(v, size, item), initArr)
}

export const useKeyQueue = () => {
  const [downQueue, setDownQueue] = useQueue<string>(10)
  const [upQueue, setUpQueue] = useQueue<string>(10)

  useKeyPressEventAll(
    ({ key }) => {
      setDownQueue(key)
    },
    ({ key }) => {
      setUpQueue(key)
    }
  )

  return {
    downQueue,
    upQueue,
  }
}
