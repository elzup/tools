import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const ClockDigits = dynamic(() => import('../components/ClockDigits'), {
  ssr: false,
})

const title = 'アナログ時計で作る数字'

const ClockDigitsPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <ClockDigits />
    </Layout>
  )
}

export default ClockDigitsPage
