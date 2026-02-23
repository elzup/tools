import { RefObject } from 'react'
import { UpSetJS, VennDiagram, KarnaughMap, ISetLike } from '@upsetjs/react'
import { Elem } from './parsers'

export type ViewMode = 'upset' | 'venn' | 'karnaugh' | 'all'

type ChartProps = {
  sets: ReturnType<typeof import('@upsetjs/react').extractCombinations>['sets']
  combinations: ReturnType<
    typeof import('@upsetjs/react').extractCombinations
  >['combinations']
  selection: ISetLike<Elem> | null
  theme: 'dark' | 'light'
  svgRef?: RefObject<SVGSVGElement | null>
  onHover: (s: ISetLike<Elem> | null) => void
  onClick: (s: ISetLike<Elem> | null) => void
}

type Props = ChartProps & {
  viewMode: ViewMode
  canShowVenn: boolean
}

const UpSetJSAny = UpSetJS as any
const VennDiagramAny = VennDiagram as any
const KarnaughMapAny = KarnaughMap as any

const UpsetSingle = ({
  sets,
  combinations,
  selection,
  theme,
  svgRef,
  onHover,
  onClick,
}: ChartProps) => (
  <UpSetJSAny
    ref={svgRef}
    sets={sets}
    combinations={combinations}
    width={780}
    height={400}
    selection={selection}
    onHover={onHover}
    onClick={onClick}
    theme={theme}
  />
)

const VennSingle = ({
  sets,
  combinations,
  selection,
  theme,
  svgRef,
  onHover,
  onClick,
}: ChartProps) => (
  <VennDiagramAny
    ref={svgRef}
    sets={sets}
    combinations={combinations}
    width={500}
    height={350}
    selection={selection}
    onHover={onHover}
    onClick={onClick}
    theme={theme}
  />
)

const KarnaughSingle = ({
  sets,
  combinations,
  selection,
  theme,
  svgRef,
  onHover,
  onClick,
}: ChartProps) => {
  return (
    <div>
      <style>{`
        [class*=" not-"], [class^="not-"] {
          text-decoration-color: #d32f2f !important;
          fill: #d32f2f !important;
        }
      `}</style>
      <KarnaughMapAny
        ref={svgRef}
        sets={sets}
        combinations={combinations}
        width={780}
        height={500}
        fontSizes={{ setLabel: '10px' }}
        combinationName={false}
        selection={selection}
        onHover={onHover}
        onClick={onClick}
        theme={theme}
      />
    </div>
  )
}

export const UpsetChart = ({
  viewMode,
  sets,
  combinations,
  selection,
  canShowVenn,
  theme,
  svgRef,
  onHover,
  onClick,
}: Props) => {
  const chartProps: ChartProps = {
    sets,
    combinations,
    selection,
    theme,
    onHover,
    onClick,
  }

  if (viewMode === 'all') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <UpsetSingle {...chartProps} svgRef={svgRef} />
        {canShowVenn && <VennSingle {...chartProps} />}
        <KarnaughSingle {...chartProps} />
      </div>
    )
  }

  if (viewMode === 'venn' && canShowVenn) {
    return <VennSingle {...chartProps} svgRef={svgRef} />
  }

  if (viewMode === 'karnaugh') {
    return <KarnaughSingle {...chartProps} svgRef={svgRef} />
  }

  return <UpsetSingle {...chartProps} svgRef={svgRef} />
}
