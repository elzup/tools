import { extractFeaturesFromText } from './codeFeatures'
import { convertFeaturesToMagicLayer } from './makeMagironicLayer'

export const useMagironic = (text: string) => {
  // useMemo(() => {}, [text])
  const features = extractFeaturesFromText(text)
  const magicLayer = convertFeaturesToMagicLayer(features)

  return magicLayer
}
