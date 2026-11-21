import Layout from '../components/Layout'
import WasmLibraryDistribution from '../components/WasmLibraryDistribution'
import { Title } from '../components/Title'

const title =
  'WASM を同梱した npm ライブラリで、.wasm ファイルはどこを通ってブラウザに届くか'

const WasmLibraryDistributionPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <WasmLibraryDistribution />
    </Layout>
  )
}

export default WasmLibraryDistributionPage
