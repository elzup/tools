// 演習で使う暗号計算。すべて Web Crypto (ブラウザ / Node 共通) で実際に計算する

const enc = new TextEncoder()

// Web Crypto は SharedArrayBuffer 由来を受け付けないので ArrayBuffer 版に固定する (TS 5.7+ の型)
export type Bytes = Uint8Array<ArrayBuffer>

export const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export const short = (hex: string, n = 16) =>
  hex.length > n ? `${hex.slice(0, n)}…` : hex

export const randomBytes = (n: number) =>
  crypto.getRandomValues(new Uint8Array(n))

export const concatBytes = (...arrs: Uint8Array[]) =>
  Uint8Array.from(arrs.flatMap((a) => [...a]))

export const sha256 = async (bytes: Bytes) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export const base32 = (bytes: Bytes) =>
  (
    [...bytes]
      .map((b) => b.toString(2).padStart(8, '0'))
      .join('')
      .match(/.{1,5}/g) ?? []
  )
    .map((c) => B32[Number.parseInt(c.padEnd(5, '0'), 2)])
    .join('')

/* ---------- password ---------- */

// 教育用に SHA-256 を使う。実サービスは Argon2id / bcrypt で 1 回の計算を意図的に遅くする
export const passwordHash = async (salt: Bytes, pw: string) =>
  toHex(await sha256(concatBytes(salt, enc.encode(pw))))

/* ---------- TOTP (RFC 6238 / RFC 4226) ---------- */

// RFC 6238 の既定値。Google Authenticator 等もこの 30 秒 / 6 桁を前提にしている
export const TOTP_STEP_SEC = 30
export const TOTP_DIGITS = 6

export type Hotp = {
  counter: number
  macHex: string
  offset: number
  bin: number
  code: string
}

const counterBytes = (counter: number) =>
  Uint8Array.from({ length: 8 }, (_, i) =>
    Number((BigInt(counter) >> BigInt(8 * (7 - i))) & 0xffn)
  )

export const hotp = async (secret: Bytes, counter: number): Promise<Hotp> => {
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, counterBytes(counter))
  )
  const offset = mac[mac.length - 1] & 0x0f
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3]
  const code = String(bin % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0')
  return { counter, macHex: toHex(mac), offset, bin, code }
}

export const totpCounter = (ms: number) => Math.floor(ms / 1000 / TOTP_STEP_SEC)

// 時計のズレ対策でサーバーは前後 1 枠も受け入れる
export const totpWindow = (secret: Bytes, counter: number) =>
  Promise.all([counter - 1, counter, counter + 1].map((n) => hotp(secret, n)))

/* ---------- passkey (WebAuthn を簡略化) ---------- */

export const RP_ID = 'example.com'
export const FAKE_RP_ID = 'examp1e.com'

const ECDSA_KEY = { name: 'ECDSA', namedCurve: 'P-256' }
const ECDSA_SIGN = { name: 'ECDSA', hash: 'SHA-256' }

// 秘密鍵は extractable: false。端末の安全領域から取り出せないことを模している
export const generatePasskey = () =>
  crypto.subtle.generateKey(ECDSA_KEY, false, ['sign', 'verify'])

export const publicKeyX = async (key: CryptoKey) =>
  (await crypto.subtle.exportKey('jwk', key)).x ?? ''

// WebAuthn の authenticatorData 先頭は SHA-256(rpId)。署名対象を rpIdHash ‖ challenge に簡略化している
export const signedData = async (rpId: string, challenge: Bytes) =>
  concatBytes(await sha256(enc.encode(rpId)), challenge)

export const signChallenge = async (
  key: CryptoKey,
  rpId: string,
  challenge: Bytes
) =>
  new Uint8Array(
    await crypto.subtle.sign(ECDSA_SIGN, key, await signedData(rpId, challenge))
  )

// サーバーは常に自分の rpId で検証する。別ドメインで作られた署名はここで落ちる
export const verifyChallenge = async (
  key: CryptoKey,
  sig: Bytes,
  challenge: Bytes
) =>
  crypto.subtle.verify(ECDSA_SIGN, key, sig, await signedData(RP_ID, challenge))

export const COMMON_PASSWORDS = [
  '123456',
  'password',
  '12345678',
  'qwerty',
  '111111',
  'abc123',
  'password1',
  'iloveyou',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'sunshine',
  'qwerty123',
  '1q2w3e4r',
  '000000',
  'baseball',
  'football',
  'master',
  'shadow',
  'superman',
  'pokemon',
  'abcd1234',
  'p@ssw0rd',
  'test1234',
  'hello123',
  'hunter2',
  'tokyo2020',
  'sakura',
]
