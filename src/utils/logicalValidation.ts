/**
 * Formal propositional argument validation.
 *
 * This module validates explicitly formalized arguments only. It deliberately
 * does not pretend to translate unrestricted natural language into logic.
 */
export type PremiseTruth = 'TRUE' | 'FALSE' | 'UNKNOWN';
export type LogicalValidity = 'VALID' | 'INVALID' | 'NOT_ASSESSED';
export type LogicalSoundness = 'SOUND' | 'UNSOUND' | 'UNDETERMINED' | 'NOT_ASSESSED';

type Expr =
  | { kind: 'atom'; name: string }
  | { kind: 'not'; value: Expr }
  | { kind: 'and' | 'or' | 'implies' | 'iff'; left: Expr; right: Expr };

type Token = { type: 'atom' | 'op' | 'lparen' | 'rparen'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s*(<->|<=>|->|=>|&&|\|\||[!&|()]|[A-Za-z][A-Za-z0-9_]*)/gy;
  let offset = 0;
  while (offset < input.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(input);
    if (!match) throw new Error(`Unsupported token at position ${offset}`);
    const value = match[1];
    tokens.push({
      type: value === '(' ? 'lparen' : value === ')' ? 'rparen' :
        /^[A-Za-z]/.test(value) ? 'atom' : 'op',
      value
    });
    offset = pattern.lastIndex;
  }
  return tokens;
}

function parse(input: string): Expr {
  const tokens = tokenize(input);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const parsePrimary = (): Expr => {
    const token = take();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === 'op' && token.value === '!') return { kind: 'not', value: parsePrimary() };
    if (token.type === 'lparen') {
      const value = parseIff();
      if (take()?.type !== 'rparen') throw new Error('Missing closing parenthesis');
      return value;
    }
    if (token.type === 'atom') return { kind: 'atom', name: token.value };
    throw new Error(`Unexpected token: ${token.value}`);
  };
  const parseAnd = (): Expr => {
    let left = parsePrimary();
    while (peek()?.value === '&' || peek()?.value === '&&') {
      take(); left = { kind: 'and', left, right: parsePrimary() };
    }
    return left;
  };
  const parseOr = (): Expr => {
    let left = parseAnd();
    while (peek()?.value === '|' || peek()?.value === '||') {
      take(); left = { kind: 'or', left, right: parseAnd() };
    }
    return left;
  };
  const parseImplies = (): Expr => {
    let left = parseOr();
    if (peek()?.value === '->' || peek()?.value === '=>') {
      take(); left = { kind: 'implies', left, right: parseImplies() };
    }
    return left;
  };
  const parseIff = (): Expr => {
    let left = parseImplies();
    while (peek()?.value === '<->' || peek()?.value === '<=>') {
      take(); left = { kind: 'iff', left, right: parseImplies() };
    }
    return left;
  };
  const result = parseIff();
  if (index !== tokens.length) throw new Error(`Unexpected token: ${tokens[index].value}`);
  return result;
}

function evaluate(expr: Expr, values: Record<string, boolean>): boolean {
  switch (expr.kind) {
    case 'atom': return values[expr.name];
    case 'not': return !evaluate(expr.value, values);
    case 'and': return evaluate(expr.left, values) && evaluate(expr.right, values);
    case 'or': return evaluate(expr.left, values) || evaluate(expr.right, values);
    case 'implies': return !evaluate(expr.left, values) || evaluate(expr.right, values);
    case 'iff': return evaluate(expr.left, values) === evaluate(expr.right, values);
  }
}

export interface LogicalArgumentInput {
  premises: string[];
  conclusion: string;
  premiseTruth?: PremiseTruth[];
}

export interface LogicalValidationResult {
  validity: LogicalValidity;
  soundness: LogicalSoundness;
  premise_truth: PremiseTruth[];
  variables: string[];
  counterexample: Record<string, boolean> | null;
  method: 'TRUTH_TABLE';
  status: 'ASSESSED' | 'NOT_ASSESSED';
  reason?: string;
}

/** Check entailment by exhaustive truth table; max 12 propositional variables. */
export function validateFormalArgument(input: LogicalArgumentInput): LogicalValidationResult {
  const premises = Array.isArray(input.premises) ? input.premises : [];
  const premiseTruth = premises.map((_, i) => input.premiseTruth?.[i] || 'UNKNOWN');
  const notAssessed = (reason: string): LogicalValidationResult => ({
    validity: 'NOT_ASSESSED', soundness: 'NOT_ASSESSED', premise_truth: premiseTruth,
    variables: [], counterexample: null, method: 'TRUTH_TABLE', status: 'NOT_ASSESSED', reason
  });
  if (!premises.length || !input.conclusion?.trim()) return notAssessed('At least one premise and a conclusion are required.');
  try {
    const parsedPremises = premises.map(parse);
    const parsedConclusion = parse(input.conclusion);
    const vars = [...new Set([...premises, input.conclusion].flatMap(text => {
      const collect = (expr: Expr): string[] => expr.kind === 'atom' ? [expr.name] :
        expr.kind === 'not' ? collect(expr.value) : [...collect(expr.left), ...collect(expr.right)];
      return collect(parse(text));
    }))].sort();
    if (vars.length > 12) return notAssessed('Truth-table validation is limited to 12 variables.');
    let counterexample: Record<string, boolean> | null = null;
    for (let mask = 0; mask < 2 ** vars.length; mask++) {
      const values = Object.fromEntries(vars.map((name, i) => [name, Boolean(mask & (1 << i))]));
      if (parsedPremises.every(p => evaluate(p, values)) && !evaluate(parsedConclusion, values)) {
        counterexample = values;
        break;
      }
    }
    const validity: LogicalValidity = counterexample ? 'INVALID' : 'VALID';
    const soundness: LogicalSoundness = validity === 'INVALID' || premiseTruth.includes('FALSE')
      ? 'UNSOUND'
      : premiseTruth.length === premises.length && premiseTruth.every(value => value === 'TRUE')
        ? 'SOUND' : 'UNDETERMINED';
    return { validity, soundness, premise_truth: premiseTruth, variables: vars, counterexample,
      method: 'TRUTH_TABLE', status: 'ASSESSED' };
  } catch (error) {
    return notAssessed(error instanceof Error ? error.message : 'Formal expression could not be parsed.');
  }
}
