import React, { useState } from 'react'
import Webcam from 'react-webcam'
import { Button, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'

const title = 'mirror camera'
const MirrorCamera = () => {
  const [flip, setFlip] = useState<boolean>(false)
  const [shots, setShots] = useState<string[]>([])
  const toggleFlip = setFlip.bind(null, (v) => !v)
  const webcamRef = React.useRef<Webcam>(null)

  const capture = React.useCallback(() => {
    if (webcamRef.current === null) return
    const imageSrc = webcamRef.current.getScreenshot()

    if (imageSrc !== null) setShots((v) => [imageSrc, ...v])
  }, [webcamRef])

  return (
    <Layout title={title}>
      <Header as="h1">{title}</Header>

      <Button onClick={toggleFlip}>LR - Flip</Button>
      <Button onClick={capture}>Capture</Button>
      <Webcam
        ref={webcamRef}
        mirrored={flip}
        audio={false}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1 1fr)' }}>
        {shots.map((shot, i) => (
          <img style={{ width: '100%' }} key={i} src={shot} alt={'shot'} />
        ))}
      </div>
    </Layout>
  )
}

export default MirrorCamera
