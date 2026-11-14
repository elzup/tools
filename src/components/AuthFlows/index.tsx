import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { OtpSection } from './OtpSection'
import { PasskeySection } from './PasskeySection'
import { PasswordSection } from './PasswordSection'
import { SectionHead } from './parts'

const OVERVIEW = [
  {
    name: 'パスワード',
    proof: '知識 (覚えている文字列)',
    stored: 'salt + ハッシュ (平文は保存しない)',
    wire: 'パスワードそのもの (TLS で暗号化されるが偽サイトには丸見え)',
  },
  {
    name: '+ TOTP',
    proof: '知識 + 所持 (共有秘密を持つアプリ)',
    stored: 'ハッシュ + 共有秘密 (検証に使うので読める形)',
    wire: 'パスワード + 30 秒だけ有効なコード',
  },
  {
    name: 'パスキー',
    proof: '所持 (秘密鍵) + 端末ロック解除 (生体 / PIN)',
    stored: '公開鍵 + credential ID (漏れても署名は作れない)',
    wire: 'なし (使い捨て challenge への署名だけ)',
  },
]

type Grade = 'weak' | 'partial' | 'strong'
const GRADE: Record<
  Grade,
  { label: string; color: 'error' | 'warning' | 'success' }
> = {
  weak: { label: '弱い', color: 'error' },
  partial: { label: '一部', color: 'warning' },
  strong: { label: '防げる', color: 'success' },
}

const ATTACKS: { name: string; grades: [Grade, Grade, Grade]; why: string }[] =
  [
    {
      name: '使い回し / リスト型',
      grades: ['weak', 'strong', 'strong'],
      why: '他サイトで漏れたパスワードだけでは 2 要素目が足りない。パスキーはサイトごとに別の鍵。',
    },
    {
      name: '偽サイトに入力',
      grades: ['weak', 'partial', 'strong'],
      why: 'コードは 30 秒で失効するが、その間に使われれば突破。パスキーは rpId が違うので端末が応答しない。',
    },
    {
      name: 'リアルタイム中継 (AiTM)',
      grades: ['weak', 'weak', 'strong'],
      why: '中継者は受け取ったパスワードとコードを即座に本物へ流せる。署名には rpId が入るため中継しても検証で落ちる。',
    },
    {
      name: 'サーバー DB 漏洩',
      grades: ['partial', 'partial', 'strong'],
      why: '弱いパスワードは辞書で解ける。TOTP の共有秘密が漏れるとコードを生成できる。公開鍵からは署名を作れない。',
    },
    {
      name: '端末の紛失・盗難',
      grades: ['strong', 'partial', 'partial'],
      why: 'TOTP・パスキーとも端末ロック (生体 / PIN) が最後の砦。バックアップコードや同期パスキーで復旧手段を用意する。',
    },
  ]

const Overview = () => (
  <section>
    <SectionHead
      no="01"
      title="全体像"
      note="3 方式の違いは「何を証明に使うか」と「サーバーに何を預け、通信路に何を流すか」。シーケンス図の矢印をクリックするか ◀ ▶ で進めると、その時点で誰が何を持っているかが下のパネルに出ます。演習の値はすべてこのブラウザ内で実際に計算しています (外部送信なし)。"
    />
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>方式</TableCell>
            <TableCell>証明の材料</TableCell>
            <TableCell>サーバーが保存</TableCell>
            <TableCell>通信路に流れる秘密</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {OVERVIEW.map((r) => (
            <TableRow key={r.name}>
              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {r.name}
              </TableCell>
              <TableCell>{r.proof}</TableCell>
              <TableCell>{r.stored}</TableCell>
              <TableCell>{r.wire}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </section>
)

const AttackTable = () => (
  <section>
    <SectionHead
      no="05"
      title="攻撃への強さ"
      note="上の演習の結果をまとめたもの。差が出るのは「秘密が通信路に流れるか」「サイトに束縛されているか」「サーバーに何が残るか」。"
    />
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>攻撃</TableCell>
            <TableCell>パスワード</TableCell>
            <TableCell>+ TOTP</TableCell>
            <TableCell>パスキー</TableCell>
            <TableCell>差が出る理由</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ATTACKS.map((a) => (
            <TableRow key={a.name}>
              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {a.name}
              </TableCell>
              {a.grades.map((g, i) => (
                <TableCell key={i}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={GRADE[g].label}
                    color={GRADE[g].color}
                  />
                </TableCell>
              ))}
              <TableCell>{a.why}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Typography
      variant="caption"
      color="text.secondary"
      component="p"
      sx={{ mt: 2 }}
    >
      参考: RFC 6238 (TOTP) / RFC 4226 (HOTP) / W3C
      WebAuthn。教育用の簡略化あり: 実サービスはパスワードに SHA-256 ではなく
      Argon2id / bcrypt を使い、WebAuthn は clientDataJSON・attestation
      等も扱う。
    </Typography>
  </section>
)

const AuthFlows = () => (
  <div>
    <Overview />
    <PasswordSection />
    <OtpSection />
    <PasskeySection />
    <AttackTable />
  </div>
)

export default AuthFlows
