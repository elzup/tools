import { Box } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TusiBowlControls, TusiBowlDescription } from './Controls'
import { TusiBowlScene } from './Scene'
import {
  OMEGA,
  TWO_PI,
  type BallSpec,
  type Judgement,
  type NavMode,
  type ViewRequest,
  goodAngleAt,
  judgeTiming,
  nowSeconds,
  wrapAngle,
} from './model'

const DEFAULT_BALL_COUNT = 10

const TusiBowl = () => {
  const [ballCount, setBallCount] = useState(DEFAULT_BALL_COUNT)
  const [balls, setBalls] = useState<BallSpec[]>([])
  const [collidedIds, setCollidedIds] = useState<ReadonlySet<number>>(new Set())
  const [collisionCount, setCollisionCount] = useState(0)
  const [judgement, setJudgement] = useState<Judgement | null>(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [navMode, setNavMode] = useState<NavMode>('manual')
  const [view, setView] = useState<ViewRequest>({
    mode: 'top',
    revision: 0,
  })
  const pointerThetaRef = useRef<number | null>(null)
  const isDone = balls.length >= ballCount

  const handleMove = useCallback((theta: number | null) => {
    pointerThetaRef.current = theta
  }, [])

  const dropAt = useCallback(
    (theta: number) => {
      if (balls.length >= ballCount) return
      const errorMilliseconds =
        (Math.abs(wrapAngle(theta - OMEGA * nowSeconds())) / OMEGA) * 1000
      const nextBallIndex = balls.length
      const color = `hsl(${(nextBallIndex * 360) / ballCount}, 75%, 55%)`

      setJudgement(judgeTiming(errorMilliseconds))
      setBalls((currentBalls) => [
        ...currentBalls,
        { id: nextBallIndex, theta, color },
      ])
    },
    [balls.length, ballCount]
  )

  const dropAtGoodSpot = useCallback(() => {
    if (isAutoPlaying) return
    dropAt(goodAngleAt(nowSeconds()))
  }, [isAutoPlaying, dropAt])

  const handlePick = useCallback(
    (theta: number) => {
      if (!isAutoPlaying) dropAt(theta)
    },
    [isAutoPlaying, dropAt]
  )

  useEffect(() => {
    if (!isAutoPlaying) return
    if (isDone) {
      setIsAutoPlaying(false)
      return
    }

    const targetAngle = (balls.length * Math.PI) / ballCount
    const waitSeconds =
      ((((targetAngle - OMEGA * nowSeconds()) % TWO_PI) + TWO_PI) % TWO_PI) /
      OMEGA
    const timer = setTimeout(() => dropAt(targetAngle), waitSeconds * 1000)

    return () => clearTimeout(timer)
  }, [isAutoPlaying, isDone, balls.length, ballCount, dropAt])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      event.preventDefault()
      dropAtGoodSpot()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dropAtGoodSpot])

  const handleCollide = useCallback((firstId: number, secondId: number) => {
    setCollisionCount((currentCount) => currentCount + 1)
    setCollidedIds((currentIds) => new Set([...currentIds, firstId, secondId]))
  }, [])

  const reset = useCallback(() => {
    setBalls([])
    setCollidedIds(new Set())
    setCollisionCount(0)
    setJudgement(null)
    setIsAutoPlaying(false)
  }, [])

  const handleBallCountChange = (value: number) => {
    setBallCount(value)
    reset()
  }

  const handleViewModeChange = (mode: ViewRequest['mode']) => {
    setView((currentView) => ({
      mode,
      revision: currentView.revision + 1,
    }))
  }

  return (
    <Box>
      <TusiBowlDescription />
      <TusiBowlControls
        ballCount={ballCount}
        isAutoPlaying={isAutoPlaying}
        isDone={isDone}
        navMode={navMode}
        viewMode={view.mode}
        onAutoPlay={() => setIsAutoPlaying(true)}
        onBallCountChange={handleBallCountChange}
        onDrop={dropAtGoodSpot}
        onNavModeChange={setNavMode}
        onReset={reset}
        onViewModeChange={handleViewModeChange}
      />
      <TusiBowlScene
        balls={balls}
        ballCount={ballCount}
        collidedIds={collidedIds}
        collisionCount={collisionCount}
        isAutoPlaying={isAutoPlaying}
        isDone={isDone}
        judgement={judgement}
        navMode={navMode}
        pointerThetaRef={pointerThetaRef}
        view={view}
        onCollide={handleCollide}
        onDrop={dropAt}
        onMove={handleMove}
        onPick={handlePick}
      />
    </Box>
  )
}

export default TusiBowl
