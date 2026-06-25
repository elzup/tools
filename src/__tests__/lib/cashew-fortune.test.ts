import {
  classifyCashewSide,
  getCashewOutcome,
  simulateCashewTrials,
} from '../../lib/cashew-fortune'

const createRandom = (seed: number) => {
  let state = seed

  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

describe('cashew-fortune', () => {
  it('classifies sides by the final angle', () => {
    expect(classifyCashewSide(0)).toBe('innerUp')
    expect(classifyCashewSide(Math.PI)).toBe('innerDown')
    expect(classifyCashewSide(Math.PI * 2)).toBe('innerUp')
  })

  it('classifies pair outcomes', () => {
    expect(getCashewOutcome('innerUp', 'innerUp')).toBe('bothInnerUp')
    expect(getCashewOutcome('innerDown', 'innerDown')).toBe('bothInnerDown')
    expect(getCashewOutcome('innerUp', 'innerDown')).toBe('split')
  })

  it('keeps trial totals consistent', () => {
    const result = simulateCashewTrials(
      {
        trials: 60,
        asymmetry: 0.12,
        launchEnergy: 1.35,
        damping: 0.16,
      },
      createRandom(7)
    )

    const pairTotal =
      result.pairCounts.bothInnerUp +
      result.pairCounts.bothInnerDown +
      result.pairCounts.split

    expect(result.trials).toBe(60)
    expect(pairTotal).toBe(60)
    expect(result.innerUp + result.innerDown).toBe(120)
    expect(result.samples).toHaveLength(18)
  })
})
