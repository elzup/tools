import dynamic from 'next/dynamic'
import React from 'react'
import styled from 'styled-components'
import { Circle, Fan, Rect, SmallRect } from './Shape'

const RandomShapeTree = dynamic(() => import('./RandomShapeTree'), {
  ssr: false,
})

const W = 1280
const H = 720

const Ground = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      stroke={'#000'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <svg x={400} y={400} viewBox="">
        <RandomShapeTree
          w={400}
          depthLimit={4}
          force={{ pos: { sx: 0, sy: 0 } }}
        />
      </svg>
    </svg>
  )
}
const SvgPlay = () => {
  return (
    <Style>
      <Ground />
    </Style>
  )
}
const Style = styled.div`
  border: gray solid 1px;
  svg {
    overflow: visible;
  }
  .spin {
    animation: spin 10s linear infinite;
  }
  .move {
    /* animation: move 10s linear infinite; */
  }
  @keyframes move {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

export default SvgPlay
