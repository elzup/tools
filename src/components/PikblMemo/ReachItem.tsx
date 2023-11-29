import { Typography } from '@mui/material'
import React from 'react'
import { RiPlantLine } from 'react-icons/ri'
import styled from 'styled-components'
import { Box } from '../common/mui'
import { Group, MemoState, picmins } from './picminConstants'

type Props = {
  group: Group
  memo?: Record<string, MemoState>
}

function ReachItem({ group: g, memo }: Props) {
  return (
    <Style>
      <div className="label">
        <Typography>{g.name}</Typography>
        <div>
          <g.icon></g.icon>
        </div>
      </div>
      <Box key={g.id} sx={{ display: 'flex' }}>
        {(g.only
          ? picmins.filter((p) => g.only?.find((v) => v === p.id))
          : picmins
        )
          .filter((p) => p !== undefined)
          .filter((p) => memo?.[p.id] === 'emp' || memo?.[p.id] === undefined)
          .map((p) => (
            <div className="least" key={p.id} style={{ background: p.color }}>
              <RiPlantLine></RiPlantLine>
              <p>{p.name}</p>
            </div>
          ))}
      </Box>
    </Style>
  )
}

const Style = styled(Box)`
  width: 100%;
  display: grid;
  grid-template-columns: 140px 1fr;
  .label {
    padding-top: 8px;
    display: flex;
    > div {
      padding-top: 2px;
    }
  }
`

export default ReachItem
