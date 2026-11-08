import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

// toLocaleString の出力がサーバーとブラウザで揺れうるので初期描画を揃えない
const PasswordSpace = dynamic(() => import('../components/PasswordSpace'), {
  ssr: false,
})

const title = 'パスワード空間'

const PasswordSpacePage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <PasswordSpace />
    </Layout>
  )
}

export default PasswordSpacePage
