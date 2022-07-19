import { Edge, Node } from 'react-flow-renderer'

export type MmdVertexRaw = {
  id: string
  text: string
  type: string
}
export type MmdVertex = MmdVertexRaw & {
  outside: boolean
}
export type MmdEdge = {
  start: string
  end: string
  stroke: 'normal' | 'thick' | 'dotted'
  type: 'arrow_point' | 'arrow_open' | 'double_arrow_cross' | 'arrow_circle'
  text: string
}

export type Position = {
  x: number
  y: number
  id: string
  children?: Position[]
}

export type Graph = {
  vertices: MmdVertex[]
  edges: MmdEdge[]
  flows: { nodes: Node<MmdVertex & { label: string }>[]; edges: Edge[] }
}

export type MmdGroup = {
  text: string
  vertices: MmdVertex[]
  edges: MmdEdge[]
}
