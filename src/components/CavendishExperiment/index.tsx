import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  DEFAULT_PARAMS,
  EXAGGERATION_MULTIPLIER,
  REAL_G,
  calculatePeriod,
  calculateTorque,
  rk4Step,
  type PhysicsParams,
  type PhysicsState,
} from './physics'

const CanvasContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`

const StyledCanvas = styled.canvas`
  border: 1px solid #ccc;
  background-color: #111;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 100%;
`

const ControlPaper = styled(Paper)`
  padding: 24px;
  background-color: #f9f9f9;
  border-radius: 12px;
`

const FormulaBox = styled(Box)`
  background-color: #f0f4f8;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Times New Roman', Times, serif;
  margin-top: 16px;
`

const SliderLabel = styled(Box)`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`

const CavendishExperiment = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // 物理状態
  const [state, setState] = useState<PhysicsState>({
    theta: 0,
    omega: 0,
    bigSpherePos: 'none',
  })

  // 物理パラメータ
  const [params, setParams] = useState<PhysicsParams>(DEFAULT_PARAMS)

  // シミュレーション実行用の時間加速設定 (1秒間の描画フレームで実行する物理ステップ数)
  const [timeScale, setTimeScale] = useState<number>(10) // デフォルトで10倍速

  // 過去の角度データ（グラフ用）
  const historyRef = useRef<{ theta: number; timestamp: number }[]>([])
  const [showLaserBeam, setShowLaserBeam] = useState<boolean>(true)
  const stateRef = useRef<PhysicsState>(state)
  const paramsRef = useRef<PhysicsParams>(params)

  // ref の同期
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    paramsRef.current = params
  }, [params])

  // リセット
  const handleReset = () => {
    const newState: PhysicsState = {
      theta: 0,
      omega: 0,
      bigSpherePos: 'none',
    }
    setState(newState)
    stateRef.current = newState
    historyRef.current = []
  }

  // 大球の位置切り替え
  const handleSpherePosChange = (pos: 'left' | 'right' | 'none') => {
    setState((prev) => ({
      ...prev,
      bigSpherePos: pos,
    }))
  }

  // パラメータ変更ハンドラ
  const handleParamChange = <K extends keyof PhysicsParams>(
    key: K,
    value: PhysicsParams[K]
  ) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value }
      // 誇張モード切り替え時に重力定数を調整
      if (key === 'isExaggerated') {
        next.G = REAL_G
      }
      return next
    })
  }

  // 物理シミュレーションループ
  useEffect(() => {
    const dt = 1 / 240 // 物理演算の基本ステップ幅 (秒)
    let animationFrameId: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      // 実時間経過に合わせた更新ではなく、フレームごとの固定ステップを timeScale 分進める
      // (これにより時間加速が安定する)
      let currentState = stateRef.current
      const currentParams = paramsRef.current

      // timeScale に応じてステップを実行
      const steps = Math.min(timeScale, 2000) // 最大でも2000ステップに制限してフリーズを防ぐ
      for (let i = 0; i < steps; i++) {
        currentState = rk4Step(currentState, currentParams, dt)
      }

      setState(currentState)
      stateRef.current = currentState

      // 履歴の更新
      historyRef.current.push({
        theta: currentState.theta,
        timestamp: now,
      })
      if (historyRef.current.length > 500) {
        historyRef.current.shift()
      }

      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [timeScale])

  // 描画処理
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const W = canvas.width
    const H = canvas.height

    // --- レイアウト定義 ---
    // 左側: トップダウンビュー
    const leftCX = 240
    const leftCY = 180
    const leftR = 150 // 外円半径

    // 右側: 拡大目盛りビュー
    const rightCX = 620
    const rightCY = 180
    const rightW = 300
    const rightH = 80

    // 下側: グラフビュー
    const graphX = 50
    const graphY = 320
    const graphW = 700
    const graphH = 100

    // 物理パラメータと現在の状態
    const currentState = stateRef.current
    const currentParams = paramsRef.current
    const { theta } = currentState
    const { L, D, theta0, m, M } = currentParams

    // スケール変換用 (物理長 0.2m を 110px にマッピング)
    const mToPx = 110 / 0.2

    // --- 1. 左側: トップダウンビューの描画 ---
    // 外枠（ガラスシリンダーのイメージ）
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(leftCX, leftCY, leftR, 0, Math.PI * 2)
    ctx.stroke()

    // 角度目盛り（薄いガイドライン）
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 1
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(
        leftCX + (leftR - 10) * Math.cos(rad),
        leftCY + (leftR - 10) * Math.sin(rad)
      )
      ctx.lineTo(leftCX + leftR * Math.cos(rad), leftCY + leftR * Math.sin(rad))
      ctx.stroke()
    }

    // 吊り下げワイヤーの中心（ねじり軸）
    ctx.fillStyle = '#666'
    ctx.beginPath()
    ctx.arc(leftCX, leftCY, 4, 0, Math.PI * 2)
    ctx.fill()

    // 小球と天秤の腕
    const armX1 = leftCX + L * mToPx * Math.cos(theta)
    const armY1 = leftCY + L * mToPx * Math.sin(theta)
    const armX2 = leftCX - L * mToPx * Math.cos(theta)
    const armY2 = leftCY - L * mToPx * Math.sin(theta)

    // 腕（細いロッド）
    ctx.strokeStyle = '#aaa'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(armX1, armY1)
    ctx.lineTo(armX2, armY2)
    ctx.stroke()

    // 小球 m1, m2 (鉛色)
    ctx.fillStyle = '#88929a'
    ctx.beginPath()
    ctx.arc(armX1, armY1, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(armX2, armY2, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 小球のラベル
    ctx.fillStyle = '#fff'
    ctx.font = '10px sans-serif'
    ctx.fillText('m', armX1 + 10, armY1 - 5)
    ctx.fillText('m', armX2 - 15, armY2 - 5)

    // 大球 M1, M2 の配置と描画
    if (currentState.bigSpherePos !== 'none') {
      const phi1 = currentState.bigSpherePos === 'left' ? theta0 : -theta0
      const phi2 = phi1 + Math.PI

      const bigX1 = leftCX + D * mToPx * Math.cos(phi1)
      const bigY1 = leftCY + D * mToPx * Math.sin(phi1)
      const bigX2 = leftCX + D * mToPx * Math.cos(phi2)
      const bigY2 = leftCY + D * mToPx * Math.sin(phi2)

      // 大球 (濃い鉛色)
      ctx.fillStyle = '#4a535a'
      ctx.beginPath()
      ctx.arc(bigX1, bigY1, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(bigX2, bigY2, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // 大球のラベル
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.fillText('M', bigX1 + 24, bigY1 + 5)
      ctx.fillText('M', bigX2 - 32, bigY2 + 5)

      // 万有引力の作用線・可視化
      // 小球1から大球1への万有引力
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(armX1, armY1)
      ctx.lineTo(bigX1, bigY1)
      ctx.stroke()

      // 小球2から大球2への万有引力
      ctx.beginPath()
      ctx.moveTo(armX2, armY2)
      ctx.lineTo(bigX2, bigY2)
      ctx.stroke()
      ctx.setLineDash([]) // 実線に戻す

      // 引力の向きを示す赤い矢印
      const drawArrow = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number
      ) => {
        const dx = toX - fromX
        const dy = toY - fromY
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len === 0) return
        const ndx = dx / len
        const ndy = dy / len
        // 矢印の長さ
        const arrowLen = 15
        const arrowX = fromX + ndx * arrowLen
        const arrowY = fromY + ndy * arrowLen

        ctx.strokeStyle = '#00ffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        ctx.lineTo(arrowX, arrowY)
        ctx.stroke()

        // 矢頭
        const angle = Math.atan2(dy, dx)
        ctx.fillStyle = '#00ffff'
        ctx.beginPath()
        ctx.moveTo(arrowX, arrowY)
        ctx.lineTo(
          arrowX - 5 * Math.cos(angle - Math.PI / 6),
          arrowY - 5 * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          arrowX - 5 * Math.cos(angle + Math.PI / 6),
          arrowY - 5 * Math.sin(angle + Math.PI / 6)
        )
        ctx.fill()
      }

      drawArrow(armX1, armY1, bigX1, bigY1)
      drawArrow(armX2, armY2, bigX2, bigY2)
    }

    // レーザー光源と鏡の反射ビジュアル
    if (showLaserBeam) {
      // 鏡
      ctx.save()
      ctx.translate(leftCX, leftCY)
      ctx.rotate(theta)
      ctx.fillStyle = '#e5e5e5'
      ctx.fillRect(-8, -2, 16, 4)
      ctx.restore()

      // 入射レーザー (真下から鏡へ)
      const laserSourceX = leftCX
      const laserSourceY = leftCY + 120
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(laserSourceX, laserSourceY)
      ctx.lineTo(leftCX, leftCY)
      ctx.stroke()

      // 光源装置を描く
      ctx.fillStyle = '#444'
      ctx.fillRect(laserSourceX - 6, laserSourceY, 12, 15)

      // 反射レーザー (反射角は 2 * theta 傾く)
      // 鏡の法線は theta。入射角は theta。反射光の角度は 2 * theta。
      // 入射光が真下(角度 PI/2)から来るため、反射角は -PI/2 + 2*theta となる (上方向 -PI/2 からのズレ)
      const reflAngle = -Math.PI / 2 + 2 * theta
      const reflX = leftCX + 350 * Math.cos(reflAngle)
      const reflY = leftCY + 350 * Math.sin(reflAngle)

      // 反射光の描画 (鏡から外側へ)
      // グラデーションで光線っぽく見せる
      const grad = ctx.createLinearGradient(leftCX, leftCY, reflX, reflY)
      grad.addColorStop(0, 'rgba(255, 0, 0, 0.9)')
      grad.addColorStop(1, 'rgba(255, 0, 0, 0.1)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(leftCX, leftCY)
      ctx.lineTo(reflX, reflY)
      ctx.stroke()
    }

    // --- 2. 右側: 拡大目盛りビューの描画 ---
    // 目盛り用スケールの計算
    // 鏡から壁までの実スケールを W_wall = 2.0 m とする。
    // 壁での変位 (m) = W_wall * tan(2 * theta)
    const W_wall = 2.0
    const displacement = W_wall * Math.tan(2 * theta) // メートル単位
    const dispMM = displacement * 1000 // ミリメートル単位

    // 目盛り背景
    ctx.fillStyle = '#151515'
    ctx.fillRect(rightCX - rightW / 2, rightCY - rightH / 2, rightW, rightH)
    ctx.strokeStyle = '#444'
    ctx.strokeRect(rightCX - rightW / 2, rightCY - rightH / 2, rightW, rightH)

    // 目盛りの線 (1mm ごとに細線、5mm ごとに中線、10mm ごとに太線と数字)
    // 画面上の 1mm = 1.5px とする (可視化範囲は 左右計 200mm = 300px)
    const mmToScalePx = 1.5
    ctx.strokeStyle = '#555'
    ctx.fillStyle = '#888'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'

    for (let mm = -100; mm <= 100; mm += 5) {
      const sx = rightCX + mm * mmToScalePx
      if (sx < rightCX - rightW / 2 || sx > rightCX + rightW / 2) continue

      if (mm % 10 === 0) {
        ctx.strokeStyle = '#888'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(sx, rightCY - rightH / 2)
        ctx.lineTo(sx, rightCY - rightH / 2 + 15)
        ctx.stroke()

        ctx.fillText(Math.abs(mm).toString(), sx, rightCY - rightH / 2 + 26)
      } else {
        ctx.strokeStyle = '#444'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sx, rightCY - rightH / 2)
        ctx.lineTo(sx, rightCY - rightH / 2 + 8)
        ctx.stroke()
      }
    }

    // 0のセンターライン
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(rightCX, rightCY - rightH / 2)
    ctx.lineTo(rightCX, rightCY + rightH / 2)
    ctx.stroke()

    // 現在の反射スポット (赤いボケ足つきの円)
    const spotX = rightCX + dispMM * mmToScalePx
    if (spotX >= rightCX - rightW / 2 && spotX <= rightCX + rightW / 2) {
      // 光の滲み効果
      const spotGrad = ctx.createRadialGradient(
        spotX,
        rightCY,
        0,
        spotX,
        rightCY,
        12
      )
      spotGrad.addColorStop(0, 'rgba(255, 0, 0, 1.0)')
      spotGrad.addColorStop(0.3, 'rgba(255, 0, 0, 0.7)')
      spotGrad.addColorStop(1, 'rgba(255, 0, 0, 0.0)')
      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(spotX, rightCY, 12, 0, Math.PI * 2)
      ctx.fill()

      // 中心線
      ctx.strokeStyle = '#ff3333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(spotX, rightCY - rightH / 2)
      ctx.lineTo(spotX, rightCY + rightH / 2)
      ctx.stroke()
    }

    // 表示テキスト
    ctx.fillStyle = '#fff'
    ctx.font = '14px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(
      `変位 x: ${dispMM.toFixed(2)} mm`,
      rightCX - rightW / 2 + 10,
      rightCY + rightH / 2 - 10
    )
    ctx.fillText(
      `角度 θ: ${(theta * (180 / Math.PI)).toFixed(4)}°`,
      rightCX + 10,
      rightCY + rightH / 2 - 10
    )

    // 目盛りビューのタイトル
    ctx.fillStyle = '#aaa'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      'レーザー反射スケール (鏡から2.0m先の壁面)',
      rightCX,
      rightCY - rightH / 2 - 10
    )

    // --- 3. 下側: グラフビューの描画 ---
    // グラフの枠線
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 1
    ctx.strokeRect(graphX, graphY, graphW, graphH)

    // 0レベルの水平線
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(graphX, graphY + graphH / 2)
    ctx.lineTo(graphX + graphW, graphY + graphH / 2)
    ctx.stroke()

    // 過去の軌跡を描画
    const history = historyRef.current
    if (history.length > 1) {
      ctx.strokeStyle = '#00ffcc'
      ctx.lineWidth = 2
      ctx.beginPath()

      // 最大角度に合わせてオートスケール
      // 誇張モードと通常モードで振幅が大きく異なるため、最大値を探す
      let maxTheta = 0.001
      for (const pt of history) {
        const absT = Math.abs(pt.theta)
        if (absT > maxTheta) maxTheta = absT
      }
      // ゆとりを持たせる
      const valScale = graphH / 2 / (maxTheta * 1.2)

      const startIdx = Math.max(0, history.length - graphW)
      const xOffset = graphW - (history.length - startIdx)

      for (let i = startIdx; i < history.length; i++) {
        const pt = history[i]
        const gx = graphX + xOffset + (i - startIdx)
        const gy = graphY + graphH / 2 + pt.theta * valScale

        if (i === startIdx) {
          ctx.moveTo(gx, gy)
        } else {
          ctx.lineTo(gx, gy)
        }
      }
      ctx.stroke()

      // グラフ右端に現在値をテキスト表示
      ctx.fillStyle = '#00ffcc'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(
        `Scale: ±${(maxTheta * 1.2 * (180 / Math.PI)).toFixed(3)}°`,
        graphX + graphW - 5,
        graphY + 12
      )
    }

    // グラフタイトル
    ctx.fillStyle = '#aaa'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('角度 θ の時間変化グラフ', graphX, graphY - 10)
  }, [state, params, showLaserBeam, timeScale])

  // 固有周期
  const period = calculatePeriod(params)

  return (
    <Box>
      <CanvasContainer>
        <StyledCanvas ref={canvasRef} width={800} height={450} />
      </CanvasContainer>

      <Grid container spacing={3}>
        {/* 左カラム: コントロール */}
        <Grid size={{ xs: 12, md: 7 }}>
          <ControlPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              シミュレーターコントロール
            </Typography>

            <Stack spacing={3}>
              {/* 大球の操作 */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  大きな球 (質量 M) の配置
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant={
                      state.bigSpherePos === 'left' ? 'contained' : 'outlined'
                    }
                    color="primary"
                    onClick={() => handleSpherePosChange('left')}
                    fullWidth
                  >
                    左側に近づける (引力+)
                  </Button>
                  <Button
                    variant={
                      state.bigSpherePos === 'right' ? 'contained' : 'outlined'
                    }
                    color="primary"
                    onClick={() => handleSpherePosChange('right')}
                    fullWidth
                  >
                    右側に近づける (引力-)
                  </Button>
                  <Button
                    variant={
                      state.bigSpherePos === 'none' ? 'contained' : 'outlined'
                    }
                    color="inherit"
                    onClick={() => handleSpherePosChange('none')}
                    fullWidth
                  >
                    球を離す (引力なし)
                  </Button>
                </Stack>
              </Box>

              {/* シミュレーションモード切り替え */}
              <Stack direction="row" spacing={4} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={params.isExaggerated}
                      onChange={(e) =>
                        handleParamChange('isExaggerated', e.target.checked)
                      }
                      color="secondary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {params.isExaggerated
                          ? '誇張デモモード (引力100万倍)'
                          : 'リアル物理モード (実引力)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {params.isExaggerated
                          ? '引力を100万倍に増幅し、天秤の動きを素早く観察できます。'
                          : '現実の超微弱な万有引力を再現します。非常に動きがゆっくりになります。'}
                      </Typography>
                    </Box>
                  }
                />
              </Stack>

              {/* 時間加速 */}
              <Box>
                <SliderLabel>
                  <Typography variant="body2" fontWeight="bold">
                    シミュレーション速度 (時間加速)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {timeScale} 倍速
                  </Typography>
                </SliderLabel>
                <Slider
                  min={1}
                  max={200}
                  step={1}
                  value={timeScale}
                  onChange={(_, val) => setTimeScale(val as number)}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  ※ リアルモードで観察する場合は 100〜200倍速
                  への加速を推奨します。
                </Typography>
              </Box>

              {/* 各種物理パラメータの変更 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  物理パラメータ微調整
                </Typography>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {/* 大球質量 M */}
                  <Box>
                    <SliderLabel>
                      <Typography variant="caption">大球質量 M (kg)</Typography>
                      <Typography variant="caption">
                        {params.M.toFixed(1)} kg
                      </Typography>
                    </SliderLabel>
                    <Slider
                      min={0.5}
                      max={10}
                      step={0.1}
                      value={params.M}
                      onChange={(_, val) =>
                        handleParamChange('M', val as number)
                      }
                      size="small"
                    />
                  </Box>

                  {/* 小球質量 m */}
                  <Box>
                    <SliderLabel>
                      <Typography variant="caption">小球質量 m (g)</Typography>
                      <Typography variant="caption">
                        {(params.m * 1000).toFixed(0)} g
                      </Typography>
                    </SliderLabel>
                    <Slider
                      min={5}
                      max={100}
                      step={1}
                      value={params.m * 1000}
                      onChange={(_, val) =>
                        handleParamChange('m', (val as number) / 1000)
                      }
                      size="small"
                    />
                  </Box>

                  {/* 減衰抵抗 */}
                  <Box>
                    <SliderLabel>
                      <Typography variant="caption">
                        ワイヤーの減衰係数 γ
                      </Typography>
                      <Typography variant="caption">
                        {params.gamma.toExponential(2)}
                      </Typography>
                    </SliderLabel>
                    <Slider
                      min={1e-9}
                      max={5e-7}
                      step={1e-9}
                      value={params.gamma}
                      onChange={(_, val) =>
                        handleParamChange('gamma', val as number)
                      }
                      size="small"
                    />
                  </Box>
                </Stack>
              </Box>

              {/* 操作系ボタン */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReset}
                  fullWidth
                >
                  シミュレーションのリセット
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showLaserBeam}
                      onChange={(e) => setShowLaserBeam(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="レーザー光線を表示"
                  sx={{ ml: 1 }}
                />
              </Stack>
            </Stack>
          </ControlPaper>
        </Grid>

        {/* 右カラム: 解説・解説数式 */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              キャベンディッシュ実験とは？
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ヘンリー・キャベンディッシュが1798年に実施した、歴史上極めて重要な物理学実験です。
              ねじり天秤を用いて、鉛球同士に働く極めて微弱な **万有引力**
              を直接測定しました。
            </Typography>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              実験の仕組み
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              1. 軽い棒の両端に小さな鉛球 m
              を吊るし、極めて細い金属線（ワイヤー）で吊り下げます。
              <br />
              2. 大きな鉛球 M
              を小球の近くに近づけると、2つの球の間に働く万有引力によって天秤の腕がわずかに回転し、ワイヤーがねじれます。
              <br />
              3. ワイヤーのねじれによる復元力トルク（ねじり剛性
              κ）と万有引力が釣り合った位置で天秤が静止します。
              <br />
              4.
              回転角は極めて小さいため、天秤の中心に小さな鏡を取り付け、光を反射させて数メートル離れた壁の目盛りで変位
              x を測定（角度を拡大）します。
            </Typography>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              得られる物理情報
            </Typography>
            <FormulaBox>
              <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                <strong>万有引力のトルクと復元力トルクの釣り合い:</strong>
                <div
                  style={{
                    textAlign: 'center',
                    margin: '8px 0',
                    fontSize: '1.1rem',
                  }}
                >
                  2 · F · L = κ · θ
                </div>
                ここで F = G · M · m / r² です。
              </Typography>
              <Typography variant="body2" component="div">
                <strong>天秤の固有周期 T:</strong>
                <div
                  style={{
                    textAlign: 'center',
                    margin: '8px 0',
                    fontSize: '1.1rem',
                  }}
                >
                  T = 2π √ ( I / κ )
                </div>
                ここで慣性モーメント I = 2 · m · L²。周期 T
                を測定することで、未知のねじり定数 κ
                を正確に決定できます。これにより、万有引力定数 G
                が求められます。
              </Typography>
            </FormulaBox>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                現在の設計パラメータでの理論値:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 慣性モーメント $I$:{' '}
                {(2 * params.m * params.L * params.L).toExponential(3)} kg·m²
                <br />• 天秤の固有周期 $T$: {period.toFixed(1)} 秒 (
                {(period / 60).toFixed(2)} 分)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CavendishExperiment
