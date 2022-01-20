import React from 'react'
import styled from 'styled-components'
import { groups, picmins } from './picminConstants'

function PikblMemo() {
  return (
    <Style>
      <table>
        <tbody>
          <tr>
            <th>Group</th>
            {picmins.map((p) => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
          {groups.map((g) => (
            <tr key={g.id}>
              <th>{g.name}</th>
              {picmins.map((p) => (
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
