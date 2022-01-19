import React from 'react'
import styled from 'styled-components'
import { groups, picmins } from './picminConstants'

type Props = {}

function PikblMemo(props: Props) {
  return (
    <Style>
      <table>
        <tbody>
          <tr>
            <th>Group</th>
            {picmins.map((p, i) => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
          {groups.map((g, i) => (
            <tr key={g.id}>
              <th>{g.name}</th>
              {picmins.map((p, j) => (
                <td key={p.id}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Style>
  )
}
const Style = styled.div``

export default PikblMemo
