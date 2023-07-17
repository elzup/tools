import { chunk } from '@elzup/kit/lib/chunk'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import p5Types from 'p5'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const Sketch = dynamic(import('react-p5'), {
  loading: () => <></>,
  ssr: false,
})

export const SketchComponent = () => {
  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  }

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef)
    p5.colorMode(p5.HSB, p5.width, p5.height, 100)
    p5.noStroke()
    // p5でいうsetupの処理を書く
  }
  const barWidth = 20
  let lastBar = -1

  const draw = (p5: p5Types) => {
    // p5でいうdrawの処理を書く
    let whichBar = p5.mouseX / barWidth

    if (whichBar === lastBar) return

    let barX = whichBar * barWidth

    p5.fill(barX, p5.mouseY, 66)
    p5.rect(barX, 0, barWidth, p5.height)
    lastBar = whichBar
  }

  const windowResized = (p5: p5Types) => {
    // コンポーネントのレスポンシブ化
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
  }

  return (
    <Sketch
      preload={preload}
      setup={setup}
      draw={draw}
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
