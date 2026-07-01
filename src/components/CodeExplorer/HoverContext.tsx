import { createContext, useContext, useMemo, useState } from 'react'
import type { WithChild } from '../../types'

type HoverCtx = {
  hovered: number | null
  setHovered: (i: number | null) => void
}

const Ctx = createContext<HoverCtx>({ hovered: null, setHovered: () => {} })

export const HoverProvider = ({ children }: WithChild) => {
  const [hovered, setHovered] = useState<number | null>(null)
  const value = useMemo(() => ({ hovered, setHovered }), [hovered])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// バイト index を全ビュー横断で共有する。index が未指定のブロックは連動しない。
export const useByteHover = (index?: number) => {
  const { hovered, setHovered } = useContext(Ctx)
  const isHovered = index !== undefined && hovered === index

  const bind =
    index === undefined
      ? {}
      : {
          onMouseEnter: () => setHovered(index),
          onMouseLeave: () => setHovered(null),
        }

  return { isHovered, bind }
}
