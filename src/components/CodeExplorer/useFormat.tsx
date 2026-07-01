import { useMemo, useState } from 'react'
import { type Cmd, getFormat } from './utils'

export const useFormat = (buf: Buffer, initialFormat = '') => {
  const [format, setFormat] = useState<string>(initialFormat)

  const parsed = useMemo(() => {
    const bufs: { cmd: Cmd; buf: Buffer }[] = []
    let p = 0

    format.split('').forEach((cmd) => {
      const f = getFormat(cmd)

      if (f === null) return

      bufs.push({ cmd, buf: buf.subarray(p, p + f.len) })
      p = p + f.len
    })
    return bufs
  }, [buf, format])

  return { format, setFormat, parsed }
}
