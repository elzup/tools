import { useEffect, useReducer, useRef } from 'react'
import { useKey } from 'react-use'
import { Handler } from 'react-use/lib/useKey'
import { noop } from '../utils'

const mapReducer = (
  v: Record<string, boolean>,
  { key, down }: { key: string; down: boolean }
) => ({ ...v, [key]: down })

export const useKeyPressAll = (
  keydown: Handler,
  keyup: Handler = noop,
  keydownAll: Handler = noop
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

export const useRefKey = <T extends HTMLElement>(
  keydown: Handler = noop,
  keyup: Handler = noop
) => {
  const ref = useRef<T>(null)

  useKey(() => true, keydown, { event: 'keyup', target: ref.current })
  useKey(() => true, keyup, { event: 'keyup', target: ref.current })
  // TODO: Element assign
  useEffect(() => {
    if (!ref.current) return
    ref.current.setAttribute('tabIndex', '-1')
  }, [ref.current])
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
