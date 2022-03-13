import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.text())

export const useFetch = (url: string) => useSWR(url, fetcher)
