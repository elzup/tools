import {
  Box,
  Button,
  Paper,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { NavMode, ViewRequest } from './model'

type TusiBowlControlsProps = {
  ballCount: number
  isAutoPlaying: boolean
  isDone: boolean
  navMode: NavMode
  viewMode: ViewRequest['mode']
  onAutoPlay: () => void
  onBallCountChange: (value: number) => void
  onDrop: () => void
  onNavModeChange: (mode: NavMode) => void
  onReset: () => void
  onViewModeChange: (mode: ViewRequest['mode']) => void
}

const ControlGroup = ({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {children}
  </Stack>
)

export const TusiBowlDescription = () => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
    ボウルの中のボールは中心を通る直線上を同じ周期で往復します。
    タイミングを合わせて置いていくと、直線運動の集まりなのに回転する円に見えます
    (Tusi couple /
    トゥーシーの対円)。ボウルをクリックすると好きな場所に置けます。
    ナビ「光る」は今置くと合う場所が光り、「接触」はカーソル位置に光が重なった瞬間に自動で置きます。
    同じ直径 (点線) に 2 個置くと衝突するので注意。
  </Typography>
)

export const TusiBowlControls = ({
  ballCount,
  isAutoPlaying,
  isDone,
  navMode,
  viewMode,
  onAutoPlay,
  onBallCountChange,
  onDrop,
  onNavModeChange,
  onReset,
  onViewModeChange,
}: TusiBowlControlsProps) => (
  <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
    <Stack
      direction="row"
      spacing={3}
      rowGap={1.5}
      alignItems="flex-end"
      flexWrap="wrap"
      useFlexGap
    >
      <ControlGroup label="操作">
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            onClick={onDrop}
            disabled={isDone || isAutoPlaying}
          >
            置く (Space)
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onAutoPlay}
            disabled={isDone || isAutoPlaying}
          >
            自動お手本
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={onReset}
          >
            リセット
          </Button>
        </Stack>
      </ControlGroup>

      <ControlGroup label="ナビ">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={navMode}
          onChange={(_, value: NavMode | null) =>
            value && onNavModeChange(value)
          }
        >
          <ToggleButton value="off">OFF</ToggleButton>
          <ToggleButton value="manual">光る</ToggleButton>
          <ToggleButton value="touch">接触</ToggleButton>
        </ToggleButtonGroup>
      </ControlGroup>

      <ControlGroup label="視点">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, value: ViewRequest['mode'] | null) =>
            value && onViewModeChange(value)
          }
        >
          <ToggleButton value="top">上</ToggleButton>
          <ToggleButton value="side">横</ToggleButton>
        </ToggleButtonGroup>
      </ControlGroup>

      <ControlGroup label={`ボール数: ${ballCount}`}>
        <Box sx={{ width: 150 }}>
          <Slider
            size="small"
            min={4}
            max={16}
            value={ballCount}
            onChange={(_, value) => onBallCountChange(value as number)}
            sx={{ mx: 1 }}
          />
        </Box>
      </ControlGroup>
    </Stack>
  </Paper>
)
