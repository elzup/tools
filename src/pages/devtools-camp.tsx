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
  EDIT_DOM: '1-edit-dom',
  COLOR_COPY: '2-color-copy',
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
      <TaskBox4 {...getAccess(TASK.EDIT_DOM)} />
      <TaskBox5 {...getAccess(TASK.COLOR_COPY)} />
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
      <Typography>セパレートウィンドウ以外で開く</Typography>
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
      <Typography variant="h6">1-1. テキストを書き換える</Typography>
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
    ref.current.addEventListener('DOMNodeRemoved', (_e) => {
      setTask({ done: true, mem: {} })
    })
  }, [ref.current])

  return (
    <Box mt={1}>
      <Typography variant="h6">1-2. DOMを削除する</Typography>
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
      <Typography variant="h6">1-3. DOMを非表示にする</Typography>
      <Typography>{`pタグを非表示にする`}</Typography>
      <TargetWrap data-action="remove">
        <p ref={ref}>HIDE ME</p>
      </TargetWrap>
      <TaskDone done={task.done} />
    </Box>
  )
}

export const isElement = (node: Node): node is Element =>
  node.nodeType === Node.ELEMENT_NODE

const TaskBox4 = ({ task, setTask }: TaskBoxProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useMutationObserver(ref, (_mrs) => {
    // const divs = mrs
    //   .map(({ target }) => target)
    //   .filter(isElement)
    //   .filter(($e) => $e.tagName === 'div')

    if (!ref.current) return

    const $e = ref.current.children[0]?.children[0]

    if (!$e) return

    if ($e.getAttribute('data-active') === 'true' && $e.tagName === 'P') {
      setTask({ done: true, mem: {} })
    }
  })

  return (
    <Box mt={1}>
      <Typography variant="h6">1-4. DOMを書き換える</Typography>
      <Typography>{`data-active="true" 属性を追加, spanをpタグに変更する`}</Typography>
      <div ref={ref}>
        <TargetWrap>
          <span>CHANGE ME</span>
        </TargetWrap>
      </div>
      <TaskDone done={task.done} />
    </Box>
  )
}

const TaskBox5 = ({ task, setTask }: TaskBoxProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const ref1 = useRef<HTMLDivElement>(null)
  const ref2 = useRef<HTMLDivElement>(null)

  useMutationObserver(ref, (_e) => {
    if (ref1.current === null || ref2.current === null) return
    const c1 = window.getComputedStyle(ref1.current).backgroundColor
    const c2 = window.getComputedStyle(ref1.current).backgroundColor

    if (c1 === c2) {
      setTask({ done: true, mem: {} })
    }
  })

  return (
    <Box mt={1}>
      <Typography variant="h6">2-1. 色を変更する</Typography>
      <Typography>{`background を隣の色と揃える`}</Typography>
      <div ref={ref}>
        <TargetWrap>
          <Box display="flex" gap={'1rem'}>
            <div ref={ref1} style={{ background: '#abcabc' }}>
              CHANGE ME
            </div>
            <div ref={ref2} style={{ background: '#cbacba' }}>
              CHANGE ME
            </div>
          </Box>
        </TargetWrap>
      </div>
      <TaskDone done={task.done} />
    </Box>
  )
}

const colors = {
  main: '#a7ffa7',
  sub: '#00ae37',
}

const TaskDone = ({ done }: { done: boolean }) => {
  return (
    <Box
      p={1}
      mt={1}
      sx={{
        width: '100px',
        border: `solid 2px ${done ? colors.sub : '#f7ebff'}`,
        borderRadius: '4px',
        background: done ? colors.main : 'white',
      }}
    >
      result: {done ? 'ok' : '-'}
    </Box>
  )
}

const TargetWrap = styled.div`
  border: solid 1px gray;
  padding: 1rem;
  max-width: 400px;
  margin-top: 1rem;
  > * {
    background: #eee;
    padding: 4px;
    text-align: center;
    &[data-active='true'] {
      background: ${colors.main};
    }
    > div {
      padding: 1rem;
    }
  }
  &[data-action='remove'] {
    p {
      color: red;
    }
  }
`

export default DevToolsCampPage
