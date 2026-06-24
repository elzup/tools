import dynamic from 'next/dynamic'
import Layout from '../components/Layout'

const title = 'SpanBox'

// localStorage に強く依存するため SSR を無効化し、
// サーバー/クライアントの DOM 不一致 (hydration error) を防ぐ
const SpanBox = dynamic(() => import('../components/SpanBox'), { ssr: false })

const SpanBoxPage = () => {
  return (
    <Layout title={title} fullWidth flush footer="minimal">
      <SpanBox />
    </Layout>
  )
}

export default SpanBoxPage
