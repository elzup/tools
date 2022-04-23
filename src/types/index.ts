import { PropsWithChildren } from 'react'

export type Dict<T> = Record<string, T>
export type WithChild<P = {}> = PropsWithChildren<P>
