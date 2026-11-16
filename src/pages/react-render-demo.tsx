import Layout from '../components/Layout'
import ReactRenderDemo from '../components/ReactRenderDemo'
import { Title } from '../components/Title'

const title = 'React 再レンダー比較'

const ReactRenderDemoPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <ReactRenderDemo />
    </Layout>
  )
}

export default ReactRenderDemoPage
