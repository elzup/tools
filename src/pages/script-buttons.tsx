import { Button } from '@mui/material'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useLocalStorage } from '../utils/useLocalStorage'

const title = 'Time Log Clip'

const TextAndEvalButton = ({ actionId }: { actionId: string }) => {
  const [text, setText] = useLocalStorage(`text-${actionId}`, '')

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={() => setText('')}>Reset</Button>
      <Button
        onClick={() => {
          // eslint-disable-next-line no-eval
          eval(text)
        }}
      >
        Eval
      </Button>
    </div>
  )
}

const TimeClipPage = () => {
  const [n, setN] = useLocalStorage('script-buttons-n', 3)

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Button
        onClick={() => {
          setN(n + 1)
        }}
      >
        +1
      </Button>
      {Array.from({ length: n }).map((_, i) => (
        <TextAndEvalButton key={i} actionId={`action-${i}`} />
      ))}

      <Style>
        <div></div>
      </Style>
    </Layout>
  )
}
const Style = styled.div``

export default TimeClipPage
