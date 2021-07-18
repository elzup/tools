import React from 'react'
import { Button } from 'semantic-ui-react'

const toj = (a: unknown) => JSON.stringify(a, null, '\t')
const SubWindowParts = () => (
  <div>
    <Button
      primary
      onClick={() => {
        window.open(location.href)
      }}
    >
      {`window.open(location.href)`}
    </Button>
    <Button
      primary
      onClick={() => {
        window.open(location.href, '_blank', 'height=300,width=300')
      }}
    >
      {`window.open(location.href, '_blank', 'height=300,width=300')`}
    </Button>

    <pre>{/* <code>{toj(window.opener)}</code> */}</pre>
  </div>
)

export default SubWindowParts
