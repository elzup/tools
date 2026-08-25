import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const Roulette = dynamic(() => import('../components/Roulette'), { ssr: false })

const DEFAULT_TITLE = 'でるすルーレット'

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const RoulettePage = () => {
  const { query } = useRouter()
  const title = first(query.title) || DEFAULT_TITLE
  const initialItems = (first(query.items) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Roulette title={title} initialItems={initialItems} />
    </>
  )
}

export default RoulettePage
