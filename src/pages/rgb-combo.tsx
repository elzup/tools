import Layout from '../components/Layout'
import RgbCombo from '../components/RgbCombo'
import { Title } from '../components/Title'

const title = 'RGB 全組み合わせ'

const RgbComboPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <RgbCombo />
    </Layout>
  )
}

export default RgbComboPage
