const isBrowser = typeof window !== 'undefined'

export const readClipboard = async (): Promise<string> => {
  if (isBrowser) {
    return navigator.clipboard?.readText().catch(() => '') ?? ''
  }
  const clipboardy = await import('clipboardy')
  return clipboardy.default.read()
}

export const writeClipboard = async (text: string): Promise<void> => {
  if (isBrowser) {
    await navigator.clipboard?.writeText(text).catch(() => {})
    return
  }
  const clipboardy = await import('clipboardy')
  return clipboardy.default.write(text)
}
