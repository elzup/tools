import Layout from '../components/Layout'
import StaminaCalc from '../components/StaminaCalc'
import { Title } from '../components/Title'

const title = 'スタミナ計算機'

const StaminaCalcPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <StaminaCalc />
    </Layout>
  )
}

export default StaminaCalcPage
