import { useEffect, useState } from 'react'
import { readClipboard, writeClipboard } from '../../lib/clipboard'
import { useLocalStorage } from '../../utils/useLocalStorage'
import { useTequeryMeta } from './useTequery'

export const useClipsh = () => {
  const [query, setQuery] = useState<string>('')
  const [base, setBase] = useState<string>('')
  const [history, pushHistory] = useLocalStorage<string[]>('clipsh-history', [])

  const syncClipboard = () => readClipboard().then(setBase)

  useEffect(() => {
    syncClipboard()
  }, [])

  const { teq, meta } = useTequeryMeta(base, query)

  // const  = useTequery(base, query)

  return {
    query,
    setQuery,
    teq,
    meta,
    base,
    setBase,
    beforeLn: base.split('\n').length,
    afterLn: teq.result.length,
    history,
    pushHistory,
    saveText: () => {
      writeClipboard(teq.result)
    },
    syncClipboard,
  }
}
