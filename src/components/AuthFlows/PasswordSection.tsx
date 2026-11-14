import { Button, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  COMMON_PASSWORDS,
  passwordHash,
  randomBytes,
  short,
  toHex,
  type Bytes,
} from './crypto'
import { Card, Mono, Row, SectionHead, type Verdict, VerdictBox } from './parts'
import type { Item, Scenario } from './scenario'
import { SequenceView } from './SequenceView'

export type PwCtx = {
  pw: string
  loginPw: string
  salt: Bytes
  hash: string
  loginHash: string
  isMatch: boolean
}

const RECV = '受信したパスワード (メモリ上)'

export const pwScenario: Scenario<PwCtx> = {
  actors: ['ユーザー', 'ブラウザ', 'サーバー'],
  vaults: [
    { key: 'user', title: 'ユーザーの頭の中' },
    { key: 'browser', title: 'ブラウザ' },
    { key: 'wire', title: '通信路 (偽サイトなら全部見える)', isWire: true },
    { key: 'server', title: 'サーバー / DB' },
  ],
  steps: [
    {
      phase: '登録',
      msg: [1, 2],
      label: 'パスワードを決めて入力',
      title: 'ユーザーが決める',
      desc: 'パスワードはユーザーの記憶が正本。ここから先、同じ文字列を毎回ネットに流すことになる。',
      add: (c) => ({
        user: [{ k: 'パスワード', v: c.pw, secret: true }],
        browser: [{ k: '入力欄', v: c.pw, secret: true }],
      }),
    },
    {
      msg: [2, 3],
      kind: 'secret',
      label: 'ID + パスワード (TLS)',
      title: 'パスワードがそのまま送られる',
      desc: 'TLS (https) で暗号化されるので途中の盗聴は防げる。しかし受け取った相手 (本物でも偽サイトでも) には平文で届く。',
      add: (c) => ({
        wire: [
          { k: 'ID', v: 'alice' },
          { k: 'パスワード', v: c.pw, secret: true },
        ],
        server: [{ k: RECV, v: c.pw, secret: true }],
      }),
      rm: { browser: ['入力欄'] },
    },
    {
      note: 3,
      label: 'salt 生成 → hash(salt + pw) を保存',
      title: 'ハッシュだけ保存して平文は捨てる',
      desc: (c) => (
        <>
          ランダムな salt を足してからハッシュ化する。salt
          があると同じパスワードでも人ごとに違う値になり、事前計算表
          (レインボーテーブル) が効かない。
          <br />
          hash = SHA-256(salt ‖ &quot;{c.pw}&quot;) ={' '}
          <Mono>{short(c.hash, 24)}</Mono>
        </>
      ),
      add: (c) => ({
        server: [
          { k: 'salt', v: toHex(c.salt) },
          { k: 'hash', v: c.hash },
        ],
      }),
      rm: { server: [RECV] },
    },
    {
      phase: 'ログイン',
      msg: [1, 2],
      label: 'パスワードを入力',
      title: '思い出して入力',
      desc: '以降のログインでは毎回このパスワードを入力する。',
      add: (c) => ({ browser: [{ k: '入力欄', v: c.loginPw, secret: true }] }),
    },
    {
      msg: [2, 3],
      kind: 'secret',
      label: 'ID + パスワード (TLS)',
      title: 'また平文で送る',
      desc: 'ログインのたびにパスワードそのものが相手に届く。ここが最大の弱点 (フィッシングで盗まれる)。',
      add: (c) => ({
        wire: [{ k: 'ログイン時のパスワード', v: c.loginPw, secret: true }],
        server: [{ k: RECV, v: c.loginPw, secret: true }],
      }),
      rm: { browser: ['入力欄'] },
    },
    {
      note: 3,
      label: '保存済み salt で再計算 → 比較',
      title: '同じ計算をして一致を見る',
      desc: (c) => (
        <>
          DB の salt で hash を作り直し、保存済み hash と比べる。
          <br />
          再計算 = <Mono>{short(c.loginHash, 24)}</Mono> / 保存済み ={' '}
          <Mono>{short(c.hash, 24)}</Mono> →{' '}
          <b>{c.isMatch ? '一致' : '不一致'}</b>
        </>
      ),
      add: (c) => ({
        server: [
          { k: '再計算した hash', v: c.loginHash },
          { k: '判定', v: c.isMatch ? '一致 → 本人' : '不一致 → 拒否' },
        ],
      }),
      rm: { server: [RECV] },
    },
    {
      msg: [3, 2],
      kind: (c) => (c.isMatch ? 'ok' : 'secret'),
      label: (c) => (c.isMatch ? 'セッション Cookie' : 'ログイン失敗'),
      title: '結果を返す',
      desc: (c) =>
        c.isMatch
          ? '以後はこの Cookie が「ログイン済み」の証明になる。'
          : 'パスワードが違うので Cookie は発行されない。上の「ログイン入力」を直して見比べてみてください。',
      add: (c): Partial<Record<string, Item[]>> =>
        c.isMatch
          ? {
              browser: [
                { k: 'セッション Cookie', v: 'sid=8f3a…', secret: true },
              ],
              server: [{ k: 'セッション', v: 'sid=8f3a… → alice' }],
            }
          : {},
      rm: { server: ['再計算した hash'] },
    },
  ],
}

/** 辞書のどれかが salt + hash に一致すればそれを返す */
export const crackPassword = async (salt: Bytes, hash: string) => {
  const hits = await Promise.all(
    COMMON_PASSWORDS.map(async (w) =>
      (await passwordHash(salt, w)) === hash ? w : null
    )
  )
  return hits.find((w) => w !== null) ?? null
}

const INITIAL_VERDICT: Verdict = {
  text: 'ボタンを押すと、攻撃者が手に入れたものと結果を表示します。登録パスワードを長いランダム文字列に変えて再挑戦してみてください。',
}

export const PasswordSection = () => {
  const [pw, setPw] = useState('hunter2')
  const [loginPw, setLoginPw] = useState('hunter2')
  const [salt, setSalt] = useState(() => randomBytes(16))
  const [ctx, setCtx] = useState<PwCtx | null>(null)
  const [verdict, setVerdict] = useState<Verdict>(INITIAL_VERDICT)

  useEffect(() => {
    let isActive = true
    Promise.all([passwordHash(salt, pw), passwordHash(salt, loginPw)]).then(
      ([hash, loginHash]) => {
        if (isActive)
          setCtx({
            pw,
            loginPw,
            salt,
            hash,
            loginHash,
            isMatch: hash === loginHash,
          })
      }
    )
    return () => {
      isActive = false
    }
  }, [pw, loginPw, salt])

  const attackDb = async () => {
    if (!ctx) return
    const found = await crackPassword(ctx.salt, ctx.hash)
    const head = `攻撃者が得たもの: salt=${short(toHex(ctx.salt))} / hash=${short(ctx.hash)}\nよく使われるパスワード ${COMMON_PASSWORDS.length} 個で SHA-256(salt ‖ 候補) を総当たり…\n`
    setVerdict(
      found
        ? {
            text: `${head}解読成功: "${found}"\nSHA-256 は速すぎて GPU なら毎秒数十億回試せる。実サービスは Argon2id / bcrypt で 1 回の計算を意図的に遅くする。`,
            isSafe: false,
          }
        : {
            text: `${head}この辞書では解読できず。\nただし辞書を数億語に増やせば短いパスワードは時間の問題。長くランダム + 遅いハッシュが必要。`,
            isSafe: true,
          }
    )
  }

  return (
    <section>
      <SectionHead
        no="02"
        title="パスワード認証"
        note="登録時にサーバーは「パスワードから作ったハッシュ」だけを保存し、ログイン時に同じ計算をして一致を確かめる。"
      />
      <Card title="演習: 値を変えるとシーケンス・保持情報が追従します">
        <Row>
          <TextField
            size="small"
            label="登録パスワード"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <TextField
            size="small"
            label="ログイン入力"
            value={loginPw}
            onChange={(e) => setLoginPw(e.target.value)}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setSalt(randomBytes(16))}
          >
            salt 再生成
          </Button>
        </Row>
        {ctx && (
          <VerdictBox
            verdict={{
              text: `salt = ${toHex(ctx.salt)}\n保存される hash  = ${ctx.hash}\nログイン時 hash = ${ctx.loginHash}\n→ ${ctx.isMatch ? '一致' : '不一致'}`,
              isSafe: ctx.isMatch,
            }}
          />
        )}
      </Card>
      {ctx && <SequenceView scenario={pwScenario} ctx={ctx} />}
      <Card title="攻撃してみる">
        <Row>
          <Button variant="outlined" onClick={attackDb}>
            サーバー DB が漏洩 → 辞書攻撃
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              setVerdict({
                text: `偽サイトは STEP 5 の通信をそのまま受け取る側になる。\n攻撃者が得たもの: パスワード "${loginPw}" (平文)\n→ 本物のサイトでそのままログインできる。使い回していれば他サイトも。`,
                isSafe: false,
              })
            }
          >
            偽サイトに入力してしまった
          </Button>
        </Row>
        <VerdictBox verdict={verdict} />
      </Card>
    </section>
  )
}
