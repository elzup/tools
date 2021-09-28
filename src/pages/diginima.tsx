import React, { useState, useEffect } from 'react'

import { Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

type Animal = {
  pos: {
    x: number
    y: number
  }
}

const limit = (min: number, max: number) => (x: number) =>
  Math.min(Math.max(x, min), max)
const walkLimit = limit(0, 400)

const walkDiffRand = () => (Math.random() - 0.5) * 10

const updateAnimal = ({ pos }: Animal): Animal => ({
  pos: {
    x: walkLimit(pos.x + walkDiffRand()),
    y: walkLimit(pos.y + walkDiffRand()),
  },
})

const useAnimal = () => {
  const [animal, setAnimal] = useState<Animal>({ pos: { x: 200, y: 200 } })

  useEffect(() => {
    const t = setInterval(() => {
      setAnimal(updateAnimal)
    }, 1000)

    return () => clearInterval(t)
  }, [])
  return animal
}

const title = 'Diginima デジニマ(Digital animal)'
const Diginima = () => {
  const animal = useAnimal()

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>
      <div>
        <svg width="400" height="400">
          <g>
            <circle cx={animal.pos.x} cy={animal.pos.y} r="10" />
          </g>
        </svg>
      </div>
    </Layout>
  )
}

export default Diginima
