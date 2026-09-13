import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// WebAssembly の動的コンパイルとブラウザの高精度タイマーを使用する。
const WasmCalculator = dynamic(() => import('../components/WasmCalculator'), {
  ssr: false,
})

const title = 'JS / Wasm 計算ベンチマーク'

const WasmCalcBenchPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <WasmCalculator />
    </Layout>
  )
}

export default WasmCalcBenchPage
