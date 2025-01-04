import React, { useState } from 'react'

export default function TabOneScreen() {
  const [recognizedText, setRecognizedText] = useState<string>('')
  const [images, setImages] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState<boolean>(false)

  // Google Custom Search APIの設定
  const urlParams = new URLSearchParams(window.location.search)
  const API_KEY = urlParams.get('apiKey') || '' // `?apiKey=YOUR_API_KEY` を指定
  const CX = urlParams.get('cx') || '' // `?cx=YOUR_CX` を指定

  // 音声認識APIの初期化（ブラウザ専用）
  // @ts-ignore
  // eslint-disable-next-line no-undef
  let recognition: SpeechRecognition | null = null

  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    // @ts-ignore
    const SpeechRecognition =
      // @ts-ignore
      window.SpeechRecognition || (window as unknown).webkitSpeechRecognition

    recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP' // 日本語対応
    recognition.interimResults = true // 中間結果を表示
    recognition.continuous = true // 継続的に認識
  }

  // 固有名詞の検出（簡易的な方法）
  const detectProperNouns = (text: string): string[] => {
    const words = text.split(' ')
    const properNouns = words.filter(
      (word) => word.charAt(0).toUpperCase() === word.charAt(0)
    )

    return properNouns
  }

  // 画像検索APIの呼び出し
  const fetchImages = async (query: string) => {
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&searchType=image&q=${encodeURIComponent(
      query
    )}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.items) {
      // @ts-ignore
      setImages(data.items.map((item: unknown) => item.link))
    }
  }

  // 録音の開始
  const startRecognition = () => {
    if (!recognition) {
      alert('この機能はブラウザでのみ動作します。')
      return
    }

    recognition.start()
    setIsRecording(true)

    // @ts-ignore
    // eslint-disable-next-line no-undef
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1]

      const transcript = lastResult[0].transcript

      setRecognizedText(transcript)

      // 固有名詞を検出して画像検索
      const properNouns = detectProperNouns(transcript)

      if (properNouns.length > 0) {
        fetchImages(properNouns[0]) // 最初の固有名詞を使用
      }
    }

    // @ts-ignore
    // eslint-disable-next-line no-undef
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('音声認識エラー:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }
  }

  // 録音の停止
  const stopRecognition = () => {
    if (recognition) {
      recognition.stop()
    }
    setIsRecording(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      <h1>speecher prototype</h1>
      <button
        onClick={isRecording ? stopRecognition : startRecognition}
        style={{ marginBottom: '16px' }}
      >
        {isRecording ? '停止' : '開始'}
      </button>
      <h2>認識結果:</h2>
      <p>{recognizedText || 'ここに認識結果が表示されます'}</p>
      <h2>画像検索結果:</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt="検索結果"
            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
          />
        ))}
      </div>
    </div>
  )
}
