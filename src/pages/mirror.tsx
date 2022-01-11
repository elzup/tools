import React, { useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { Button, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'mirror camera'
const MirrorCamera = () => {
  const [flip, setFlip] = useState<boolean>(true)
  const [shots, setShots] = useState<string[]>([])
  const toggleFlip = setFlip.bind(null, (v) => !v)

  const webcamRef = React.useRef<Webcam>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isDelay, setIsDelay] = useState<boolean>(false)

  const capture = React.useCallback(() => {
    if (webcamRef.current === null) return
    const imageSrc = webcamRef.current.getScreenshot()

    if (imageSrc !== null) setShots((v) => [imageSrc, ...v])
  }, [webcamRef])

  useEffect(() => {
    const delayTime = 3000

    if (!isDelay) return
    if (!webcamRef.current?.stream || !videoRef.current) return
    const stream = new MediaStream(webcamRef.current.stream)

    videoRef.current.srcObject = stream
    videoRef.current.play()

    const ti = setInterval(async () => {
      if (!webcamRef.current?.stream) return

      // stream.addTrack(webcamRef.current.stream.getVideoTracks()[0])

      // const recorder = new MediaRecorder(webcamRef.current.stream)
      // const chunks: BlobPart[] = []
      // recorder.ondataavailable = function (evt) {
      //   chunks.push(evt.data)
      // }
      // recorder.start(1000)

      // await sleep(delayTime)
      // if (!videoRef.current || chunks.length === 0) return
      // videoRef.current.src = window.URL.createObjectURL(
      //   new Blob(chunks.slice(), { type: 'video/webm' })
      // )
      // videoRef.current.srcObject = webcamRef.current.stream
      // videoRef.current.play()
    }, delayTime)

    return () => {
      // if (recorder) recorder.stop()
      clearInterval(ti)
    }
  }, [isDelay])

  return (
    <Layout title={title}>
      <Title>{title}</Title>

      <Button onClick={toggleFlip}>LR - Flip</Button>
      <Button onClick={capture}>Capture</Button>
      <Button onClick={() => setIsDelay((b) => !b)}>Delay start</Button>
      {/* <Button onClick={handleStopCaptureClick}>Delay stop</Button> */}
      <Webcam
        ref={webcamRef}
        mirrored={flip}
        audio={false}
        style={{ width: '100%' }}
      />
      {/* <video ref={videoRef} /> */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1 1fr)' }}>
        {shots.map((shot, i) => (
          <img style={{ width: '100%' }} key={i} src={shot} alt={'shot'} />
        ))}
      </div>
    </Layout>
  )
}

export default MirrorCamera
