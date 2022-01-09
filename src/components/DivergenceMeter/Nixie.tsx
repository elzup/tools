import { range } from 'lodash'
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
      left: 0;
      line-height: 1em;
      width: 60px;
      text-shadow: rgba(50, 50, 50, 0.05) 0 0 1px;
      //color: rgba(12, 12, 12, 1);
      color: rgba(40, 40, 40, 0.15);

      &[data-active='true'] {
        color: #ffdb9e;
        opacity: 1;

        text-shadow: #ff4d00 0 0 112px, #ffa916 0 0 48px, #ef9700 0 0 24px,
          #ef9700 0 0 16px, #ef9700 0 0 4px;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: #ff6e00;
      }
      /* &[data-char='‡'] {
        font-weight: 100;
        color: #ff6e0022;
      } */
      &[data-char='.'] {
        left: 32px;
      }
      &[data-char='0'] {
        left: -10px;
      }
      &[data-char='2'] {
        left: -8px;
      }
      &[data-char='3'] {
      }
      &[data-char='5'] {
        left: -4px;
      }
      &[data-char='6'] {
        left: -9px;
      }
      &[data-char='7'] {
        left: -6px;
      }
      &[data-char='8'] {
        left: -7px;
      }
      &[data-char='9'] {
        left: -9px;
      }
      &:not([data-char='.']) {
      }
    }

    .dagger {
      position: absolute;
      left: 0;
      display: grid;
      width: 60px;
      grid-template-columns: 30px 30px;
      grid-template-rows: 47px 47px 47px;
      height: 1em;

      > div {
        border-color: orange;
        border-width: 3px;
        opacity: 0.7;
        border-image: linear-gradient(
          50deg,
          #c21500 0%,
          #ffc500 30%,
          #c21500 60%,
          #ffc500 100%
        );
        border-image-slice: 1;
      }
      > :nth-of-type(1) {
        margin-top: 20px;
        height: 27px;
        border-right-style: solid;
        border-bottom-style: solid;
      }
      > :nth-of-type(2) {
        border-bottom-style: solid;
      }
      > :nth-of-type(3) {
        border-right-style: solid;
        border-bottom-style: solid;
      }
      > :nth-of-type(4) {
        border-bottom-style: solid;
      }
      > :nth-of-type(5) {
        border-right-style: solid;
        height: 32px;
      }
      > :nth-of-type(6) {
      }

      /*  下消し */
      &[data-char='0'],
      &[data-char='1'],
      &[data-char='2'],
      &[data-char='7'] {
        > :nth-of-type(3),
        > :nth-of-type(4) {
          border-bottom-style: none;
        }
      }
      /*  上消し */
      &[data-char='3'],
      &[data-char='4'],
      &[data-char='6'] {
        > :nth-of-type(1),
        > :nth-of-type(2) {
          border-bottom-style: none;
        }
      }
      &[data-char='.'] {
        > div {
          border: none;
        }
      }
    }
  }
`

function Nixie({ active }: Props) {
  return (
    <NixieContainer>
      <div className="tube">
        <div className="dagger" data-char={active}>
          {range(6).map((i) => (
            <div key={i}></div>
          ))}
        </div>
        {NUMS.map((n) => (
          <span
            key={n}
            className="digit"
            data-active={n === active}
            data-char={n}
          >
            {n}
          </span>
        ))}
      </div>
    </NixieContainer>
  )
}

export default Nixie
