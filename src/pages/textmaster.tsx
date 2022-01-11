import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'

type Props = {}
function Component(_props: Props) {
  const [text, setText] = useState<string>('')
  const [pretext, setPreText] = useState<null | string>(null)

  return (
    <div>
      <Button
        onMouseOver={() => setPreText(text.replace(/^\$\s+/gm, ''))}
        onMouseLeave={() => setPreText(null)}
        onClick={() => {
          setText(text.replace(/^\$\s+/gm, ''))
        }}
      >
        delete $
      </Button>

      <Button
        onClick={() => {
          setText(text.replace(/^[\s]+|[\s]+$/gm, ''))
        }}
      >
        delete Spaces
      </Button>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
        }}
      ></textarea>
      <pre style={{ background: pretext ? '#ddd' : '#aaa' }}>
        {(pretext || text).split('').map((c, i) => (
          <span
            style={{
              borderBottom: '1px solid #ccc',
            }}
            key={`${c}_${i}`}
          >
            {c}
          </span>
        ))}
      </pre>
    </div>
  )
}

export default Component
