import through from 'through'
import ReactDOM from 'react-dom'
import React, { PropsWithChildren } from 'react'
import { createRoot } from 'react-dom/client'

export const zoom1D = (
  s: number,
  e: number,
  p: number,
  scale = 2
): [number, number] => {
  const d = e - s
  const o = s + d * p
  const r = d / scale / 2

  return [o - r, o + r]
}

export const zoom2D = (
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  px: number,
  py: number,
  scale = 2
) => {
  const [nsx, nex] = zoom1D(sx, ex, px, scale)
  const [nsy, ney] = zoom1D(sy, ey, py, scale)

  return [nsx, nex, nsy, ney]
}

export const sleep = (msec: number) =>
  new Promise((resolve) => setTimeout(resolve, msec))

export const delay = (time: number) => {
  const queue: unknown[] = []

  function next(data: unknown) {
    queue.push(data)
    setTimeout(function () {
      ts.queue(queue.shift())
    }, time)
  }

  const ts = through(
    (data) => next(data),
    () => next(null)
  )

  return ts
}
export const sum = (a: number, b: number) => a + b

export const noop = () => {}

export function getComponentHtmlCode(component: React.ReactElement) {
  const container = document.createElement('div')
  const root = createRoot(container)

  root.render(component)

  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(container.innerHTML)
    }, 0)
  })
}

export const asciify = (s: string) => s.replace(/[^\x20-\x7e\n]*/g, '')

export type WithChild = PropsWithChildren
