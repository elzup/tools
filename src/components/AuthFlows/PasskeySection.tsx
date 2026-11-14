import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  FAKE_RP_ID,
  RP_ID,
  generatePasskey,
  publicKeyX,
  randomBytes,
  short,
  signChallenge,
  toHex,
  verifyChallenge,
  type Bytes,
} from './crypto'
import { Card, Mono, Row, SectionHead, type Verdict, VerdictBox } from './parts'
import type { Item, Scenario } from './scenario'
import { SequenceView } from './SequenceView'

type Site = 'real' | 'fake'

export type PkCtx = {
  site: Site
  pubX: string
  credId: Bytes
  regChal: Bytes
  chal: Bytes
  sig: Bytes
  isVerified: boolean
}

const rpIdOf = (site: Site) => (site === 'real' ? RP_ID : FAKE_RP_ID)
const LOGIN_CHAL = 'challenge (使い捨て)'

export const pkScenario: Scenario<PkCtx> = {
  actors: ['ユーザー', '認証器 (端末)', 'ブラウザ', 'サーバー'],
  vaults: [
    { key: 'user', title: 'ユーザー' },
    { key: 'auth', title: '認証器 (端末の安全領域)' },
    { key: 'browser', title: 'ブラウザ' },
    { key: 'wire', title: '通信路 (偽サイトなら全部見える)', isWire: true },
    { key: 'server', title: 'サーバー / DB' },
  ],
  steps: [
    {
      phase: `登録 (${RP_ID})`,
      msg: [4, 3],
      label: `challenge + rpId=${RP_ID} + user ID`,
      title: 'サーバーが登録を依頼',
      desc: 'rpId はサイトの識別子 (ドメイン)。この鍵は以後このドメインでしか使えなくなる。',
      add: (c) => ({
        wire: [{ k: '登録 challenge', v: short(toHex(c.regChal)) }],
        server: [
          { k: '登録 challenge (使い捨て)', v: short(toHex(c.regChal)) },
        ],
      }),
    },
    {
      msg: [3, 2],
      kind: 'local',
      label: 'create(): ブラウザが URL のドメインを添える',
      title: 'ブラウザが認証器に依頼',
      desc: 'rpId が今開いているページのドメインと合っているかはブラウザが確認する。ページ側の JS では偽れない。',
      add: { auth: [{ k: 'rpId', v: RP_ID }] },
    },
    {
      msg: [1, 2],
      kind: 'local',
      label: '指紋 / 顔 / PIN で本人確認',
      title: '端末のロック解除',
      desc: '生体情報は端末の中で照合されるだけで、どこにも送られない。「この端末の持ち主が今操作している」ことの確認。',
      add: {
        user: [{ k: '指紋・顔・PIN', v: '端末内でのみ照合' }],
        auth: [{ k: '本人確認', v: 'OK' }],
      },
    },
    {
      note: 2,
      label: '鍵ペアを生成 (rpId に紐付けて保存)',
      title: 'サイト専用の鍵ペア',
      desc: (c) => (
        <>
          P-256 の鍵ペアを作る。秘密鍵は取り出せない形で保存 (この演習でも
          extractable: false で生成)。iCloud キーチェーン / Google
          パスワードマネージャーは E2E 暗号化して自分の端末間で同期する。
          <br />
          公開鍵 x = <Mono>{short(c.pubX, 22)}</Mono>
        </>
      ),
      add: (c) => ({
        auth: [
          { k: `秘密鍵 (${RP_ID} 用)`, v: '取り出し不可', secret: true },
          { k: '公開鍵', v: short(c.pubX, 22) },
        ],
      }),
    },
    {
      msg: [2, 4],
      label: '公開鍵 + credential ID (ブラウザ経由)',
      title: '公開鍵だけ渡す',
      desc: '送るのは公開鍵。盗まれても困らない値なので、サーバーに秘密は何も残らない。',
      add: (c) => ({
        wire: [
          { k: '公開鍵', v: short(c.pubX, 22) },
          { k: 'credential ID', v: short(toHex(c.credId)) },
        ],
        server: [
          { k: '公開鍵 (alice)', v: short(c.pubX, 22) },
          { k: 'credential ID', v: short(toHex(c.credId)) },
        ],
      }),
      rm: { server: ['登録 challenge (使い捨て)'] },
    },
    {
      phase: 'ログイン',
      msg: [4, 3],
      label: (c) =>
        `challenge (毎回ランダム)${c.site === 'real' ? '' : ' → 偽サイトが中継'}`,
      title: 'サーバーが問題を出す',
      desc: (c) =>
        c.site === 'real' ? (
          <>
            毎回新しい乱数。署名の使い回しを防ぐ。challenge ={' '}
            <Mono>{toHex(c.chal)}</Mono>
          </>
        ) : (
          `偽サイト ${FAKE_RP_ID} が本物から challenge を取ってきて、自分のページでユーザーに認証させようとする。`
        ),
      add: (c) => ({
        wire: [{ k: 'challenge', v: short(toHex(c.chal)) }],
        server: [{ k: LOGIN_CHAL, v: short(toHex(c.chal)) }],
      }),
    },
    {
      msg: [3, 2],
      kind: 'local',
      label: (c) => `get(): rpId=${rpIdOf(c.site)}`,
      title: 'ブラウザは今のドメインを添える',
      desc: (c) =>
        c.site === 'real'
          ? `ドメインが ${RP_ID} なので、認証器は該当する鍵を見つける。`
          : `ブラウザが添えるのは実際に開いているドメイン ${FAKE_RP_ID}。認証器にはその rpId の鍵が無いので、本物の世界ではここで終わる (ユーザーには候補が出ない)。以降は「無理やり署名させたら」の仮定で計算している。`,
      add: (c) => ({
        auth: [
          {
            k: '鍵の検索',
            v:
              c.site === 'real'
                ? `${RP_ID} 用の鍵あり`
                : `${FAKE_RP_ID} 用の鍵なし → 応答しない`,
          },
        ],
      }),
    },
    {
      msg: [1, 2],
      kind: 'local',
      label: '指紋 / 顔 / PIN',
      title: 'もう一度ロック解除',
      desc: '毎回「今、本人が操作している」ことを確かめる。',
    },
    {
      note: 2,
      label: (c) => `秘密鍵で署名 sign(SHA-256(${rpIdOf(c.site)}) ‖ challenge)`,
      title: '署名を作る',
      desc: (c) => (
        <>
          署名対象に <b>rpId のハッシュ</b>が入るのがポイント。signature ={' '}
          <Mono>{short(toHex(c.sig), 32)}</Mono>
        </>
      ),
      add: (c) => ({ auth: [{ k: '署名', v: short(toHex(c.sig), 22) }] }),
      rm: { auth: ['鍵の検索'] },
    },
    {
      msg: [2, 4],
      label: '署名 + credential ID (ブラウザ経由)',
      title: '署名だけ送る',
      desc: '流れるのは「この challenge に対する署名」だけ。秘密鍵もパスワードも流れない。',
      add: (c) => ({ wire: [{ k: '署名', v: short(toHex(c.sig), 22) }] }),
    },
    {
      note: 4,
      label: '公開鍵で検証 (rpId と challenge も照合)',
      title: 'サーバーが検証',
      desc: (c) => (
        <>
          サーバーは「SHA-256({RP_ID}) ‖ 自分が出した
          challenge」に対する署名か、保存済み公開鍵で検証する。結果:{' '}
          <b>
            {c.isVerified
              ? '検証成功'
              : '検証失敗 (rpId が違うので署名が合わない)'}
          </b>
        </>
      ),
      add: (c) => ({
        server: [{ k: '検証結果', v: c.isVerified ? '成功' : '失敗' }],
      }),
      rm: { server: [LOGIN_CHAL] },
    },
    {
      msg: [4, 3],
      kind: (c) => (c.isVerified ? 'ok' : 'secret'),
      label: (c) => (c.isVerified ? 'セッション Cookie' : 'ログイン拒否'),
      title: '結果',
      desc: (c) =>
        c.isVerified
          ? 'challenge は消費済みなので、同じ署名はもう使えない。'
          : '中継しても突破できない。これがパスキーのフィッシング耐性。',
      add: (c): Partial<Record<string, Item[]>> =>
        c.isVerified
          ? { browser: [{ k: 'セッション Cookie', secret: true }] }
          : {},
    },
  ],
}

export const PasskeySection = () => {
  const [keys, setKeys] = useState<CryptoKeyPair | null>(null)
  const [base] = useState(() => ({
    credId: randomBytes(16),
    regChal: randomBytes(16),
  }))
  const [site, setSite] = useState<Site>('real')
  const [chal, setChal] = useState(() => randomBytes(16))
  const [ctx, setCtx] = useState<PkCtx | null>(null)
  const [attack, setAttack] = useState<Verdict>({
    text: 'ボタンを押して結果を確認。',
  })

  useEffect(() => {
    generatePasskey().then(setKeys)
  }, [])

  useEffect(() => {
    if (!keys) return
    let isActive = true
    ;(async () => {
      const sig = await signChallenge(keys.privateKey, rpIdOf(site), chal)
      const isVerified = await verifyChallenge(keys.publicKey, sig, chal)
      const pubX = await publicKeyX(keys.publicKey)
      if (isActive) setCtx({ ...base, site, chal, sig, isVerified, pubX })
    })()
    return () => {
      isActive = false
    }
  }, [keys, site, chal, base])

  const attackDb = async () => {
    if (!keys || !ctx) return
    // 公開鍵しか無い攻撃者は署名を作れないので、ランダムな 64 バイト (P-256 署名長) を送るしかない
    const isOk = await verifyChallenge(
      keys.publicKey,
      randomBytes(64),
      ctx.chal
    )
    setAttack({
      text: `攻撃者が得たもの: 公開鍵 ${short(ctx.pubX)} と credential ID だけ\n公開鍵から秘密鍵は求められないので、適当な 64 バイトを署名として送ってみる…\n→ 検証 ${isOk ? '成功 (?!)' : '失敗'}。DB が丸ごと漏れてもログインには使えない。`,
      isSafe: !isOk,
    })
  }

  const attackReplay = async () => {
    if (!keys || !ctx) return
    const newChal = randomBytes(16)
    const isOk = await verifyChallenge(keys.publicKey, ctx.sig, newChal)
    setAttack({
      text: `盗聴した署名 (challenge ${short(toHex(ctx.chal))} 用) を、次のログインで送る。\nサーバーは新しい challenge ${short(toHex(newChal))} を出しているので照合対象が違う\n→ 検証 ${isOk ? '成功 (?!)' : '失敗'}。署名は 1 回きり。`,
      isSafe: !isOk,
    })
  }

  return (
    <section>
      <SectionHead
        no="04"
        title="パスキー (WebAuthn / FIDO2)"
        note="登録時に端末がサイト (rpId) 専用の鍵ペアを作り、公開鍵だけをサーバーへ。ログインはサーバーが出す使い捨ての challenge に秘密鍵で署名し、サーバーが公開鍵で検証する。指紋や顔は端末のロック解除に使うだけで、送信されない。"
      />
      <Card title="演習: アクセス中のサイトを切り替える">
        <Row>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={site}
            onChange={(_, v: Site | null) => v && setSite(v)}
          >
            <ToggleButton value="real">正規 {RP_ID}</ToggleButton>
            <ToggleButton value="fake">偽サイト {FAKE_RP_ID}</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setChal(randomBytes(16))}
          >
            ログインをやり直す (新 challenge)
          </Button>
        </Row>
        {ctx && (
          <VerdictBox
            verdict={{
              text: `認証器が署名した対象 = SHA-256("${rpIdOf(ctx.site)}") ‖ challenge\nサーバーが期待する対象 = SHA-256("${RP_ID}") ‖ challenge\nECDSA P-256 検証 → ${ctx.isVerified ? '成功' : '失敗'}`,
              isSafe: ctx.isVerified,
            }}
          />
        )}
      </Card>
      {ctx && <SequenceView scenario={pkScenario} ctx={ctx} />}
      <Card title="攻撃してみる">
        <Row>
          <Button variant="outlined" onClick={attackDb}>
            サーバー DB が漏洩 → 署名を偽造
          </Button>
          <Button variant="outlined" onClick={attackReplay}>
            盗聴した署名を使い回す (リプレイ)
          </Button>
        </Row>
        <VerdictBox verdict={attack} />
      </Card>
    </section>
  )
}
