import { useEffect, useState } from 'react'

type ISpeechRecognitionEvent = {
  isTrusted?: boolean
  results: {
    isFinal: boolean
    // eslint-disable-next-line @typescript-eslint/member-ordering
    [key: number]:
      | undefined
      | {
          transcript: string
        }
  }[]
}

type ISpeechRecognition = {
  // properties
  grammars: string
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  serviceURI: string

  // event handlers
  onaudiostart: () => void
  onaudioend: () => void
  onend: () => void
  onerror: () => void
  onnomatch: () => void
  onresult: (event: ISpeechRecognitionEvent) => void
  onsoundstart: () => void
  onsoundend: () => void
  onspeechstart: () => void
  onspeechend: () => void
  onstart: () => void

  // methods
  abort(): void
  start(): void
  stop(): void
} & EventTarget

// ISpeechRecognitionConstructorはコンストラクト可能でコンストラクトするとISpeechRecognitionの型定義を持つ
type ISpeechRecognitionConstructor = new () => ISpeechRecognition

//windowにISpeechRecognitionConstructorを定義にもつSpeechRecognitionとwebkitSpeechRecognitionを追加
type IWindow = {
  SpeechRecognition: ISpeechRecognitionConstructor
  webkitSpeechRecognition: ISpeechRecognitionConstructor
} & Window
declare const window: IWindow

export const useSpeechRecognition = () => {
  const [recognition] = useState<ISpeechRecognition | null>(() => {
    if (
      typeof window === 'undefined' ||
      !('webkitSpeechRecognition' in window)
    ) {
      console.warn('Speech Recognition is not supported in this browser.')
      return null
    }
    // クライアントサイドでのみ実行
    const recognition: ISpeechRecognition =
      // eslint-disable-next-line new-cap
      new window.webkitSpeechRecognition()

    recognition.lang = 'ja-JP' // 日本語対応
    recognition.interimResults = true // 中間結果を表示
    recognition.continuous = true // 継続的に認識
    return recognition
  })

  return recognition
}
