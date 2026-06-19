import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const FilterLens = dynamic(() => import('../components/FilterLens'), {
  ssr: false,
})

const title = 'Filter Lens'

const FilterLensPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <FilterLens />
    </Layout>
  )
}

export default FilterLensPage
