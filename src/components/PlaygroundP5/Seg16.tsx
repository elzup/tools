import styled from '@emotion/styled'

const segmentMapping: Record<string, string> = {
  '0': '11111100000000',
  '1': '01100000000000',
  '2': '11011010000000',
  '3': '11110010000000',
  '4': '01100110000000',
  '5': '10110110000000',
  '6': '10111110000000',
  '7': '11100000000000',
  '8': '11111110000000',
  '9': '11110110000000',
  A: '11101110000000',
  B: '11111111000000',
  C: '10011100000000',
  D: '11111001000000',
  E: '10011110000000',
  F: '10001110000000',
  // その他の文字に対しても同様に定義
}

type Props = {
  char: string
}
const SixteenSegDisplay = ({ char }: Props) => {
  const segments = segmentMapping[char.toUpperCase()] || '00000000000000'

  return (
    <Style className="segment-display">
      {segments.split('').map((seg, index) => (
        <div key={index} className={`segment ${seg === '1' ? 'on' : ''}`} />
      ))}
    </Style>
  )
}

export default SixteenSegDisplay

const Style = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 200px; /* コンポーネントのサイズに応じて調整 */
  height: 200px; /* コンポーネントのサイズに応じて調整 */
  position: relative;

  .segment {
    width: 20%; /* セグメントの幅 */
    height: 20%; /* セグメントの高さ */
    background-color: grey; /* オフ状態の色 */
    margin: 1px;
  }

  .segment.on {
    background-color: red; /* オン状態の色 */
  }
`
