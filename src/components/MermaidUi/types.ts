import { Edge, Node } from 'react-flow-renderer'

export type MmdVertex = {
  id: string
  text: string
  type: string
}
export type MmdEdge = {
  start: string
  end: string
  stroke: 'normal' | 'thick' | 'dotted'
  type: 'arrow_point' | 'arrow_open'
  text: string
}

export type Elem = Node<MmdVertex & { label: string }> | Edge
export type Position = { x: number; y: number; id: string }

export type Graph = {
  vertices: MmdVertex[]
  edges: MmdEdge[]
  flows: Elem[]
}
