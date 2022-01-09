import React from 'react'
import styled from 'styled-components'

const NUMS = '6574839210.'.split('')

type Props = {
  active: string
}
const NixieContainer = styled.div`
  position: relative;
  font-family: 'Quicksand', sans-serif;
  font-size: 10em;
  text-align: center;
  letter-spacing: 0.1em;

  .tube {
    position: relative;
    display: inline-block;
    text-align: center;
    width: 60px;
    height: 240px;
    margin: 6px;

    .digit {
      position: absolute;
      width: 170px;
      line-height: 1.65em;
      left: 0;
      text-shadow: rgba(50, 50, 50, 0.05) 0 0 1px;
      //color: rgba(12, 12, 12, 1);
      color: transparent;
      -webkit-text-stroke-width: 3px;
      -webkit-text-stroke-color: rgba(40, 40, 40, 0.15);

      &[data-active='true'] {
        color: #ffdb9e;
        opacity: 1;
        text-shadow: #ff4d00 0 0 112px, #ffa916 0 0 48px, #ef9700 0 0 24px,
          #ef9700 0 0 16px, #ef9700 0 0 4px;
        -webkit-text-stroke-width: 3px;
        -webkit-text-stroke-color: #ff6e00;
      }
    }
  }
`

function Nixie({ active }: Props) {
  return (
    <NixieContainer>
      <span className="tube">
        {NUMS.map((n) => (
          <span key={n} className="digit" data-active={n === active}>
            {n}
          </span>
        ))}
      </span>
    </NixieContainer>
  )
}

export default Nixie
