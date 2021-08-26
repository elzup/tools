import React, { useState, useEffect } from 'react'
import Matter, { Engine, Events, Runner, World, Bodies } from 'matter-js'

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

    const circle1 = Bodies.circle(100, -2.0, 10)
    const circle2 = Bodies.circle(-100, -1.0, 10)

    Matter.Body.applyForce(circle1, { x: 0, y: 0 }, { x: -0.01, y: -0.01 })
    World.add(engine.world, circle1)
    Matter.Body.applyForce(circle2, { x: 0, y: 0 }, { x: 0.01, y: -0.01 })
    World.add(engine.world, circle2)

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
          const circle1 = Bodies.circle(100, -2.0, 10)
          const circle2 = Bodies.circle(-100, -1.0, 10)

          Matter.Body.applyForce(
            circle1,
            { x: 0, y: 0 },
            { x: -0.01, y: -0.01 }
          )
          World.add(engine.world, circle1)
          Matter.Body.applyForce(circle2, { x: 0, y: 0 }, { x: 0.01, y: -0.01 })
          World.add(engine.world, circle2)
        }}
      >
        PUSH
      </button>
    </div>
  )
}

export default Component
