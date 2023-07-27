import dynamic from 'next/dynamic'
import Head from 'next/head'
import p5Types from 'p5'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const Sketch = dynamic(import('react-p5'), {
  loading: () => <></>,
  ssr: false,
})

const preload = (p5: p5Types) => {}

const setup = (p5: p5Types, canvasParentRef: Element) => {
  p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)

  const { width, height } = p5

  p5.colorMode(p5.HSB, width, height, 100)
  p5.background(51)
  p5.circle(width / 2, height / 2, 50)

  p5.noStroke()
}
const barWidth = 20
let lastBar = -1

const draw = (p5: p5Types) => {
  const { width: w, height: h, mouseX: mx, mouseY: my } = p5
  const whichBar = mx / barWidth

  if (whichBar === lastBar) return

  let barX = whichBar * barWidth

  p5.circle(mx, my, 50)
  p5.fill(barX, my, 66)
  p5.rect(barX, 0, barWidth, h)
  lastBar = whichBar
}

const mouseClicked = (p5: p5Types) => {
  p5.rect(p5.mouseX, p5.mouseY, 50, 30)
}

const windowResized = (p5: p5Types) => {
  p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
}

export const SketchComponent = () => {
  return (
    <Sketch
      preload={preload}
      setup={setup}
      draw={draw}
      mouseClicked={mouseClicked}
      windowResized={windowResized}
    />
  )
}

const title = 'creative coding'

const CodeExplorerPage = () => {
  return (
    <Layout title={title}>
      <Head>
        <link rel="manifest" href="codeex.manifest.json" />

        {/* <meta property="og:image" content={imgUrl} /> */}
      </Head>
      <Title>
        <div>{title}</div>
      </Title>
      <div>
        <SketchComponent />
      </div>
    </Layout>
  )
}

export default CodeExplorerPage
