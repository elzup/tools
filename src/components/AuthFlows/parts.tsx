import { Alert, Paper, Typography, styled } from '@mui/material'
import type { ReactNode } from 'react'

export const Mono = styled('code')({
  fontFamily: 'monospace',
  fontSize: '0.92em',
  overflowWrap: 'anywhere',
})

export const Row = styled('div')({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
  margin: '6px 0',
})

export type Verdict = { text: string; isSafe?: boolean }

/** 攻撃演習の結果。isSafe 未指定は中立 (まだ押していない) */
export const VerdictBox = ({ verdict }: { verdict: Verdict }) => (
  <Alert
    severity={
      verdict.isSafe === undefined
        ? 'info'
        : verdict.isSafe
          ? 'success'
          : 'error'
    }
    sx={{
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      fontSize: 12,
      mt: 1,
    }}
  >
    {verdict.text}
  </Alert>
)

export const Card = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
    <Typography fontWeight={700} sx={{ mb: 1 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

export const SectionHead = ({
  no,
  title,
  note,
}: {
  no: string
  title: string
  note: ReactNode
}) => (
  <>
    <Typography variant="h5" component="h2" sx={{ mt: 5, mb: 1 }} id={`s${no}`}>
      <Typography
        component="span"
        color="primary"
        sx={{ mr: 1, fontFamily: 'monospace' }}
      >
        {no}
      </Typography>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {note}
    </Typography>
  </>
)
