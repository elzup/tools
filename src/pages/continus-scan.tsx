import React, { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Html5QrcodeScannerConfig } from 'html5-qrcode/esm/html5-qrcode-scanner'

const qrcodeRegionId = 'html5qr-code-full-region'

// Creates the configuration object for Html5QrcodeScanner.

type Props = {
  fps?: number
  qrbox?: number
  aspectRatio?: number
  disableFlip?: boolean
  config?: Html5QrcodeScannerConfig
  verbose: boolean
  qrCodeSuccessCallback: (decodedText: string) => void
  qrCodeErrorCallback?: (errorMessage: string) => void
}

const Html5QrcodePlugin = (
  props: // fps =
  Props
) => {
  useEffect(() => {
    // when component mounts
    const verbose = props.verbose === true
    // Suceess callback is required.

    if (!props.qrCodeSuccessCallback) {
      throw 'qrCodeSuccessCallback is required callback.'
    }
    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      config: props.config,
      verbose
    )

    html5QrcodeScanner.render(
      props.qrCodeSuccessCallback,
      props.qrCodeErrorCallback
    )

    // cleanup function when component will unmount
    return () => {
      html5QrcodeScanner.clear().catch((error) => {
        console.error('Failed to clear html5QrcodeScanner. ', error)
      })
    }
  }, [])

  return <div id={qrcodeRegionId} />
}

export default Html5QrcodePlugin
