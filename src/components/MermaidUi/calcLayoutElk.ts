// eslint-disable-next-line import/extensions
import ELK from 'elkjs/lib/elk.bundled.js'
import { MmdEdge, MmdVertex, Position } from './types'

const elkOption = {}
const elk = new ELK(elkOption)

export async function calkLayoutElk(
  vertices: MmdVertex[],
  edges: MmdEdge[],
  { w: width, h: height }: { h: number; w: number } = { h: 100, w: 100 },
  dire = 'TD'
): Promise<Position[]> {
  if (!vertices || !edges) return []
  const toNode = (v: MmdVertex) => ({ id: v.id, width, height })
  const outsides = vertices.filter((v) => v.outside)
  const insides = vertices.filter((v) => !v.outside)
  const elkChildren = [
    ...outsides.map(toNode),
    { id: 'current-root', children: insides.map(toNode) },
  ]
  const elkEdges = edges.map((e) => ({
    id: `e${e.start}-${e.end}`,
    sources: [e.start],
    targets: [e.end],
  }))

  console.log({ children: elkChildren, edges: elkEdges })
  const { children = [] } = (await elk.layout({
    id: 'root',
    layoutOptions: {
      'org.eclipse.elk.direction': { TD: 'DOWN', LR: 'RIGHT' }[dire] || 'DOWN',
    },
    children: elkChildren,
    edges: elkEdges,
  })) as { children: Position[] }

  console.log(children)

  return children
}

const a = {
  id: 'root',
  layoutOptions: { algorithm: 'layered' },
  children: [
    {
      id: 'F6290',
      width: 200,
      height: 100,
      $H: 385,
      x: 12,
      y: 12,
    },
    {
      id: 'F6290',
      width: 200,
      height: 100,
      $H: 387,
      x: 232,
      y: 12,
    },
    {
      id: 'E2910',
      width: 200,
      height: 100,
      $H: 389,
      x: 452,
      y: 12,
    },
    {
      id: 'E2910',
      width: 200,
      height: 100,
      $H: 391,
      x: 12,
      y: 132,
    },
    {
      id: 'E3150',
      width: 200,
      height: 100,
      $H: 393,
      x: 232,
      y: 132,
    },
    {
      id: 'E3150',
      width: 200,
      height: 100,
      $H: 395,
      x: 452,
      y: 132,
    },
    {
      id: 'current-root',
      children: [
        {
          id: 'E1610',
          width: 200,
          height: 100,
          $H: 399,
          x: 12,
          y: 12,
        },
        {
          id: 'E1612',
          width: 200,
          height: 100,
          $H: 401,
          x: 232,
          y: 12,
        },
        {
          id: 'E1620',
          width: 200,
          height: 100,
          $H: 403,
          x: 12,
          y: 132,
        },
        {
          id: 'E1628',
          width: 200,
          height: 100,
          $H: 405,
          x: 232,
          y: 132,
        },
        {
          id: 'E1630',
          width: 200,
          height: 100,
          $H: 407,
          x: 12,
          y: 252,
        },
        {
          id: 'E1896',
          width: 200,
          height: 100,
          $H: 409,
          x: 232,
          y: 252,
        },
      ],
      $H: 397,
      x: 12,
      y: 252,
      width: 444,
      height: 364,
    },
  ],
  edges: [
    {
      id: 'eE1610-E1612',
      sources: ['E1610'],
      targets: ['E1612'],
    },
    {
      id: 'eE1612-E1620',
      sources: ['E1612'],
      targets: ['E1620'],
    },
    {
      id: 'eE1620-E1628',
      sources: ['E1620'],
      targets: ['E1628'],
    },
    {
      id: 'eE1620-E1630',
      sources: ['E1620'],
      targets: ['E1630'],
    },
    {
      id: 'eE1628-E1896',
      sources: ['E1628'],
      targets: ['E1896'],
    },
    {
      id: 'eE1610-E1612',
      sources: ['E1610'],
      targets: ['E1612'],
    },
    {
      id: 'eE1612-E1620',
      sources: ['E1612'],
      targets: ['E1620'],
    },
    {
      id: 'eE1620-E1628',
      sources: ['E1620'],
      targets: ['E1628'],
    },
    {
      id: 'eE1620-E1630',
      sources: ['E1620'],
      targets: ['E1630'],
    },
    {
      id: 'eE1628-E1896',
      sources: ['E1628'],
      targets: ['E1896'],
    },
    {
      id: 'eE1612-F6290',
      sources: ['E1612'],
      targets: ['F6290'],
    },
    {
      id: 'eE1612-F6290',
      sources: ['E1612'],
      targets: ['F6290'],
    },
    {
      id: 'eE1630-E2910',
      sources: ['E1630'],
      targets: ['E2910'],
    },
    {
      id: 'eE1630-E2910',
      sources: ['E1630'],
      targets: ['E2910'],
    },
    {
      id: 'eE1896-E3150',
      sources: ['E1896'],
      targets: ['E3150'],
    },
    {
      id: 'eE1896-E3150',
      sources: ['E1896'],
      targets: ['E3150'],
    },
  ],
}
