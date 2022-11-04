import { Box, Typography } from '@mui/material'
import 'devtools-detect'
import { useEvent } from 'react-use'
import styled from 'styled-components'
import NoSSR from 'react-no-ssr'
import { useEffect, useRef } from 'react'
import { useMutationObserver } from 'rooks'
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
      <Typography variant="h6">0. 開発者ツールを開く</Typography>
      <TaskDone done={task.done} />
    </Box>
  )
}

const initText = 'CHANGE ME'
const TaskBox1 = ({ task, setTask }: TaskBoxProps) => {
  const ref = useRef<HTMLParagraphElement>(null)

  useMutationObserver(ref, (e) => {
    const $e = e[0].target as HTMLElement

    if ($e.innerText !== initText) {
      setTask({ done: true, mem: {} })
    }
  })

  return (
    <Box mt={1}>
      <Typography variant="h6">1. テキストを書き換える</Typography>
      <Typography>{`'${initText}' を 'hello' に書き換える`}</Typography>
      <TargetWrap>
        <p ref={ref}>{initText}</p>
      </TargetWrap>
      <TaskDone done={task.done} />
    </Box>
  )
}

const TaskBox2 = ({ task, setTask }: TaskBoxProps) => {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (ref.current === null) return
    console.log(ref.current)
    ref.current.addEventListener('DOMNodeRemoved', (e) => {
      setTask({ done: true, mem: {} })
    })
  }, [ref.current])

  return (
    <Box mt={1}>
      <Typography variant="h6">2. DOMを削除する</Typography>
      <Typography>{`pタグを削除する`}</Typography>
      <TargetWrap data-action="remove">
        <p ref={ref}>DELETE ME</p>
      </TargetWrap>
      <TaskDone done={task.done} />
    </Box>
  )
}

const TaskBox3 = ({ task, setTask }: TaskBoxProps) => {
  const ref = useRef<HTMLParagraphElement>(null)

  useMutationObserver(ref, (e) => {
    const { visibility } = window.getComputedStyle(e[0].target as HTMLElement)

    if (visibility === 'hidden') {
      setTask({ done: true, mem: {} })
    }
  })

  return (
    <Box mt={1}>
      <Typography variant="h6">3. DOMを非表示にする</Typography>
      <Typography>{`pタグを非表示にする`}</Typography>
      <TargetWrap data-action="remove">
        <p ref={ref}>HIDE ME</p>
      </TargetWrap>
      <TaskDone done={task.done} />
    </Box>
  )
}

const TaskDone = ({ done }: { done: boolean }) => {
  return <div>result: {done ? 'ok' : '-'}</div>
}

const TargetWrap = styled.div`
  border: solid 1px gray;
  padding: 1rem;
  > * {
    background: #eee;
  }
  &[data-action='remove'] {
    p {
      color: red;
    }
  }
`

export default DevToolsCampPage
