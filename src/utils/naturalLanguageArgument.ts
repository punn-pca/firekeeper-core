import { validateFormalArgument, LogicalValidationResult } from './logicalValidation';

export type ArgumentExtractionStatus = 'NOT_ATTEMPTED' | 'EXTRACTED' | 'NO_ARGUMENT' | 'AMBIGUOUS' | 'INVALID_OUTPUT';
export interface ExtractedPremise {
  id: string;
  text: string;
  source_quote: string;
  kind: 'FACT_CLAIM' | 'ASSUMPTION' | 'CONDITIONAL' | 'VALUE_PREMISE';
  truth_status: 'UNKNOWN';
}
export interface ExtractedInference {
  from_premise_ids: string[];
  rule: string;
  conclusion: string;
  source_quote: string;
}
export interface ExtractedArgument {
  status: ArgumentExtractionStatus;
  premises: ExtractedPremise[];
  inference_steps: ExtractedInference[];
  conclusion: { text: string; source_quote: string } | null;
  formalization: {
    atom_map: Record<string, string>;
    premise_formulas: string[];
    conclusion_formula: string;
    validation: LogicalValidationResult;
    review_status: 'HUMAN_REVIEW_REQUIRED';
  } | null;
  limitations: string[];
  parser_error?: string;
}

export const ARGUMENT_EXTRACTION_SYSTEM_PROMPT = `
You are FIREKEEPER's natural-language argument reconstruction component.
Analyze only the supplied assistant answer. Do not answer the user and do not use outside knowledge.

Return valid JSON only with this exact shape:
{
  "status": "EXTRACTED" | "NO_ARGUMENT" | "AMBIGUOUS",
  "premises": [
    {"id":"P1","text":"faithful concise statement","source_quote":"an exact, contiguous substring copied verbatim from the answer","kind":"FACT_CLAIM|ASSUMPTION|CONDITIONAL|VALUE_PREMISE"}
  ],
  "inference_steps": [
    {"from_premise_ids":["P1"],"rule":"briefly name the inference pattern or relationship","conclusion":"what this step infers","source_quote":"an exact substring from the answer"}
  ],
  "conclusion": {"text":"faithful conclusion","source_quote":"an exact substring from the answer"},
  "formalization": null OR {
    "atom_map":{"P":"plain-language meaning of atom P"},
    "premise_formulas":["P -> Q","P"],
    "conclusion_formula":"Q"
  },
  "limitations":["uncertainty or ambiguity"]
}

Rules:
1. Extract an argument only when the answer actually gives one or more reasons supporting a conclusion. Do not force every explanation, list, definition, summary, or descriptive answer into an argument.
2. Every premise and conclusion must be grounded in an exact quote from the supplied answer. source_quote must be copied exactly, including wording; never invent a premise.
3. Distinguish factual claims, assumptions, conditional premises, and value premises. All premise truth statuses remain UNKNOWN; this task does not verify truth.
4. Include only premises that materially support the stated conclusion. Preserve qualifiers, negation, conditions, scope, time, and uncertainty.
5. If multiple interpretations are plausible, return AMBIGUOUS and explain why. If no actual inference exists, return NO_ARGUMENT.
6. Formalize only when the propositional structure is unambiguous. Otherwise set formalization to null. Use uppercase Latin atoms and only !, &, |, ->, <->, parentheses. Each atom must have a plain-language mapping. Never make up a formalization to avoid null.
7. A formal validity result checks only the structure of the proposed formalization, not whether the Thai interpretation is faithful and not whether any premise is true.
8. Never return confidence percentages, evidence verification, or a truth verdict.
`.trim();

function extractJson(text: string): any {
  const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object returned');
  return JSON.parse(raw.slice(start, end + 1));
}

function exactQuote(quote: unknown, source: string): quote is string {
  return typeof quote === 'string' && quote.trim().length >= 4 && source.includes(quote);
}

export function parseNaturalLanguageArgument(
  raw: string,
  sourceText: string
): ExtractedArgument {
  try {
    const value = extractJson(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Root must be an object');
    const status = value.status;
    if (!['EXTRACTED', 'NO_ARGUMENT', 'AMBIGUOUS'].includes(status)) throw new Error('Invalid extraction status');
    const limitations = Array.isArray(value.limitations)
      ? value.limitations.filter((item: unknown): item is string => typeof item === 'string').slice(0, 12)
      : [];

    if (status !== 'EXTRACTED') {
      return { status, premises: [], inference_steps: [], conclusion: null, formalization: null, limitations };
    }

    if (!Array.isArray(value.premises) || value.premises.length < 1 || value.premises.length > 8) {
      throw new Error('Premise count must be between 1 and 8');
    }
    if (!value.conclusion || typeof value.conclusion.text !== 'string' ||
        !exactQuote(value.conclusion.source_quote, sourceText)) {
      throw new Error('Conclusion is not anchored to an exact answer quote');
    }

    const premises: ExtractedPremise[] = value.premises.map((item: any, index: number) => {
      if (!item || typeof item.id !== 'string' || !/^P[1-8]$/.test(item.id) ||
          typeof item.text !== 'string' || !item.text.trim() ||
          !exactQuote(item.source_quote, sourceText) ||
          !['FACT_CLAIM', 'ASSUMPTION', 'CONDITIONAL', 'VALUE_PREMISE'].includes(item.kind)) {
        throw new Error(`Premise ${index + 1} is invalid or not quote-grounded`);
      }
      return { id: item.id, text: item.text.trim(), source_quote: item.source_quote,
        kind: item.kind, truth_status: 'UNKNOWN' };
    });
    if (new Set(premises.map(item => item.id)).size !== premises.length) throw new Error('Duplicate premise IDs');

    if (!Array.isArray(value.inference_steps) || value.inference_steps.length < 1 || value.inference_steps.length > 8) {
      throw new Error('Inference step count must be between 1 and 8');
    }
    const validIds = new Set(premises.map(item => item.id));
    const inference_steps: ExtractedInference[] = value.inference_steps.map((item: any) => {
      if (!Array.isArray(item?.from_premise_ids) || item.from_premise_ids.length < 1 ||
          item.from_premise_ids.some((id: unknown) => typeof id !== 'string' || !validIds.has(id)) ||
          typeof item.rule !== 'string' || !item.rule.trim() ||
          typeof item.conclusion !== 'string' || !item.conclusion.trim() ||
          !exactQuote(item.source_quote, sourceText)) {
        throw new Error('Inference step is invalid or references unknown premises');
      }
      return { from_premise_ids: item.from_premise_ids, rule: item.rule.trim(),
        conclusion: item.conclusion.trim(), source_quote: item.source_quote };
    });

    let formalization: ExtractedArgument['formalization'] = null;
    if (value.formalization !== null && value.formalization !== undefined) {
      const candidate = value.formalization;
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) ||
          !candidate.atom_map || typeof candidate.atom_map !== 'object' || Array.isArray(candidate.atom_map) ||
          !Array.isArray(candidate.premise_formulas) || candidate.premise_formulas.length !== premises.length ||
          typeof candidate.conclusion_formula !== 'string' ||
          Object.keys(candidate.atom_map).length < 1 || Object.keys(candidate.atom_map).length > 12) {
        throw new Error('Formalization schema is invalid');
      }
      const atom_map: Record<string, string> = {};
      for (const [atom, meaning] of Object.entries(candidate.atom_map)) {
        if (!/^[A-Z][A-Z0-9_]*$/.test(atom) || typeof meaning !== 'string' || !meaning.trim()) {
          throw new Error('Formalization atom map is invalid');
        }
        atom_map[atom] = meaning.trim();
      }
      const premise_formulas = candidate.premise_formulas.map((item: unknown) => {
        if (typeof item !== 'string' || !item.trim()) throw new Error('Formalization premise formula is invalid');
        return item.trim();
      });
      const validation = validateFormalArgument({
        premises: premise_formulas,
        conclusion: candidate.conclusion_formula.trim(),
        premiseTruth: premises.map(() => 'UNKNOWN')
      });
      if (validation.status !== 'ASSESSED') throw new Error('Formalization could not be evaluated by the truth-table engine');
      formalization = {
        atom_map, premise_formulas, conclusion_formula: candidate.conclusion_formula.trim(),
        validation, review_status: 'HUMAN_REVIEW_REQUIRED'
      };
    }

    return {
      status: 'EXTRACTED',
      premises,
      inference_steps,
      conclusion: { text: value.conclusion.text.trim(), source_quote: value.conclusion.source_quote },
      formalization,
      limitations
    };
  } catch (error) {
    return {
      status: 'INVALID_OUTPUT', premises: [], inference_steps: [], conclusion: null,
      formalization: null, limitations: ['Natural-language extraction was not accepted; no logical verdict was produced.'],
      parser_error: error instanceof Error ? error.message : 'Unknown extraction error'
    };
  }
}

export function shouldExtractNaturalLanguageArgument(text: string): boolean {
  const value = String(text || '').trim();
  if (value.length < 100) return false;
  return /เพราะ|ดังนั้น|จึง|ส่งผลให้|หาก|ถ้า|แสดงว่า|หมายความว่า|ข้อสรุป|สรุปได้ว่า|เนื่องจาก|อย่างไรก็ตาม|therefore|thus|because|since|if\b|consequently|it follows|in conclusion|however/i.test(value);
}
