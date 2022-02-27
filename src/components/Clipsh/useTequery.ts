import { useMemo, useState } from 'react'
import { tequery } from 'tequery'
import { readClipboard } from '../../lib/clipboard'

export const useTeQuery = () => {
  const [query, setQuery] = useState<string>('')
  const base = useMemo(readClipboard, [])

  const result = useMemo(() => {
    return tequery(base, query)
  }, [query, base])

  return { query, setQuery, result, base }
}
