import { Button, LinearProgress, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  type Hotp,
  TOTP_DIGITS,
  TOTP_STEP_SEC,
  base32,
  randomBytes,
  short,
  totpCounter,
  totpWindow,
  type Bytes,
} from './crypto'
import { Card, Mono, Row, SectionHead, type Verdict, VerdictBox } from './parts'
import type { Scenario } from './scenario'
import { SequenceView } from './SequenceView'

export type OtpCtx = { secret: Bytes; cur: Hotp; window: Hotp[] }

export const otpScenario: Scenario<OtpCtx> = {
  actors: ['ユーザー', '認証アプリ', 'ブラウザ', 'サーバー'],
  vaults: [
    { key: 'user', title: 'ユーザーの頭の中' },
    { key: 'app', title: '認証アプリ (スマホ)' },
    { key: 'browser', title: 'ブラウザ' },
    { key: 'wire', title: '通信路 (偽サイトなら全部見える)', isWire: true },
    { key: 'server', title: 'サーバー / DB' },
  ],
  steps: [
    {
      phase: '設定 (パスワードでログイン済み)',
      note: 4,
      label: '共有秘密を生成',
      title: 'サーバーが乱数の秘密を作る',
      desc: (c) => (
        <>
          20 バイトの乱数。これが TOTP
          の唯一の秘密。サーバーは後でコードを検証するために、この秘密を
          <b>読める形で</b>保存しておく必要がある。
          <br />
          secret (Base32) = <Mono>{base32(c.secret)}</Mono>
        </>
      ),
      add: (c) => ({
        user: [{ k: 'パスワード', secret: true }],
        server: [
          { k: 'パスワード hash' },
          { k: '共有秘密', v: base32(c.secret), secret: true },
        ],
      }),
    },
    {
      msg: [4, 3],
      kind: 'secret',
      label: 'QR コード (otpauth://…?secret=…)',
      title: '秘密を QR で見せる',
      desc: (
        <>
          QR の中身は{' '}
          <Mono>
            otpauth://totp/Example:alice?secret=…&amp;period=30&amp;digits=6
          </Mono>
          。秘密が通信路を流れるのはこの 1 回だけ。
        </>
      ),
      add: (c) => ({
        wire: [{ k: '共有秘密 (QR)', v: base32(c.secret), secret: true }],
        browser: [{ k: 'QR 表示中', v: base32(c.secret), secret: true }],
      }),
    },
    {
      msg: [3, 2],
      kind: 'local',
      label: 'カメラで QR を読む (オフライン)',
      title: 'アプリに秘密をコピー',
      desc: 'スマホのカメラで読むだけなのでネットは通らない。これでサーバーとアプリが同じ秘密を持った。',
      add: (c) => ({
        app: [{ k: '共有秘密', v: base32(c.secret), secret: true }],
      }),
      rm: { browser: ['QR 表示中'] },
    },
    {
      phase: 'ログイン',
      msg: [3, 4],
      kind: 'secret',
      label: 'ID + パスワード',
      title: '1 段階目: パスワード',
      desc: '02 と同じ。ここで盗まれてもまだログインはできない。',
      add: {
        wire: [{ k: 'パスワード', secret: true }],
        server: [{ k: '1 段階目', v: 'パスワード一致' }],
      },
    },
    {
      msg: [4, 3],
      label: '「6 桁コードを入力」',
      title: '2 段階目を要求',
      desc: 'サーバーは「その秘密を持つ端末を今手元に持っているか」を確かめにくる。',
    },
    {
      note: 2,
      label: (c) => `T = ⌊時刻/30⌋ → HMAC-SHA1(秘密, T) → ${c.cur.code}`,
      title: 'アプリがコードを計算',
      desc: (c) => (
        <>
          アプリは<b>通信せず</b>、秘密と現在時刻だけで計算する。
          <br />T = {c.cur.counter} / HMAC ={' '}
          <Mono>{short(c.cur.macHex, 20)}</Mono> / offset = {c.cur.offset} →{' '}
          <b>{c.cur.code}</b> (「計算過程」を開くと全桁)
        </>
      ),
      add: (c) => ({
        app: [
          { k: '時刻カウンタ T', v: String(c.cur.counter) },
          { k: '今のコード', v: c.cur.code },
        ],
      }),
    },
    {
      msg: [2, 1],
      kind: 'local',
      label: (c) => `画面に ${c.cur.code} を表示`,
      title: 'ユーザーが目で見る',
      desc: 'ユーザーが運び役になる。コードは 30 秒で変わる。',
      add: (c) => ({ user: [{ k: '見たコード', v: c.cur.code }] }),
    },
    {
      msg: [1, 3],
      label: 'コードを入力',
      title: 'ブラウザに打ち込む',
      desc: '人の手でブラウザへ写す。',
      add: (c) => ({ browser: [{ k: '入力欄', v: c.cur.code }] }),
    },
    {
      msg: [3, 4],
      kind: 'secret',
      label: (c) => `コード ${c.cur.code}`,
      title: 'コードを送信',
      desc: '流れるのは 6 桁だけ。秘密そのものは流れない。ただし 30 秒以内ならこのコードは誰が使っても有効。',
      add: (c) => ({
        wire: [{ k: 'コード (30 秒有効)', v: c.cur.code, secret: true }],
      }),
      rm: { browser: ['入力欄'] },
    },
    {
      note: 4,
      label: '同じ秘密 + 時刻で計算 (前後 1 枠) → 比較',
      title: 'サーバーも同じ計算',
      desc: (c) => (
        <>
          サーバーは保存した秘密で T-1, T, T+1
          のコードを作り、届いた値と比べる。候補:{' '}
          {c.window.map((w) => (
            <Mono key={w.counter}>{w.code} </Mono>
          ))}
        </>
      ),
      add: (c) => ({
        server: [
          { k: '計算した候補', v: c.window.map((w) => w.code).join(' / ') },
          { k: '判定', v: '一致 → 本人' },
        ],
      }),
    },
    {
      msg: [4, 3],
      kind: 'ok',
      label: 'セッション Cookie',
      title: 'ログイン完了',
      desc: '使ったコードは再利用されないよう記録しておくのが望ましい。',
      add: { browser: [{ k: 'セッション Cookie', secret: true }] },
      rm: { server: ['計算した候補', '判定'] },
    },
  ],
}

export const calcLines = (c: Hotp, nowSec: number) => {
  const mac = c.macHex.match(/../g) ?? []
  return [
    `T        = floor(${nowSec} / ${TOTP_STEP_SEC}) = ${c.counter}`,
    `HMAC     = HMAC-SHA1(secret, T を 8 バイト) = ${c.macHex}`,
    `offset   = 最後のバイト 0x${mac[mac.length - 1]} の下位 4 bit = ${c.offset}`,
    `4 bytes  = HMAC[${c.offset}..${c.offset + 3}] = ${mac.slice(c.offset, c.offset + 4).join(' ')} → 先頭 bit を落として ${c.bin}`,
    `code     = ${c.bin} mod 10^${TOTP_DIGITS} = ${c.code}`,
  ].join('\n')
}

/** 表示の残り秒数を滑らかにするための更新間隔。コード自体は 30 秒枠が変わったときだけ再計算する */
const TICK_MS = 1000

const useNow = () => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [])
  return now
}

export const OtpSection = () => {
  const now = useNow()
  const counter = totpCounter(now)
  const [secret, setSecret] = useState(() => randomBytes(20))
  const [ctx, setCtx] = useState<OtpCtx | null>(null)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Verdict>({
    text: 'サーバーは「前・今・次」の 30 秒枠のコードを計算して照合します (時計のズレ対策)。',
  })
  const [attack, setAttack] = useState<Verdict>({
    text: 'ボタンを押して結果を確認。',
  })

  useEffect(() => {
    let isActive = true
    totpWindow(secret, counter).then((window) => {
      if (isActive) setCtx({ secret, cur: window[1], window })
    })
    return () => {
      isActive = false
    }
  }, [secret, counter])

  const left = TOTP_STEP_SEC - (Math.floor(now / 1000) % TOTP_STEP_SEC)

  const send = () => {
    if (!ctx) return
    const hit = ctx.window.findIndex((w) => w.code === input.trim())
    setResult(
      hit === -1
        ? {
            text: `"${input}" は 前/今/次 のどれとも一致しない → 拒否`,
            isSafe: false,
          }
        : {
            text: `一致 (${['1 つ前', '今', '1 つ先'][hit]}の枠) → ログイン成功`,
            isSafe: true,
          }
    )
  }

  return (
    <section>
      <SectionHead
        no="03"
        title="2段階認証 (ワンタイムパスワード / TOTP)"
        note="設定時に共有秘密を QR コードで認証アプリへ渡す。以後はアプリとサーバーが「秘密 + 現在時刻」から同じ 6 桁を別々に計算し、一致を見る (RFC 6238)。"
      />
      {ctx && (
        <>
          <Card title="認証アプリの画面 (この演習用の秘密で計算中)">
            <Typography
              sx={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: '.12em',
                fontVariantNumeric: 'tabular-nums',
              }}
              color="primary"
            >
              {ctx.cur.code}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(left / TOTP_STEP_SEC) * 100}
            />
            <Typography variant="caption" color="text.secondary">
              あと {left} 秒で次のコード ／ 共有秘密{' '}
              <Mono>{base32(ctx.secret)}</Mono>
            </Typography>
            <Row>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSecret(randomBytes(20))}
              >
                秘密を作り直す (再設定)
              </Button>
            </Row>
            <details>
              <summary>6 桁ができるまでの計算過程</summary>
              <pre
                style={{
                  fontSize: 11,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {calcLines(ctx.cur, Math.floor(now / 1000))}
              </pre>
            </details>
          </Card>
          <Card title="演習: コードを入力してサーバーに送る">
            <Row>
              <TextField
                size="small"
                label="6 桁コード"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputProps={{ inputMode: 'numeric', maxLength: TOTP_DIGITS }}
              />
              <Button variant="contained" onClick={send}>
                送信
              </Button>
            </Row>
            <VerdictBox verdict={result} />
          </Card>
          <SequenceView scenario={otpScenario} ctx={ctx} />
          <Card title="攻撃してみる">
            <Row>
              <Button
                variant="outlined"
                onClick={() =>
                  setAttack({
                    text: '攻撃者が得たもの: パスワードだけ\n→ STEP 4 は通るが、STEP 9 で送るコードを作れない (秘密を持っていない)。ログイン失敗。',
                    isSafe: true,
                  })
                }
              >
                パスワードだけ漏洩
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setAttack({
                    text: `偽サイトが STEP 4 のパスワードと STEP 9 のコード "${ctx.cur.code}" を受け取り、即座に本物へ送る。\n→ コードはまだ有効なのでログイン成功。TOTP は「秘密を流さない」が「サイトを区別しない」。`,
                    isSafe: false,
                  })
                }
              >
                偽サイトがリアルタイム中継
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setAttack({
                    text: `攻撃者が得たもの: パスワード hash + 共有秘密 ${short(base32(ctx.secret))}\n→ 秘密があれば今のコード ${ctx.cur.code} を自分で計算できる。パスワードさえ解読できれば突破。\nサーバーは秘密を暗号化して保管するが、検証に使う以上どこかで復号できる。`,
                    isSafe: false,
                  })
                }
              >
                サーバー DB が漏洩
              </Button>
            </Row>
            <VerdictBox verdict={attack} />
          </Card>
        </>
      )}
    </section>
  )
}
