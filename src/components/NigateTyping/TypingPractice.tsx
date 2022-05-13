import { asciify, range } from '@elzup/kit'
import React from 'react'
import styled from 'styled-components'

type Props = {
  word: string
}
function TypingPractice({ word }: Props) {
  const ans = range(10)
    .map(() => word + ' ')
    .join('')
  const [text, setText] = React.useState('')
  const onChange = (text: string) => {
    if (text === ans) {
      return setText('')
    }
    if (text.length > ans.length) return
    setText(text)
  }

  return (
    <Style>
      <div className="result">
        {ans.split('').map((c, i) => (
          <span
            key={i}
            data-correct={c === text[i]}
            data-current={i === text.length}
            data-leached={i < text.length}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="in">
        <input
          onChange={(e) => onChange(asciify(e.currentTarget.value))}
          value={text}
        />
      </div>
    </Style>
  )
}

const Style = styled.div`
  border: solid 1px #ccc;
  border-radius: 4px;
  padding: 0.4rem 0.2rem;
  .result {
    margin-left: 4px;
    span {
      color: gray;
      &[data-correct='true'] {
        color: black;
      }
      &[data-correct='false'][data-leached='true'] {
        color: red;
        border-bottom: solid 1px red;
      }
      &[data-current='true'] {
        border-bottom: solid 1px blue;
        background: hsla(180, 50%, 50%, 0.5);
      }
    }
  }

  .in input {
    width: 100%;
  }

  .result span,
  .in input {
    font-family: 'Roboto Mono', monospace;
    font-size: 100%;
  }
`

export default TypingPractice
