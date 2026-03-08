import Layout from '../components/Layout'
import FloatPrecision from '../components/FloatPrecision'
import { Title } from '../components/Title'

const title = 'Float有効桁数デモ'

const FloatPrecisionPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <FloatPrecision />
    </Layout>
  )
}

export default FloatPrecisionPage
