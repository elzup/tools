type Desc = {
  code: string
  desc: string
}

export const descriptions: { funcs: Desc[]; vars: Desc[] } = {
  funcs: [
    { code: `lineNum($)`, desc: `number of lines` },
    { code: `count($$, '')`, desc: 'count q in text ' },
    { code: `pack($, 1)`, desc: 'remove chained newline' },
    { code: `shiftl($$, '\\t', 1)`, desc: `trim left column` },
    { code: `shiftr($$, '\\t', 1)`, desc: `trim right column` },
  ],
  vars: [
    { code: `$`, desc: `text` },
    { code: `$$`, desc: `each lines` },
    { code: '$lines', desc: 'split by line' },
    { code: '$ls', desc: 'alias of $lines' },
    { code: '$tsv', desc: 'split by tab' },
    { code: '$csv', desc: 'split by comma' },
    { code: `$sp(' ')`, desc: '[func]split by x' },
  ],
}
