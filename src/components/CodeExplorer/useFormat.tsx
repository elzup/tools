import { useMemo, useState } from 'react'
import { Cmd, getFormat } from './utils'

export const useFormat = (buf: Buffer) => {
  const [format, setFormat] = useState<string>('')

  const parsed = useMemo(() => {
    const bufs: { cmd: Cmd; buf: Buffer }[] = []
    let p = 0

    format.split('').forEach((cmd) => {
      console.log(getFormat(cmd), cmd)

      const f = getFormat(cmd)

      if (f === null) return

      bufs.push({ cmd, buf: buf.subarray(p, p + f.len) })
      p = p + f.len
    })
    return bufs
  }, [buf, format])

  return { format, setFormat, parsed }
}
