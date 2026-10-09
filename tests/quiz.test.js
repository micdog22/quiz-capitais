import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESTADOS, REGIOES } from '../src/estados.js';
import {
  MODES, buildRound, bestKey, checkAnswer, emptyScore, makeOptions, mulberry32, normalizeAnswer,
  parseBests, questionFor, registerAnswer, starsFor, updateBest,
} from '../src/quiz.js';

const byS = (sigla) => ESTADOS.find((e) => e.sigla === sigla);
const allModes = Object.keys(MODES);

test('cada rodada de 10 tem 10 estados diferentes, em todos os modos', () => {
  for (const mode of allModes) {
    for (let seed = 1; seed <= 20; seed++) {
      const round = buildRound({ mode, size: 10, rng: mulberry32(seed) });
      assert.equal(round.length, 10);
      assert.equal(new Set(round.map((q) => q.sigla)).size, 10, `${mode} repetiu estado`);
    }
  }
});

test('rodada com todas as 27 usa cada estado exatamente uma vez', () => {
  for (const mode of allModes) {
    const round = buildRound({ mode, size: 27, rng: mulberry32(5) });
    assert.deepEqual(round.map((q) => q.sigla).sort(), ESTADOS.map((e) => e.sigla).sort());
  }
});

test('alternativas: a certa aparece e há 3 distratores diferentes', () => {
  for (const mode of allModes) {
    for (let seed = 1; seed <= 10; seed++) {
      for (const q of buildRound({ mode, size: 27, rng: mulberry32(seed) })) {
        assert.equal(q.options.length, 4, `${mode} ${q.sigla}`);
        assert.equal(new Set(q.options).size, 4, `${mode} ${q.sigla}: alternativas repetidas`);
        assert.equal(q.options.filter((o) => o === q.answer).length, 1, `${mode} ${q.sigla}: resposta ausente`);
        const distractors = q.options.filter((o) => o !== q.answer);
        assert.equal(distractors.length, 3);
        for (const d of distractors) assert.equal(checkAnswer(q, d), false, `${mode} ${q.sigla}: distrator ${d} aceito`);
      }
    }
  }
});

test('alternativas são do mesmo tipo da resposta', () => {
  const rng = mulberry32(3);
  const capitais = new Set(ESTADOS.map((e) => e.capital));
  const nomes = new Set(ESTADOS.map((e) => e.nome));
  const gentilicos = new Set(ESTADOS.map((e) => e.gentilicos[0]));
  for (const e of ESTADOS) {
    assert.ok(makeOptions('estado-capital', e, rng).every((o) => capitais.has(o)));
    assert.ok(makeOptions('capital-estado', e, rng).every((o) => nomes.has(o)));
    assert.ok(makeOptions('sigla-estado', e, rng).every((o) => nomes.has(o)));
    assert.ok(makeOptions('estado-regiao', e, rng).every((o) => REGIOES.includes(o)));
    assert.ok(makeOptions('estado-gentilico', e, rng).every((o) => gentilicos.has(o)));
  }
});

test('rodada de revisão usa só os estados indicados', () => {
  const round = buildRound({ mode: 'estado-capital', size: 10, rng: mulberry32(1), siglas: ['PE', 'SE', 'TO'] });
  assert.deepEqual(round.map((q) => q.sigla).sort(), ['PE', 'SE', 'TO']);
});

test('mesma semente, mesma rodada', () => {
  const a = buildRound({ mode: 'sigla-estado', size: 10, rng: mulberry32(77) });
  const b = buildRound({ mode: 'sigla-estado', size: 10, rng: mulberry32(77) });
  assert.deepEqual(a, b);
  assert.throws(() => buildRound({ mode: 'inexistente' }), /Modo desconhecido/);
});

test('perguntas com a preposição certa', () => {
  assert.equal(questionFor('estado-capital', byS('AC')).prompt, 'Qual é a capital do Acre?');
  assert.equal(questionFor('estado-capital', byS('BA')).prompt, 'Qual é a capital da Bahia?');
  assert.equal(questionFor('estado-capital', byS('PE')).prompt, 'Qual é a capital de Pernambuco?');
  assert.equal(questionFor('estado-capital', byS('RJ')).prompt, 'Qual é a capital do estado do Rio de Janeiro?');
  assert.equal(questionFor('estado-capital', byS('SP')).fact, 'A capital do estado de São Paulo é a cidade de São Paulo.');
  assert.equal(questionFor('capital-estado', byS('PE')).prompt, 'Recife é a capital de…');
  assert.equal(questionFor('capital-estado', byS('RJ')).prompt, 'A cidade do Rio de Janeiro é a capital de…');
  assert.equal(questionFor('sigla-estado', byS('PB')).fact, 'PB é a sigla da Paraíba.');
  assert.equal(questionFor('estado-regiao', byS('AC')).prompt, 'Em que região fica o Acre?');
  assert.equal(questionFor('estado-regiao', byS('GO')).fact, 'Goiás fica na região Centro-Oeste.');
  assert.equal(questionFor('estado-regiao', byS('BA')).fact, 'A Bahia fica na região Nordeste.');
  assert.equal(questionFor('estado-gentilico', byS('BA')).prompt, 'Quem nasce na Bahia é…');
  assert.equal(questionFor('estado-gentilico', byS('MG')).prompt, 'Quem nasce em Minas Gerais é…');
  assert.equal(questionFor('estado-gentilico', byS('RJ')).prompt, 'Quem nasce no estado do Rio de Janeiro é…');
  assert.equal(questionFor('estado-gentilico', byS('ES')).fact, 'Quem nasce no Espírito Santo é capixaba ou espírito-santense.');
});

test('normalização: acentos, maiúsculas, hífens, espaços e artigos', () => {
  assert.equal(normalizeAnswer('São Paulo'), normalizeAnswer('Sao Paulo'));
  assert.equal(normalizeAnswer('  SÃO   paulo  '), 'saopaulo');
  assert.equal(normalizeAnswer('são-paulo'), 'saopaulo');
  assert.equal(normalizeAnswer('Centro-Oeste'), normalizeAnswer('centro oeste'));
  assert.equal(normalizeAnswer('região Sul'), 'sul');
  assert.equal(normalizeAnswer('o Acre'), 'acre');
  assert.equal(normalizeAnswer('a Bahia'), 'bahia');
  assert.equal(normalizeAnswer('estado do Pará'), 'para');
  assert.equal(normalizeAnswer('Aracaju'), 'aracaju');
  assert.equal(normalizeAnswer(''), '');
  assert.equal(normalizeAnswer(null), '');
});

test('resposta digitada aceita "Sao Paulo" e variações', () => {
  const sp = questionFor('estado-capital', byS('SP'));
  for (const typed of ['Sao Paulo', 'são paulo', 'SÃO PAULO', ' sao   paulo ', 'São-Paulo']) assert.equal(checkAnswer(sp, typed), true, typed);
  assert.equal(checkAnswer(sp, 'Santos'), false);
  assert.equal(checkAnswer(sp, ''), false);
  assert.equal(checkAnswer(sp, '   '), false);

  assert.equal(checkAnswer(questionFor('estado-capital', byS('SC')), 'florianopolis'), true);
  assert.equal(checkAnswer(questionFor('estado-capital', byS('MA')), 'Sao Luis'), true);
  assert.equal(checkAnswer(questionFor('estado-capital', byS('PB')), 'joao pessoa'), true);
  assert.equal(checkAnswer(questionFor('capital-estado', byS('AC')), 'o acre'), true);
  assert.equal(checkAnswer(questionFor('sigla-estado', byS('ES')), 'espirito santo'), true);
  assert.equal(checkAnswer(questionFor('sigla-estado', byS('ES')), 'ES'), false);
  assert.equal(checkAnswer(questionFor('estado-regiao', byS('MT')), 'centro oeste'), true);
  assert.equal(checkAnswer(questionFor('estado-regiao', byS('MT')), 'Norte'), false);
});

test('gentílicos aceitam a forma alternativa e o feminino', () => {
  const es = questionFor('estado-gentilico', byS('ES'));
  for (const typed of ['capixaba', 'Espírito-Santense', 'espirito santense']) assert.equal(checkAnswer(es, typed), true, typed);
  const rn = questionFor('estado-gentilico', byS('RN'));
  assert.equal(checkAnswer(rn, 'potiguar'), true);
  assert.equal(checkAnswer(rn, 'norte rio grandense'), true);
  const rs = questionFor('estado-gentilico', byS('RS'));
  for (const typed of ['gaúcho', 'gaucho', 'gaúcha', 'sul-rio-grandense']) assert.equal(checkAnswer(rs, typed), true, typed);
  assert.equal(checkAnswer(questionFor('estado-gentilico', byS('BA')), 'baiana'), true);
  assert.equal(checkAnswer(questionFor('estado-gentilico', byS('MS')), 'sul mato grossense'), true);
  assert.equal(checkAnswer(questionFor('estado-gentilico', byS('MT')), 'sul-mato-grossense'), false);
  assert.equal(checkAnswer(questionFor('estado-gentilico', byS('RJ')), 'carioca'), false);
});

test('placar, sequência e estrelas', () => {
  let score = emptyScore();
  for (const ok of [true, true, false, true, true, true]) score = registerAnswer(score, ok);
  assert.deepEqual(score, { correct: 5, answered: 6, streak: 3, bestStreak: 3 });
  assert.equal(starsFor(10, 10), 3);
  assert.equal(starsFor(9, 10), 3);
  assert.equal(starsFor(6, 10), 2);
  assert.equal(starsFor(5, 10), 1);
  assert.equal(starsFor(0, 10), 1);
  assert.equal(starsFor(0, 0), 0);
});

test('melhor pontuação por configuração', () => {
  const key = bestKey({ mode: 'estado-capital', answerType: 'escolha', size: 10, timer: false });
  assert.equal(key, 'estado-capital|escolha|10|sem-tempo');
  let out = updateBest({}, key, { correct: 6, total: 10, bestStreak: 4, date: 'd1' });
  assert.equal(out.first, true);
  out = updateBest(out.bests, key, { correct: 5, total: 10, bestStreak: 5, date: 'd2' });
  assert.equal(out.isRecord, false);
  assert.deepEqual(out.bests[key], { correct: 6, total: 10, bestStreak: 5, date: 'd1' });
  out = updateBest(out.bests, key, { correct: 9, total: 10, bestStreak: 2, date: 'd3' });
  assert.equal(out.isRecord, true);
  assert.deepEqual(out.bests[key], { correct: 9, total: 10, bestStreak: 5, date: 'd3' });
});

test('melhores pontuações salvas com defeito são ignoradas', () => {
  assert.deepEqual(parseBests('não é json'), {});
  assert.deepEqual(parseBests('[1,2]'), {});
  const parsed = parseBests(JSON.stringify({ a: { correct: 3, total: 10, bestStreak: 2 }, b: { correct: 11, total: 10, bestStreak: 1 }, c: 5 }));
  assert.deepEqual(Object.keys(parsed), ['a']);
});
