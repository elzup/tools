import { useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const title = 'Gray Code Visualizer'

type GrayCodeEntry = {
  index: number
  binary: string
  grayCode: string
  grayCodeDecimal: number
  formula: string
}

const generateGrayCode = (bits: number): GrayCodeEntry[] => {
  const max = 2 ** bits
  const entries: GrayCodeEntry[] = []

  for (let i = 0; i < max; i++) {
    const gray = i ^ (i >> 1)
    const binary = i.toString(2).padStart(bits, '0')
    const grayBinary = gray.toString(2).padStart(bits, '0')
    const formula = `${i} ^ (${i} >> 1) = ${i} ^ ${i >> 1} = ${gray}`

    entries.push({
      index: i,
      binary,
      grayCode: grayBinary,
      grayCodeDecimal: gray,
      formula,
    })
  }

  return entries
}

const GrayCodeVisualizer = () => {
  const [bits, setBits] = useState(3)
  const [currentStep, setCurrentStep] = useState(0)

  const entries = generateGrayCode(bits)
  const maxSteps = entries.length

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, maxSteps - 1))
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleReset = () => {
    setCurrentStep(0)
  }

  return (
    <Layout title={title}>
      <Title>{title}</Title>
      <Container>
        <Description>
          <p>
            Gray code is a binary numeral system where two successive values
            differ in only one bit.
          </p>
          <p>
            Formula: <code>gray(i) = i ^ (i &gt;&gt; 1)</code>
          </p>
          <p>
            The <strong style={{ color: '#ff5722' }}>red highlighted bits</strong>{' '}
            show which bit changed from the previous step.
            The <strong>▼</strong> marker indicates the position of the changed
            bit.
          </p>
        </Description>

        <Controls>
          <ControlGroup>
            <label>Bits:</label>
            <select
              value={bits}
              onChange={(e) => {
                setBits(Number(e.target.value))
                setCurrentStep(0)
              }}
            >
              <option value={2}>2 bits</option>
              <option value={3}>3 bits</option>
              <option value={4}>4 bits</option>
              <option value={5}>5 bits</option>
            </select>
          </ControlGroup>
        </Controls>

        <StepControls>
          <button onClick={handlePrev} disabled={currentStep === 0}>
            ← Previous
          </button>
          <span>
            Step {currentStep + 1} / {maxSteps}
          </span>
          <button onClick={handleNext} disabled={currentStep === maxSteps - 1}>
            Next →
          </button>
          <button onClick={handleReset}>Reset</button>
        </StepControls>

        <Table>
          <thead>
            <tr>
              <th>i</th>
              <th>Binary</th>
              <th>i &gt;&gt; 1</th>
              <th>Gray Code</th>
              <th>Dec</th>
              <th>Changed Bit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const prevEntry = idx > 0 ? entries[idx - 1] : null
              const isCurrentStep = idx === currentStep

              return (
                <tr key={entry.index} className={isCurrentStep ? 'current' : ''}>
                  <td>{entry.index}</td>
                  <td>
                    <code>{entry.binary}</code>
                  </td>
                  <td>
                    <code>{(entry.index >> 1).toString(2).padStart(bits, '0')}</code>
                  </td>
                  <td>
                    <code className="highlight">
                      {entry.grayCode.split('').map((bit, bitIdx) => {
                        const changed =
                          prevEntry && bit !== prevEntry.grayCode[bitIdx]
                        return (
                          <span
                            key={bitIdx}
                            className={changed ? 'changed-bit' : ''}
                          >
                            {bit}
                          </span>
                        )
                      })}
                    </code>
                  </td>
                  <td>{entry.grayCodeDecimal}</td>
                  <td className="diff-cell">
                    {prevEntry ? (
                      <code className="diff">
                        {entry.grayCode.split('').map((bit, bitIdx) => {
                          const changed = bit !== prevEntry.grayCode[bitIdx]
                          return (
                            <span key={bitIdx} className={changed ? 'marker' : ''}>
                              {changed ? '▼' : '·'}
                            </span>
                          )
                        })}
                      </code>
                    ) : (
                      <span className="first-row">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>

        <FormulaBox>
          <h3>Calculation for step {currentStep}</h3>
          <p>{entries[currentStep].formula}</p>
          <Explanation>
            <p>
              <strong>Binary:</strong> {entries[currentStep].binary} (
              {entries[currentStep].index} in decimal)
            </p>
            <p>
              <strong>Right shift (i &gt;&gt; 1):</strong>{' '}
              {(entries[currentStep].index >> 1).toString(2).padStart(bits, '0')}{' '}
              ({entries[currentStep].index >> 1} in decimal)
            </p>
            <p>
              <strong>XOR result:</strong> {entries[currentStep].grayCode} (
              {entries[currentStep].grayCodeDecimal} in decimal)
            </p>
          </Explanation>
        </FormulaBox>

        <InfoBox>
          <h3>Properties of Gray Code</h3>
          <ul>
            <li>
              Only one bit changes between consecutive values (Hamming distance =
              1)
            </li>
            <li>The sequence is cyclic (last value differs by 1 bit from first)</li>
            <li>Used in error correction, digital communications, and rotary encoders</li>
          </ul>
        </InfoBox>
      </Container>
    </Layout>
  )
}

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
`

const Description = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;

  p {
    margin: 8px 0;
  }

  code {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }
`

const Controls = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
`

const ControlGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  label {
    font-weight: 500;
  }

  select {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: white;
    color: #333;
    cursor: pointer;
  }

  input[type='checkbox'] {
    cursor: pointer;
  }
`

const StepControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
  justify-content: center;

  button {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #007aff;
    background: #007aff;
    color: white;
    cursor: pointer;
    font-weight: 500;

    &:hover:not(:disabled) {
      background: #0056b3;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    font-weight: 500;
    min-width: 100px;
    text-align: center;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  background: white;
  color: #333;
  border-radius: 8px;
  overflow: hidden;

  th,
  td {
    padding: 12px 8px;
    text-align: center;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
    white-space: nowrap;

    &:nth-child(1) {
      width: 50px;
    }
    &:nth-child(2) {
      width: 100px;
    }
    &:nth-child(3) {
      width: 100px;
    }
    &:nth-child(4) {
      min-width: 140px;
    }
    &:nth-child(5) {
      width: 60px;
    }
    &:nth-child(6) {
      min-width: 120px;
    }
  }

  tbody tr:hover {
    background: #f9f9f9;
  }

  tbody tr.current {
    background: #e3f2fd;
    box-shadow: inset 0 0 0 2px #2196f3;

    &:hover {
      background: #bbdefb;
    }
  }

  code {
    font-family: 'Courier New', monospace;
    font-size: 0.95rem;
    padding: 4px 8px;
    border-radius: 4px;
    background: #f0f0f0;
    display: inline-flex;
    gap: 2px;

    &.highlight {
      background: #fff3cd;
      font-weight: 600;
      color: #856404;

      span {
        display: inline-block;
        padding: 0 2px;
        border-radius: 2px;
        transition: all 0.2s;

        &.changed-bit {
          background: #ff5722;
          color: white;
          font-weight: 700;
          transform: scale(1.1);
        }
      }
    }

    &.diff {
      color: #007aff;
      font-weight: 600;
      letter-spacing: 1px;

      span {
        display: inline-block;
        width: 12px;
        text-align: center;

        &.marker {
          color: #ff5722;
          font-size: 1.1rem;
          font-weight: 700;
        }
      }
    }
  }

  tbody tr.current code.highlight {
    background: #ffc107;
    color: #000;

    span.changed-bit {
      background: #d32f2f;
      color: white;
    }
  }

  .diff-cell {
    font-weight: 600;

    .first-row {
      color: #999;
      font-size: 0.9rem;
    }
  }
`

const FormulaBox = styled.div`
  padding: 20px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
  }

  p {
    margin: 8px 0;
    font-family: 'Courier New', monospace;
  }
`

const Explanation = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  p {
    margin: 6px 0;
    font-family: inherit;
  }

  strong {
    font-weight: 600;
  }
`

const InfoBox = styled.div`
  padding: 20px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin: 8px 0;
    }
  }
`

export default GrayCodeVisualizer
