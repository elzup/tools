import React, { createContext, useContext, useEffect, useState } from 'react'

type Config = {
  version: number
  showList: boolean
  showName: boolean
  mode: 'a' | 'b'
}

const defaultConfig: Config = {
  version: 3,
  showList: true,
  showName: false,
  mode: 'a',
} as const

const ConfigContext = createContext<[Config, (config: Config) => void]>([
  defaultConfig,
  () => {},
])

const migrate = (config: Config) => {
  return { ...defaultConfig, ...config, version: defaultConfig.version }
}

export const ConfigProvider: React.FC = ({ children }) => {
  const [config, setConfig] = useState<Config>(defaultConfig)

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
    (v: Config[Key]) => setConfig({ ...config, [key]: v }),
  ] as const
}

// export const useShowList = () => useSomeConfig('showList')
// export const useMode = () => useSomeConfig('mode')
