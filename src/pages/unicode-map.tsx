import { Box, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { Title } from '../components/Title'

const UnicodeHilbertMap = dynamic(
  () => import('../components/UnicodeHilbertMap'),
  { ssr: false }
)

const title = 'Unicode ヒルベルトマップ'

const specs = [
  ['対象範囲', 'BMP (U+0000 – U+FFFF) = 65,536 codepoints'],
  ['表示サイズ', '1024×1024 px (1 codepoint = 4×4 px)'],
  ['配置', 'ヒルベルト曲線 / 行優先 (256×256 = 2^8 × 2^8)'],
  [
    '色分け',
    '文字体系 (ラテン=青・CJK=赤・アラビア=黄など) / ブロックハッシュ / レア度 (N・R・SR・SSR) / スペクトラム',
  ],
  ['壁 Lv.', 'Lv.0〜4。空間充填曲線の再帰レベルに対応する分割線'],
  ['特殊領域', '制御文字・サロゲート・PUA・Specials はグレー系'],
  ['SMP 補助表示', '麻雀牌・錬金術記号・ドミノ牌・トランプを帯状に併記'],
  ['インタラクション', 'hover で codepoint / 文字 / ブロック名を表示'],
  ['描画', 'ImageData を 256×256 に書いて 4 倍拡大 (pixelated)'],
] as const

const UnicodeMapPage = () => {
  return (
    <Layout title={title} fullWidth>
      <Title>{title}</Title>
      <Typography sx={{ mb: 2 }}>
        Unicode BMP
        全体をブロックごとに色分けして俯瞰する。ヒルベルト曲線に沿って codepoint
        を並べると、連続する codepoint
        の空間的近接性が保たれ、ブロックが横長の帯ではなく塊として見える。
      </Typography>
      <UnicodeHilbertMap />
      <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1 }}>
        仕様
      </Typography>
      <Box component="dl" sx={{ display: 'grid', gap: 0.5, m: 0 }}>
        {specs.map(([key, value]) => (
          <Box key={key} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Box component="dt" sx={{ minWidth: 140, fontWeight: 'bold' }}>
              {key}
            </Box>
            <Box component="dd" sx={{ m: 0 }}>
              {value}
            </Box>
          </Box>
        ))}
      </Box>
    </Layout>
  )
}

export default UnicodeMapPage
