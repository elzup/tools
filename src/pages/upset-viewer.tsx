import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const UpsetViewer = dynamic(() => import('../components/UpsetViewer'), {
  ssr: false,
})

const title = 'Venn, Upset viewer'

const UpsetViewerPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <UpsetViewer />
    </Layout>
  )
}

export default UpsetViewerPage
