import { Typography } from '@mui/material'
import { WithChild } from '../types'

export const Title = ({ children }: WithChild) => {
  return (
    <Typography variant="h3" component="h1" sx={{ mb: 3 }}>
      {children}
    </Typography>
  )
}
