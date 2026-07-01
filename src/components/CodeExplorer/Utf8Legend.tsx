import styled from 'styled-components'
import { utf8Cates, utf8CateInfo } from './constants'

// Byte/UTF-8 View のビット色分けの意味を示す凡例
export const Utf8Legend = () => (
  <Style>
    {utf8Cates.map((cate) => {
      const { color, label, pattern } = utf8CateInfo[cate]

      return (
        <span key={cate} className="item">
          <span className="pat" style={{ color }}>
            {pattern}
          </span>
          <span className="label">{label}</span>
        </span>
      )
    })}
  </Style>
)

const Style = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 4px;

  .item {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-size: 0.7rem;
  }
  .pat {
    font-family: monospace;
    font-weight: 700;
  }
  .label {
    color: #757575;
  }
`
