import Layout from '../components/Layout'
import NormViewer from '../components/NormViewer'
import { Title } from '../components/Title'

const title = '分布推定ツール'

const NormViewerPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <NormViewer />
    </Layout>
  )
}

export default NormViewerPage
