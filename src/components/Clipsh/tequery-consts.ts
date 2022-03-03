type Desc = {
  code: string
  desc: string
}

export const descriptions: { funcs: Desc[]; vars: Desc[] } = {
  funcs: [
    { code: `lineNum`, desc: `lineNum(text) number of lines` },
    { code: `count`, desc: 'count(text, q) count q in text ' },
    { code: `pack`, desc: 'pack(text, chain=1) remove chained newline' },
    {
      code: `shiftl`,
      desc: `shiftl(text, sepa = '\\t', n = 1) trim left column`,
    },
    {
      code: `shiftr`,
      desc: `shiftr(text, sepa = '\\t', n = 1) trim right column`,
    },
  ],
  vars: [
    { code: '$lines', desc: 'split by line' },
    { code: '$ls', desc: 'alias of $lines' },
    { code: '$tsv', desc: 'split by tab' },
    { code: '$csv', desc: 'split by comma' },
    { code: '$sp(x)', desc: '$sp(x) split by x' },
  ],
}
