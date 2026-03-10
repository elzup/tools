import Layout from '../components/Layout'
import WeekdayCalcExplainer from '../components/WeekdayCalcExplainer'
import { Title } from '../components/Title'

const title = '曜日計算 Explainer'

const WeekdayCalcPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <WeekdayCalcExplainer />
    </Layout>
  )
}

export default WeekdayCalcPage
