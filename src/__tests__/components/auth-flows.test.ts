import {
  FAKE_RP_ID,
  RP_ID,
  base32,
  generatePasskey,
  hotp,
  passwordHash,
  randomBytes,
  signChallenge,
  verifyChallenge,
} from '../../components/AuthFlows/crypto'
import {
  crackPassword,
  pwScenario,
} from '../../components/AuthFlows/PasswordSection'
import { stateAt } from '../../components/AuthFlows/scenario'

const enc = new TextEncoder()

describe('crypto', () => {
  // RFC 4226 Appendix D のテストベクタ
  test('HOTP は RFC 4226 の値と一致する', async () => {
    const secret = enc.encode('12345678901234567890')
    const codes = await Promise.all(
      [0, 1, 9].map(async (n) => (await hotp(secret, n)).code)
    )
    expect(codes).toEqual(['755224', '287082', '520489'])
  })

  test('base32 は RFC 4648 の値と一致する (パディング無し)', () => {
    expect(base32(enc.encode('foobar'))).toBe('MZXW6YTBOI')
  })

  test('辞書にあるパスワードは salt があっても解ける', async () => {
    const salt = randomBytes(16)
    expect(await crackPassword(salt, await passwordHash(salt, 'hunter2'))).toBe(
      'hunter2'
    )
    expect(
      await crackPassword(salt, await passwordHash(salt, 'x9$Lq!2v#Rt8'))
    ).toBeNull()
  })

  test('パスキーの署名は正規 rpId なら通り、偽 rpId とリプレイは落ちる', async () => {
    const keys = await generatePasskey()
    const chal = randomBytes(16)
    const real = await signChallenge(keys.privateKey, RP_ID, chal)
    const fake = await signChallenge(keys.privateKey, FAKE_RP_ID, chal)
    expect(await verifyChallenge(keys.publicKey, real, chal)).toBe(true)
    expect(await verifyChallenge(keys.publicKey, fake, chal)).toBe(false)
    expect(await verifyChallenge(keys.publicKey, real, randomBytes(16))).toBe(
      false
    )
  })
})

describe('stateAt', () => {
  const salt = Uint8Array.from([1, 2, 3])
  const ctx = {
    pw: 'pw',
    loginPw: 'pw',
    salt,
    hash: 'h',
    loginHash: 'h',
    isMatch: true,
  }
  const keys = (idx: number, vault: string) =>
    stateAt(pwScenario, idx, ctx)[vault].map((it) => it.k)

  test('サーバーは受け取ったパスワードを hash 化した step で捨てる', () => {
    expect(keys(1, 'server')).toEqual(['受信したパスワード (メモリ上)'])
    const atHash = stateAt(pwScenario, 2, ctx).server
    expect(
      atHash.find((it) => it.k === '受信したパスワード (メモリ上)')?.isGone
    ).toBe(true)
    expect(keys(3, 'server')).toEqual(['salt', 'hash'])
  })

  test('その step で増えたものだけ isNew になる', () => {
    const server = stateAt(pwScenario, 2, ctx).server
    expect(server.filter((it) => it.isNew).map((it) => it.k)).toEqual([
      'salt',
      'hash',
    ])
    expect(stateAt(pwScenario, 3, ctx).server.some((it) => it.isNew)).toBe(
      false
    )
  })

  test('不一致ならセッションは発行されない', () => {
    const last = pwScenario.steps.length - 1
    const ng = stateAt(pwScenario, last, {
      ...ctx,
      loginHash: 'x',
      isMatch: false,
    })
    expect(ng.browser.map((it) => it.k)).not.toContain('セッション Cookie')
    expect(keys(last, 'browser')).toContain('セッション Cookie')
  })
})
