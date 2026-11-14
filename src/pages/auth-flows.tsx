import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// 乱数・時刻・Web Crypto に依存するのでサーバーとブラウザで初期描画を揃えない
const AuthFlows = dynamic(() => import('../components/AuthFlows'), {
  ssr: false,
})

const title = 'パスワード・2段階認証・パスキーの仕組み'

const AuthFlowsPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <AuthFlows />
    </Layout>
  )
}

export default AuthFlowsPage
