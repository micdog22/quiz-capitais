import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESTADOS, REGIOES } from '../src/estados.js';

// Tabela de referência: sigla, estado, capital, região e gentílicos.
const REFERENCIA = `
AC|Acre|Rio Branco|Norte|acriano
AL|Alagoas|Maceió|Nordeste|alagoano
AP|Amapá|Macapá|Norte|amapaense
AM|Amazonas|Manaus|Norte|amazonense
BA|Bahia|Salvador|Nordeste|baiano
CE|Ceará|Fortaleza|Nordeste|cearense
DF|Distrito Federal|Brasília|Centro-Oeste|brasiliense
ES|Espírito Santo|Vitória|Sudeste|capixaba,espírito-santense
GO|Goiás|Goiânia|Centro-Oeste|goiano
MA|Maranhão|São Luís|Nordeste|maranhense
MT|Mato Grosso|Cuiabá|Centro-Oeste|mato-grossense
MS|Mato Grosso do Sul|Campo Grande|Centro-Oeste|sul-mato-grossense
MG|Minas Gerais|Belo Horizonte|Sudeste|mineiro
PA|Pará|Belém|Norte|paraense
PB|Paraíba|João Pessoa|Nordeste|paraibano
PR|Paraná|Curitiba|Sul|paranaense
PE|Pernambuco|Recife|Nordeste|pernambucano
PI|Piauí|Teresina|Nordeste|piauiense
RJ|Rio de Janeiro|Rio de Janeiro|Sudeste|fluminense
RN|Rio Grande do Norte|Natal|Nordeste|potiguar,norte-rio-grandense
RS|Rio Grande do Sul|Porto Alegre|Sul|gaúcho,sul-rio-grandense
RO|Rondônia|Porto Velho|Norte|rondoniense
RR|Roraima|Boa Vista|Norte|roraimense
SC|Santa Catarina|Florianópolis|Sul|catarinense
SP|São Paulo|São Paulo|Sudeste|paulista
SE|Sergipe|Aracaju|Nordeste|sergipano
TO|Tocantins|Palmas|Norte|tocantinense
`.trim().split('\n').map((line) => {
  const [sigla, nome, capital, regiao, gentilicos] = line.split('|');
  return { sigla, nome, capital, regiao, gentilicos: gentilicos.split(',') };
});

test('são 27 unidades da federação', () => {
  assert.equal(ESTADOS.length, 27);
});

test('siglas, nomes e capitais são únicos', () => {
  assert.equal(new Set(ESTADOS.map((e) => e.sigla)).size, 27);
  assert.equal(new Set(ESTADOS.map((e) => e.nome)).size, 27);
  assert.equal(new Set(ESTADOS.map((e) => e.capital)).size, 27);
  for (const e of ESTADOS) assert.match(e.sigla, /^[A-Z]{2}$/);
});

test('dados batem exatamente com a tabela de referência', () => {
  const bySigla = new Map(ESTADOS.map((e) => [e.sigla, e]));
  for (const ref of REFERENCIA) {
    const e = bySigla.get(ref.sigla);
    assert.ok(e, `falta ${ref.sigla}`);
    assert.equal(e.nome, ref.nome, ref.sigla);
    assert.equal(e.capital, ref.capital, ref.sigla);
    assert.equal(e.regiao, ref.regiao, ref.sigla);
    assert.deepEqual(e.gentilicos, ref.gentilicos, ref.sigla);
  }
});

test('quantidade de estados por região: N=7, NE=9, CO=4, SE=4, S=3', () => {
  const count = (regiao) => ESTADOS.filter((e) => e.regiao === regiao).length;
  assert.equal(count('Norte'), 7);
  assert.equal(count('Nordeste'), 9);
  assert.equal(count('Centro-Oeste'), 4);
  assert.equal(count('Sudeste'), 4);
  assert.equal(count('Sul'), 3);
  assert.deepEqual(REGIOES, ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']);
  for (const e of ESTADOS) assert.ok(REGIOES.includes(e.regiao), e.sigla);
});

test('artigos usados nas frases', () => {
  const semArtigo = ['AL', 'GO', 'MT', 'MS', 'MG', 'PE', 'RO', 'RR', 'SC', 'SP', 'SE'];
  const feminino = ['BA', 'PB'];
  for (const e of ESTADOS) {
    const esperado = semArtigo.includes(e.sigla) ? '' : feminino.includes(e.sigla) ? 'a' : 'o';
    assert.equal(e.artigo, esperado, e.sigla);
  }
});

test('textos em NFC e sem espaços sobrando', () => {
  for (const e of ESTADOS) {
    for (const value of [e.nome, e.capital, ...e.gentilicos]) {
      assert.equal(value, value.normalize('NFC'));
      assert.equal(value, value.trim());
    }
  }
});
