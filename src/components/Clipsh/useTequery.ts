import { useMemo } from 'react'
import { tequery } from 'tequery'

export const useTequery = (base: string, query: string) =>
  useMemo(() => tequery(base, query), [query, base])
