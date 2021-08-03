import React, { useState, useEffect } from 'react'
import Matter, { Engine, Events, Runner, World, Bodies } from 'matter-js'

function useWords() {
  const [words, setWords] = useState<string[] | null>(null)

  useEffect(() => {
    // fetch('/words.nohead.csv').then(async (res) => {
    //   const text = await res.text()
    //   text
    //     .trim()
    //     .split('\n')
    //     .map((line) => line.split(','))
    // })
  }, [setWords])

  return words
}

const engine = Engine.create()
const runner = Runner.create()
const WIDTH = 640
const HEIGHT = 480

function Component() {
  const [bodies, setBodies] = useState<Matter.Body[]>([])

  useEffect(() => {
    const handleUpdate = () => {
      const bodies = Matter.Composite.allBodies(engine.world)

      setBodies(bodies)
    }

    Events.on(engine, 'afterUpdate', handleUpdate)

    Runner.run(runner, engine)

    return () => {
      Events.off(engine, 'afterUpdate', handleUpdate)
      Runner.stop(runner)
    }
  }, [])

  const bodyItems = bodies.map((body) => {
    if (!body.parts) return null
    return body.parts.map((part) => {
      return (
        <circle
          key={part.id}
          cx={part.position.x}
          cy={part.position.y}
          r={part.circleRadius}
          fill="lightgreen"
        />
      )
    })
  })

  return (
    <div>
      <h3>react-physics</h3>
      <svg width={WIDTH} height={HEIGHT} style={{ backgroundColor: '#243d52' }}>
        <g transform={`scale(1,1) translate(${WIDTH / 2},${HEIGHT / 2})`}>
          {bodyItems}
        </g>
      </svg>
      <button
        onClick={() => {
          const circle = Bodies.circle(0, -1.0, 10)

          Matter.Body.applyForce(circle, { x: 0, y: 0 }, { x: 0, y: -0.01 })
          World.add(engine.world, circle)
        }}
      >
        PUSH
      </button>
    </div>
  )
}

export default Component
