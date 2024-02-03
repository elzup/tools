import { Button } from '@mui/material'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useLocalStorage } from '../utils/useLocalStorage'

const title = 'Time Log Clip'

type Pin = {
  id: string
  time: Date
  category: string
  deleted: boolean
}

const usePins = () => {
  const [pins, setPins] = useLocalStorage<Pin[]>('pins', [])

  return {
    pins,
    addPins: (category: string) => {
      const now = new Date()

      setPins([
        ...pins,
        { id: now.toString(), time: now, category, deleted: false },
      ])
    },
    reset: () => {
      setPins([])
    },
    delToggle: (id: string) => {
      setPins(
        pins.map((pin) => {
          if (pin.id === id) {
            return { ...pin, deleted: !pin.deleted }
          }
          return pin
        })
      )
    },
  }
}

const TimeClipPage = () => {
  const { pins, addPins, reset, delToggle } = usePins()

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Style>
        <div>
          <div>
            <ul>
              {pins.map((pin) => (
                <li key={pin.id}>
                  <div className="record" data-deleted={pin.deleted}>
                    <div className="time">{pin.time.toLocaleString()}</div>
                    <div data-category={pin.category}>{pin.category}</div>
                    <Button
                      size="small"
                      onClick={() => {
                        delToggle(pin.id)
                      }}
                    >
                      del
                    </Button>
                    {/* <Button size="small">☆</Button> */}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ display: 'grid', gridAutoFlow: 'column', gap: '1rem' }}>
          <Button size={'large'} onClick={() => addPins('A')}>
            A
          </Button>
          <Button size={'large'} onClick={() => addPins('B')}>
            B
          </Button>
          <Button size={'large'} onClick={() => addPins('C')}>
            C
          </Button>
        </div>
        <div className="manages">
          <Button
            onClick={() => {
              if (pins.length === 0) {
                alert('ログがありません')
                return
              }
              const pin1 = pins[0]
              const csv =
                'time,category,deleted\n' +
                pins
                  .map((pin) => {
                    return `${pin.time.toLocaleString()},${pin.category},${
                      pin.deleted
                    }`
                  })
                  .join('\n')

              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')

              a.href = url
              a.download = `time-log-clip-${pin1.id}.csv`
              a.click()
            }}
          >
            ダウンロード
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (confirm('リセットしますか？')) {
                reset()
              }
            }}
          >
            リセット
          </Button>
        </div>
      </Style>
    </Layout>
  )
}
const Style = styled.div`
  .manages {
    margin-top: 1rem;
  }
  .record {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 1rem;
    &[data-deleted='true'] {
      opacity: 0.8;
      text-decoration: line-through;
    }
    .time {
      font-family: monospace;
    }
  }
`

export default TimeClipPage
