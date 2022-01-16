import React, { SVGProps } from 'react'
import styled from 'styled-components'

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
      <g id="g1">
        <circle id="c1" cx={100} cy={100} r={100} />
        <circle id="c2" cx={200} cy={140} r={100} />
        <rect id="c3" x={100} y={100} width={100} height={100} />
        <line id="c4" x1={100} y1={100} x2={200} y2={140} />
      </g>
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
  #g1 {
    animation: move 10s infinite;
  }
  @keyframes move {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(100%);
    }
  }
`

export default SvgPlay
