import { buildShingekiBlocks } from '../../components/ShingekiPlots'
import { parseMarmaid } from '../../components/MermaidUi/useMermaid'

const shingekiLikeMmd = `
flowchart LR
EREN[エレン] --> WALL[壁]
%%%subgraph 序章;
EREN --> MIKASA[ミカサ]
MIKASA -.-> ARMIN[アルミン]
%%%subgraph 対比;
ARMIN x-.-x EREN
WALL -.-o OUTSIDE[外の世界]
`.trim()

describe('mermaid shingeki graph parsing', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('parses the edge forms used by the Shingeki story graph', () => {
    const mmd = parseMarmaid(
      `
flowchart LR
A[原因]-->|補足|B[結果]
C[原因] -.-> D[偶発]
E[原因] -.-o F[心理的影響]
G[原因] x-.-x H[対比]
`.trim()
    )

    expect(mmd.vertices.map((v) => v.text)).toEqual([
      '原因',
      '結果',
      '原因',
      '偶発',
      '原因',
      '心理的影響',
      '原因',
      '対比',
    ])
    expect(mmd.edges.map((e) => e.type)).toEqual([
      'arrow_point',
      'arrow_point',
      'arrow_circle',
      'double_arrow_cross',
    ])
    expect(mmd.edges[0]).toMatchObject({ start: 'A', end: 'B', text: '補足' })
  })

  it('builds titled Shingeki blocks and fills cross-block outside nodes', () => {
    const blocks = buildShingekiBlocks(shingekiLikeMmd)
    const enabledBlocks = blocks.filter(
      (block) => block.mmd.vertices.length > 0
    )

    expect(enabledBlocks.map((block) => block.title)).toEqual([
      '',
      '序章',
      '対比',
    ])

    const prologue = enabledBlocks.find((block) => block.title === '序章')
    const contrast = enabledBlocks.find((block) => block.title === '対比')

    expect(prologue?.mmd.vertices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'EREN', text: 'エレン', outside: true }),
        expect.objectContaining({
          id: 'ARMIN',
          text: 'アルミン',
          outside: false,
        }),
      ])
    )
    expect(contrast?.mmd.vertices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'EREN', text: 'エレン', outside: true }),
        expect.objectContaining({ id: 'WALL', text: '壁', outside: true }),
      ])
    )
    expect(contrast?.mmd.edges.map((edge) => edge.type)).toEqual([
      'double_arrow_cross',
      'arrow_circle',
    ])
  })
})
