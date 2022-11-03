import { Box, Typography } from '@mui/material'
import 'devtools-detect'
import { useEvent } from 'react-use'
import styled from 'styled-components'
import NoSSR from 'react-no-ssr'
import Layout from '../components/Layout'
import { Title } from '../components/Title'
import { useLocalStorage } from '../utils/useLocalStorage'

type TaskMem = {
  done: boolean
  mem: object
}
const initTask = { done: false, mem: {} }

const TASK = {
  OPEN_DEVTOOLS: '0-open-devtools',
  EDIT_TEXT: '1-edit-text',
  DELETE_DOM: '1-delete-dom',
  HIDE_DOM: '1-hide-dom',
}

const useTask = () => {
  const [tasks, setTasks] = useLocalStorage<{ [id: string]: TaskMem }>(
    'camp',
    {}
  )

  const getTask = (id: string) => tasks[id] || initTask
  const setTask = (id: string, task: TaskMem) =>
    setTasks({ ...tasks, [id]: task })

  return {
    tasks,
    getAccess: (id: string) => ({
      task: getTask(id),
      setTask: (task: TaskMem) => setTask(id, task),
    }),
  }
}

const title = 'DevTools Camp'
const DevToolsCampPage = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <NoSSR>
        <DevToolsCamp />
      </NoSSR>
    </Layout>
  )
}
const DevToolsCamp = () => {
  const { getAccess } = useTask()

  return (
    <Box>
      <TaskBox0 {...getAccess(TASK.OPEN_DEVTOOLS)} />
      <TaskBox1 {...getAccess(TASK.EDIT_TEXT)} />
      <TaskBox2 {...getAccess(TASK.DELETE_DOM)} />
      <TaskBox3 {...getAccess(TASK.HIDE_DOM)} />
    </Box>
  )
}

type TaskBoxProps = {
  task: TaskMem
  setTask: (task: TaskMem) => void
}

const TaskBox0 = ({ task, setTask }: TaskBoxProps) => {
  useEvent('devtoolschange', (e) => {
    if (e?.detail?.isOpen) setTask({ done: true, mem: {} })
  })
  return (
    <Box mt={1}>
      <Typography>0. 開発者ツールを開く</Typography>
      <div>{task.done ? 'ok' : '-'}</div>
    </Box>
  )
}

const TaskBox1 = ({ task, setTask }: TaskBoxProps) => {
  useEvent('devtoolschange', (e) => {
    if (e?.detail?.isOpen) setTask({ done: true, mem: {} })
  })
  return (
    <Box mt={1}>
      <Typography>2. テキストを書き換える</Typography>
      <p
        onChange={(e) => {
          console.log(e)
        }}
      >
        {'change me'}
      </p>
      <div>{task.done ? 'ok' : '-'}</div>
    </Box>
  )
}

const TaskBox2 = ({ task, setTask }: TaskBoxProps) => {
  return (
    <Box mt={1}>
      <Typography>3. DOMを削除する</Typography>
      <p
        onChange={(e) => {
          console.log(e)
        }}
      >
        DELETE ME
      </p>
      <div>{task.done ? 'ok' : '-'}</div>
    </Box>
  )
}

const TaskBox3 = ({ task, setTask }: TaskBoxProps) => {
  return (
    <Box mt={1}>
      <Typography>4. DOMを非表示にする</Typography>
      <p
        onChange={(e) => {
          console.log(e)
        }}
      >
        HIDE ME
      </p>
      <div>{task.done ? 'ok' : '-'}</div>
    </Box>
  )
}

const Style = styled.div`
  table {
    border-collapse: collapse;
    th,
    td {
      border-top: 1px solid #aaa;
      border-bottom: 1px solid #aaa;
      border-left: 1px solid #ccc;
      border-right: 1px solid #ccc;
      background: #ddd;
      padding: 0 0.5rem;
    }
    td {
      background: #fff;
    }
  }
`

export default DevToolsCampPage
