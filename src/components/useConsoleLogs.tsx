import { useEffect, useState } from 'react'

export const useConsoleLog = () => {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const originalConsoleLog = console.log

    console.log = (...args) => {
      originalConsoleLog(...args)
      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, ...args.map((arg) => arg.toString())]

        return updatedLogs
      })
    }

    return () => {
      console.log = originalConsoleLog
    }
  }, [])

  return { logs, recentLogs: logs.slice(-30) }
}
