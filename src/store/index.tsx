import { createContext, useContext, useEffect, useState } from 'react'
import { WithChild } from '../types'

type Config = {
  version: number
  showList: boolean
  showName: boolean
  mode: 'a' | 'b'
  showDict: boolean
}

const defaultConfig: Config = {
  version: 3,
  showList: true,
  showName: false,
  mode: 'a',
  showDict: true,
} as const

const noop = () => {}
const ConfigContext = createContext<[Config, (config: Config) => void]>([
  defaultConfig,
  noop,
])

const migrate = (config: Config) => {
  return { ...defaultConfig, ...config, version: defaultConfig.version }
}

export const ConfigProvider = ({ children }: WithChild) => {
  const [config, setConfig] = useState<Config>(defaultConfig)

  console.log(config)

  useEffect(() => {
    if (config.version === defaultConfig.version) return
    setConfig(migrate(config))
  }, [config, setConfig])

  return (
    <ConfigContext.Provider value={[config, setConfig]}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => useContext(ConfigContext)

export const useSomeConfig = <Key extends keyof Config>(key: Key) => {
  const [config, setConfig] = useConfig()

  return [
    config[key],
    (v: Config[Key]) => {
      console.log({ v, config, key })
      setConfig({ ...config, [key]: v })
    },
  ] as const
}

// export const useShowList = () => useSomeConfig('showList')
export const useShowDict = () => {
  const [showDict, setShowDict] = useSomeConfig('showDict')

  return { showDict, setShowDict, toggleShowDict: () => setShowDict(!showDict) }
}
