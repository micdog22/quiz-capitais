// Regras do quiz: perguntas, alternativas, correção de respostas digitadas e pontuação.
import { ESTADOS, REGIOES } from './estados.js';

export const MODES = {
  'estado-capital': { label: 'Estado → Capital', icon: '🏙️', hint: 'Veja o estado e descubra a capital.' },
  'capital-estado': { label: 'Capital → Estado', icon: '🗺️', hint: 'Veja a capital e descubra o estado.' },
  'sigla-estado': { label: 'Sigla → Estado', icon: '🔤', hint: 'Veja a sigla e descubra o estado.' },
  'estado-regiao': { label: 'Estado → Região', icon: '🧭', hint: 'Descubra em que região fica cada estado.' },
  'estado-gentilico': { label: 'Estado → Gentílico', icon: '👋', hint: 'Como se chama quem nasce em cada estado?' },
};

export const SECONDS_PER_QUESTION = 15;

// ---------- frases com a preposição certa ("do Acre", "da Bahia", "de Pernambuco") ----------

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
export const deForm = (estado) => ({ o: 'do', a: 'da' }[estado.artigo] || 'de');
export const emForm = (estado) => ({ o: 'no', a: 'na' }[estado.artigo] || 'em');
export const comArtigo = (estado) => (estado.artigo ? `${estado.artigo} ${estado.nome}` : estado.nome);

// Rio de Janeiro e São Paulo têm o mesmo nome da capital: aí vale dizer "estado" e "cidade".
const sameName = (estado) => estado.capital === estado.nome;
const doEstado = (estado) => (sameName(estado) ? `do estado ${deForm(estado)} ${estado.nome}` : `${deForm(estado)} ${estado.nome}`);
const noEstado = (estado) => (sameName(estado) ? `no estado ${deForm(estado)} ${estado.nome}` : `${emForm(estado)} ${estado.nome}`);
const aCapital = (estado) => (sameName(estado) ? `a cidade ${deForm(estado)} ${estado.capital}` : estado.capital);

export function capitalFact(estado) {
  return `A capital ${doEstado(estado)} é ${aCapital(estado)}.`;
}

// Aceita também o feminino nas respostas digitadas (baiano/baiana, gaúcho/gaúcha).
function withFeminine(gentilicos) {
  const all = [...gentilicos];
  for (const word of gentilicos) if (word.endsWith('o')) all.push(`${word.slice(0, -1)}a`);
  return all;
}

export function questionFor(mode, estado) {
  switch (mode) {
    case 'estado-capital':
      return { prompt: `Qual é a capital ${doEstado(estado)}?`, answer: estado.capital, accepted: [estado.capital], fact: capitalFact(estado) };
    case 'capital-estado':
      return { prompt: `${capitalize(aCapital(estado))} é a capital de…`, answer: estado.nome, accepted: [estado.nome], fact: capitalFact(estado) };
    case 'sigla-estado':
      return { prompt: `${estado.sigla} é a sigla de…`, answer: estado.nome, accepted: [estado.nome], fact: `${estado.sigla} é a sigla ${deForm(estado)} ${estado.nome}.` };
    case 'estado-regiao':
      return {
        prompt: `Em que região fica ${comArtigo(estado)}?`,
        answer: estado.regiao,
        accepted: [estado.regiao],
        fact: `${capitalize(comArtigo(estado))} fica na região ${estado.regiao}.`,
      };
    case 'estado-gentilico':
      return {
        prompt: `Quem nasce ${noEstado(estado)} é…`,
        answer: estado.gentilicos[0],
        accepted: withFeminine(estado.gentilicos),
        fact: `Quem nasce ${noEstado(estado)} é ${estado.gentilicos.join(' ou ')}.`,
      };
    default:
      throw new Error(`Modo desconhecido: ${mode}`);
  }
}

// ---------- sorteio ----------

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(rng, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function optionValue(mode, estado) {
  if (mode === 'estado-capital') return estado.capital;
  if (mode === 'estado-regiao') return estado.regiao;
  if (mode === 'estado-gentilico') return estado.gentilicos[0];
  return estado.nome;
}

/** Quatro alternativas: a certa e três erradas diferentes (uma delas, se der, da mesma região). */
export function makeOptions(mode, estado, rng) {
  const answer = optionValue(mode, estado);
  let candidates;
  if (mode === 'estado-regiao') {
    candidates = shuffle(rng, REGIOES);
  } else {
    const others = ESTADOS.filter((e) => e.sigla !== estado.sigla);
    const sameRegion = shuffle(rng, others.filter((e) => e.regiao === estado.regiao));
    const rest = shuffle(rng, [...sameRegion.slice(1), ...others.filter((e) => e.regiao !== estado.regiao)]);
    candidates = [...sameRegion.slice(0, 1), ...rest].map((e) => optionValue(mode, e));
  }
  const distractors = [];
  for (const value of candidates) {
    if (value !== answer && !distractors.includes(value)) distractors.push(value);
    if (distractors.length === 3) break;
  }
  return shuffle(rng, [answer, ...distractors]);
}

/**
 * Monta uma rodada sem repetir estado. `siglas` limita os estados (rodada de revisão dos erros).
 */
export function buildRound({ mode, size = 10, rng = Math.random, siglas = null }) {
  if (!MODES[mode]) throw new Error(`Modo desconhecido: ${mode}`);
  const pool = siglas ? ESTADOS.filter((e) => siglas.includes(e.sigla)) : ESTADOS;
  return shuffle(rng, pool)
    .slice(0, Math.min(size, pool.length))
    .map((estado) => ({ sigla: estado.sigla, mode, ...questionFor(mode, estado), options: makeOptions(mode, estado, rng) }));
}

// ---------- respostas digitadas ----------

const PREFIXES = /^(o|a|os|as|estado d[aeo]s?|regiao|cidade d[aeo])\s+/;

/** Ignora acentos, maiúsculas, hífens, espaços extras e artigos ("o Acre", "região Sul"). */
export function normalizeAnswer(text) {
  let value = String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  let previous;
  do {
    previous = value;
    value = value.replace(PREFIXES, '');
  } while (value !== previous);
  return value.replace(/\s+/g, '');
}

export function checkAnswer(question, given) {
  const normalized = normalizeAnswer(given);
  if (!normalized) return false;
  return question.accepted.some((option) => normalizeAnswer(option) === normalized);
}

// ---------- pontuação ----------

export function starsFor(correct, total) {
  if (!total) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

export function endMessage(stars) {
  if (stars === 3) return 'Incrível! Você mandou muito bem!';
  if (stars === 2) return 'Muito bem! Mais um pouquinho e você gabarita.';
  return 'Bom começo! Dê uma olhada no modo estudo e tente de novo.';
}

/** Atualiza o placar com uma resposta e devolve o novo estado (sem mudar o anterior). */
export function registerAnswer(score, isCorrect) {
  const streak = isCorrect ? score.streak + 1 : 0;
  return {
    correct: score.correct + (isCorrect ? 1 : 0),
    answered: score.answered + 1,
    streak,
    bestStreak: Math.max(score.bestStreak, streak),
  };
}

export const emptyScore = () => ({ correct: 0, answered: 0, streak: 0, bestStreak: 0 });

// ---------- melhores pontuações ----------

export function bestKey({ mode, answerType, size, timer }) {
  return `${mode}|${answerType}|${size}|${timer ? 'com-tempo' : 'sem-tempo'}`;
}

export function parseBests(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return {};
  }
  const bests = {};
  if (!data || typeof data !== 'object') return bests;
  for (const [key, value] of Object.entries(data)) {
    const ok = value && Number.isInteger(value.correct) && Number.isInteger(value.total) && value.total > 0
      && value.correct >= 0 && value.correct <= value.total && Number.isInteger(value.bestStreak);
    if (ok) bests[key] = { correct: value.correct, total: value.total, bestStreak: value.bestStreak, date: String(value.date || '') };
  }
  return bests;
}

/** Guarda o melhor aproveitamento e a maior sequência de cada configuração. */
export function updateBest(bests, key, { correct, total, bestStreak, date }) {
  const previous = bests[key];
  const better = !previous || correct / total > previous.correct / previous.total;
  const entry = better
    ? { correct, total, bestStreak: Math.max(bestStreak, previous?.bestStreak ?? 0), date }
    : { ...previous, bestStreak: Math.max(bestStreak, previous.bestStreak) };
  return { bests: { ...bests, [key]: entry }, isRecord: better && Boolean(previous), first: !previous };
}
