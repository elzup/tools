import { IconButton, Tooltip } from '@mui/material'
import { useState } from 'react'
import { FaCheck, FaRegCopy } from 'react-icons/fa'
import { writeClipboard } from '../../lib/clipboard'

type Props = {
  text: string
  title?: string
}

export const CopyButton = ({ text, title = 'copy' }: Props) => {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    await writeClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Tooltip title={copied ? 'copied!' : title}>
      <span>
        <IconButton
          size="small"
          onClick={handleClick}
          aria-label={title}
          disabled={text.length === 0}
          color={copied ? 'success' : 'default'}
        >
          {copied ? <FaCheck size={14} /> : <FaRegCopy size={14} />}
        </IconButton>
      </span>
    </Tooltip>
  )
}
