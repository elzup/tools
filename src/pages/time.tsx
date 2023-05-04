import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Mesh, Vector3Tuple } from 'three'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

function Spring() {
  const lineRef = useRef<SVGLineElement>(null)
  const points: Vector3Tuple[] = [
    [-10, 0, 0],
    [0, 10, 0],
    [10, 0, 0],
  ]
  const buffer = useMemo(() => new Float32Array(points.flat()), [...points])

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={buffer}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="black" />
    </line>
  )
}

function Box(props: { position: Vector3Tuple }) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef<Mesh>(null)
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta
  })
  // Return the view, these are regular Threejs elements expressed in JSX

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(e) => click(!clicked)}
      onPointerOver={(e) => hover(true)}
      onPointerOut={(e) => hover(false)}
      position={[0, 0, 0]}
    >
      <boxGeometry args={[10, 2, 2]} />
      <meshPhysicalMaterial color={hovered ? 'hotpink' : 'orange'} />
      <bufferGeometry></bufferGeometry>
    </mesh>
  )
}

const title = 'Time'
const Time = () => {
  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Canvas>
        <ambientLight />
        <Spring />

        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
      </Canvas>
    </Layout>
  )
}

export default Time
