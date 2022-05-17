import { useMemo } from 'react'
import { tequery } from 'tequery'
import { suggester } from 'tequery/dist/suggester'

export const useTequery = (base: string, query: string) =>
  useMemo(() => tequery(base, query), [query, base])

export const useTequeryMeta = (base: string, query: string) => {
  const teq = useTequery(base, query)

  const meta = useMemo(() => {
    return {
      len: tequery(base, 'len').result,
      lineNum: tequery(base, 'lineNum').result,
    }
  }, [base])
  const suggestions = useMemo(() => suggester(teq.resultRaw), [teq.resultRaw])

  return { teq, meta, suggestions }
}
