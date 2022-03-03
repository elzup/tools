import { useEffect, useState } from 'react'
import { readClipboard, writeClipboard } from '../../lib/clipboard'
import { useTequery } from './useTequery'

export const useClipsh = () => {
  const [query, setQuery] = useState<string>('')
  const [base, setBase] = useState<string>('')

  useEffect(() => {
    readClipboard().then(setBase)
  }, [])
  const teq = useTequery(base, query)

  return {
    query,
    setQuery,
    teq,
    base,
    setBase,
    beforeLn: base.split('\n').length,
    afterLn: teq.result.length,
    saveText: () => {
      writeClipboard(teq.result)
    },
  }
}
