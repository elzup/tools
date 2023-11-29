import { BoxProps, Box as MuiBox, Theme } from '@mui/material'
import { SystemProps } from '@mui/system'
import React from 'react'

export type CustomBoxProps = {
  sx?: BoxProps['sx']
  children?: React.ReactNode
  id?: string
  className?: string
} & SystemProps<Theme>

export function Box(props: CustomBoxProps) {
  return <MuiBox component="div" {...props} />
}
