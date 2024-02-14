import P5 from 'p5'
import { useEffect, useRef } from 'react'

type Props = {
  sketch: (p: P5) => void
}

const P5Wrapper = ({ sketch }: Props) => {
  const sketchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let myP5: P5

    if (sketchRef.current) {
      myP5 = new P5(sketch, sketchRef.current)
    }

    return () => {
      myP5.remove()
    }
  }, [sketch])

  return <div ref={sketchRef}></div>
}

export default P5Wrapper
