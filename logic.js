import { byNumber, elements } from './elements.js';

export function selectElements(mode, count, pool, manual = [], random = Math.random) {
  if (mode === 'manual') return [...new Set(manual)].filter(z => byNumber.has(z)).sort((a,b) => a-b);
  const candidates = elements.filter(e => e.z <= pool).map(e => e.z);
  if (mode === 'random') {
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
  }
  return candidates.slice(0, Math.min(count, candidates.length)).sort((a,b) => a-b);
}

const clean = value => String(value ?? '').normalize('NFKC').trim();
export function gradeAnswer(element, answer = {}, language = 'zh') {
  const symbol = clean(answer.symbol);
  const name = clean(answer.name);
  const englishAliases = { Al: ['aluminium', 'aluminum'], Cs: ['caesium', 'cesium'], S: ['sulfur', 'sulphur'] };
  const names = language === 'en' ? (englishAliases[element.symbol] || [element.en.toLowerCase()]) : [element.zh];
  const symbolCorrect = symbol === element.symbol;
  const nameCorrect = names.includes(language === 'en' ? name.toLowerCase() : name);
  return {
    z: element.z, symbol, name, symbolCorrect, nameCorrect,
    symbolBlank: !symbol, nameBlank: !name,
    caseError: !!symbol && !symbolCorrect && symbol.toLowerCase() === element.symbol.toLowerCase(),
    correct: symbolCorrect && nameCorrect,
    expectedSymbol: element.symbol, expectedName: element[language],
  };
}
export function gradeSession(session) {
  const details = session.ids.map(z => gradeAnswer(byNumber.get(z), session.answers[z], session.language));
  const fieldsCorrect = details.reduce((n,r) => n + Number(r.symbolCorrect) + Number(r.nameCorrect), 0);
  return {
    details, fieldsCorrect, fieldsTotal: details.length * 2,
    percent: Math.round(fieldsCorrect / (details.length * 2) * 100) || 0,
    elementsCorrect: details.filter(r => r.correct).length,
    wrong: details.filter(r => !r.correct).map(r => r.z),
    blanks: details.reduce((n,r) => n + Number(r.symbolBlank) + Number(r.nameBlank), 0),
  };
}
export function restoreSession(value) {
  if (!value || !Array.isArray(value.ids) || !value.ids.length || value.ids.length > 118 || !['zh','en'].includes(value.language)) return null;
  if (!value.ids.every(z => Number.isInteger(z) && byNumber.has(z)) || new Set(value.ids).size !== value.ids.length) return null;
  const answers = {};
  for (const z of value.ids) {
    const a = value.answers?.[z] || {};
    answers[z] = { symbol: typeof a.symbol === 'string' ? a.symbol.slice(0,8) : '', name: typeof a.name === 'string' ? a.name.slice(0,32) : '' };
  }
  return { ids: [...value.ids].sort((a,b)=>a-b), language: value.language, answers, graded: value.graded === true };
}
