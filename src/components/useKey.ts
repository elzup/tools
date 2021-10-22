import { useEffect, useMemo, useReducer, useRef } from 'react'
import { useKey } from 'react-use'
import { Handler } from 'react-use/lib/useKey'
import { noop } from '../utils'

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

const mapReducer = (
  v: Record<string, boolean>,
  { key, down }: { key: string; down: boolean }
) => ({ ...v, [key]: down })

export const useKeyPressAll = (
  keydown: KeyHandler,
  keyup: KeyHandler = noop,
  keydownAll: KeyHandler = noop
) => {
  const [downs, set] = useReducer(mapReducer, {} as Record<string, boolean>)

  useKey(
    () => true,
    (e) => {
      keydownAll(e)
      if (!downs[e.key]) keydown(e)
      set({ key: e.key, down: true })
    },
    { event: 'keydown' }
  )
  useKey(
    () => true,
    (e) => {
      if (downs[e.key]) keyup(e)
      set({ key: e.key, down: false })
    },
    { event: 'keyup' }
  )
  return { downs }
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
  const [downAllQueue, setDownAllQueue] = useQueue<string>(10)
  const [upQueue, setUpQueue] = useQueue<string>(10)

  useKeyPressAll(
    ({ key }) => {
      setDownQueue(key)
    },
    ({ key }) => {
      setUpQueue(key)
    },
    ({ key }) => {
      setDownAllQueue(key)
    }
  )

  return {
    downQueue,
    downAllQueue,
    upQueue,
  }
}
