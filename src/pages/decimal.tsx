import styled from 'styled-components'
import { range } from '@elzup/kit'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'decimal'
const Diginima = () => {
  const nums = range(10).map((n) => ({
    n: n,
    p5: Math.floor(n / 5),
    t5: n % 5,
    p3: Math.floor(n / 3),
    t3: n % 3,
    t2: n % 2,
    t4: n % 4,
  }))

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Style>
        {nums.map(({ n, p5, t5 }) => (
          <div key={n} data-p5={p5} data-t5={t5}>
            {n}
          </div>
        ))}
      </Style>
    </Layout>
  )
}

const Style = styled.div`
  display: grid;
  grid-auto-flow: column;
  width: 20rem;

  > div {
    border: solid black 1px;
    padding: 5px 0;
    text-align: center;
    &[data-p5='0'] {
      background-color: #a0f;
    }
    &[data-p5='1'] {
      background-color: #ff7904;
    }
  }
`

export default Diginima
