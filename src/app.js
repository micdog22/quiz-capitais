import { ESTADOS, REGIOES } from './estados.js';
import {
  MODES, SECONDS_PER_QUESTION, bestKey, buildRound, checkAnswer, emptyScore, endMessage, parseBests,
  registerAnswer, starsFor, updateBest,
} from './quiz.js';

const CONFIG_KEY = 'quiz-capitais:config';
const BESTS_KEY = 'quiz-capitais:recordes';
const PRAISE = ['Acertou!', 'Muito bem!', 'Isso aí!', 'Mandou bem!', 'Show de bola!', 'Perfeito!'];
const OOPS = ['Quase!', 'Ops!', 'Não foi dessa vez.'];
const STREAK_MESSAGES = { 3: '3 seguidas! 🔥', 5: '5 seguidas! Você está pegando fogo! 🔥', 10: '10 seguidas! Incrível! 🏆', 20: '20 seguidas! Lenda! 👑' };

const $ = (id) => document.getElementById(id);
const els = {
  tabs: [$('aba-jogar'), $('aba-estudo')],
  panels: [$('painel-jogar'), $('painel-estudo')],
  config: $('config'),
  modes: $('modos'),
  timerCheck: $('cronometro'),
  best: $('melhor'),
  game: $('jogo'),
  progress: $('progresso'),
  progressBar: $('barra-progresso'),
  correct: $('acertos'),
  streak: $('sequencia'),
  timerArea: $('cronometro-area'),
  timerBar: $('barra-tempo'),
  timeLeft: $('tempo-restante'),
  question: $('pergunta'),
  options: $('alternativas'),
  typedForm: $('form-digitar'),
  typedInput: $('resposta-digitada'),
  feedback: $('retorno'),
  next: $('proxima'),
  quit: $('sair'),
  end: $('fim'),
  stars: $('estrelas'),
  endTitle: $('fim-titulo'),
  endMessage: $('fim-mensagem'),
  endDetails: $('fim-detalhes'),
  endRecord: $('fim-recorde'),
  review: $('revisao'),
  again: $('de-novo'),
  trainErrors: $('treinar-erros'),
  otherChallenge: $('outro-desafio'),
  regionFilter: $('filtro-regiao'),
  studyStatus: $('estudo-status'),
  studyTable: $('tabela-estados'),
};

let config = { mode: 'estado-capital', answerType: 'escolha', size: 10, timer: false };
let bests = {};
let round = null;
let timerId = null;
let studyRegion = '';

const random = () => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] / 4294967296;
};
const pick = (list) => list[Math.floor(random() * list.length)];
const regionClass = (regiao) => `r-${regiao.toLowerCase()}`;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem localStorage: o jogo funciona, só não guarda recordes.
  }
}

// ---------- configuração ----------

function renderModeTiles() {
  Object.entries(MODES).forEach(([id, mode], index) => {
    const label = el('label', `mode-tile tone-${index}`);
    const input = el('input');
    input.type = 'radio';
    input.name = 'modo';
    input.value = id;
    const tile = el('span', 'tile');
    tile.append(el('span', 'tile-icon', mode.icon), el('strong', '', mode.label), el('small', '', mode.hint));
    label.append(input, tile);
    els.modes.append(label);
  });
}

function loadConfig() {
  try {
    const saved = JSON.parse(storageGet(CONFIG_KEY) || '{}');
    if (MODES[saved.mode]) config.mode = saved.mode;
    if (['escolha', 'digitar'].includes(saved.answerType)) config.answerType = saved.answerType;
    if ([10, 27].includes(saved.size)) config.size = saved.size;
    config.timer = saved.timer === true;
  } catch {
    // Configuração inválida: usa a padrão.
  }
  bests = parseBests(storageGet(BESTS_KEY) || '{}');
  const form = els.config.elements;
  form.modo.value = config.mode;
  form.resposta.value = config.answerType;
  form.tamanho.value = String(config.size);
  els.timerCheck.checked = config.timer;
}

function readConfig() {
  const form = els.config.elements;
  config = {
    mode: form.modo.value,
    answerType: form.resposta.value,
    size: Number(form.tamanho.value),
    timer: els.timerCheck.checked,
  };
  storageSet(CONFIG_KEY, JSON.stringify(config));
  showBest();
}

function showBest() {
  const best = bests[bestKey(config)];
  els.best.textContent = best
    ? `🏆 Seu recorde neste desafio: ${best.correct} de ${best.total} (maior sequência: ${best.bestStreak}).`
    : 'Ainda não há recorde neste desafio. Bora jogar?';
}

// ---------- rodada ----------

const current = () => round.questions[round.index];

function show(section) {
  for (const node of [els.config, els.game, els.end]) node.hidden = node !== section;
}

function startRound(siglas = null) {
  readConfig();
  round = {
    questions: buildRound({ mode: config.mode, size: config.size, rng: random, siglas }),
    index: 0,
    score: emptyScore(),
    mistakes: [],
    review: Boolean(siglas),
    answered: false,
    deadline: 0,
  };
  show(els.game);
  showQuestion();
}

function updateScore() {
  els.correct.textContent = String(round.score.correct);
  els.streak.textContent = String(round.score.streak);
}

function showQuestion() {
  const question = current();
  const total = round.questions.length;
  round.answered = false;
  els.progress.textContent = `Pergunta ${round.index + 1} de ${total}`;
  els.progressBar.style.width = `${(round.index / total) * 100}%`;
  els.question.textContent = question.prompt;
  els.feedback.replaceChildren();
  els.feedback.className = 'feedback';
  els.next.hidden = true;
  updateScore();

  const choice = config.answerType === 'escolha';
  els.options.hidden = !choice;
  els.typedForm.hidden = choice;
  if (choice) {
    const buttons = question.options.map((option, i) => {
      const button = el('button', 'option');
      button.type = 'button';
      button.dataset.value = option;
      button.append(el('span', 'option-key', String(i + 1)), el('span', 'option-label', option));
      button.addEventListener('click', () => answer(option));
      return button;
    });
    els.options.replaceChildren(...buttons);
    els.question.focus();
  } else {
    els.typedInput.value = '';
    els.typedInput.disabled = false;
    els.typedForm.querySelector('button').disabled = false;
    els.typedInput.focus();
  }
  startTimer();
}

function feedbackLine(className, ...parts) {
  const p = el('p', className);
  for (const part of parts) p.append(part);
  return p;
}

function answer(given, timeUp = false) {
  if (!round || round.answered) return;
  const question = current();
  const correct = !timeUp && checkAnswer(question, given);
  round.answered = true;
  stopTimer();
  round.score = registerAnswer(round.score, correct);
  if (!correct) round.mistakes.push({ sigla: question.sigla, prompt: question.prompt, given: timeUp ? null : given, answer: question.answer });

  for (const button of els.options.querySelectorAll('.option')) {
    button.disabled = true;
    if (button.dataset.value === question.answer) button.classList.add('right');
    else if (button.dataset.value === given) button.classList.add('wrong');
  }
  els.typedInput.disabled = true;
  els.typedForm.querySelector('button').disabled = true;

  const lines = [];
  if (correct) {
    lines.push(feedbackLine('fb-title', `✅ ${pick(PRAISE)}`));
    const streakMessage = STREAK_MESSAGES[round.score.streak];
    if (streakMessage) lines.push(feedbackLine('fb-streak', streakMessage));
  } else {
    const strong = el('strong', '', question.answer);
    lines.push(feedbackLine('fb-title', `${timeUp ? '⏰ Tempo esgotado!' : `❌ ${pick(OOPS)}`} A resposta certa é `, strong, '.'));
    if (!timeUp && config.answerType === 'digitar') lines.push(feedbackLine('fb-given', `Você escreveu: ${given}`));
  }
  lines.push(feedbackLine('fb-fact', question.fact));
  els.feedback.className = `feedback ${correct ? 'is-right' : 'is-wrong'}`;
  els.feedback.replaceChildren(...lines);
  updateScore();

  const last = round.index === round.questions.length - 1;
  els.next.textContent = last ? 'Ver resultado 🏁' : 'Próxima ➜';
  els.next.hidden = false;
  els.next.focus();
}

function nextQuestion() {
  if (!round) return;
  round.index += 1;
  if (round.index >= round.questions.length) endRound();
  else showQuestion();
}

function endRound() {
  stopTimer();
  const { correct, bestStreak } = round.score;
  const total = round.questions.length;
  const stars = starsFor(correct, total);
  els.progressBar.style.width = '100%';
  els.stars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  els.endTitle.textContent = `Você acertou ${correct} de ${total}!`;
  els.endMessage.textContent = endMessage(stars);
  els.endDetails.textContent = `Maior sequência de acertos: ${bestStreak}.`;

  if (round.review) {
    els.endRecord.textContent = 'Rodada de revisão: ela não conta para o recorde.';
  } else {
    const key = bestKey(config);
    const outcome = updateBest(bests, key, { correct, total, bestStreak, date: new Date().toISOString() });
    bests = outcome.bests;
    storageSet(BESTS_KEY, JSON.stringify(bests));
    const best = bests[key];
    if (outcome.isRecord) els.endRecord.textContent = '🏆 Novo recorde neste desafio!';
    else if (outcome.first) els.endRecord.textContent = '🏁 Primeiro resultado registrado neste desafio.';
    else els.endRecord.textContent = `🏆 Seu recorde neste desafio continua ${best.correct} de ${best.total}.`;
  }

  const review = [];
  if (round.mistakes.length) {
    review.push(el('h3', '', 'Para revisar'));
    const list = el('ul', 'mistakes');
    for (const mistake of round.mistakes) {
      const item = el('li');
      item.append(el('span', 'm-prompt', mistake.prompt));
      item.append(el('span', 'm-given', mistake.given === null ? 'Tempo esgotado' : `Sua resposta: ${mistake.given}`));
      const right = el('span', 'm-answer', 'Resposta certa: ');
      right.append(el('strong', '', mistake.answer));
      item.append(right);
      list.append(item);
    }
    review.push(list);
  } else {
    review.push(el('p', 'perfect', 'Nenhum erro nesta rodada! 🎉'));
  }
  els.review.replaceChildren(...review);
  els.trainErrors.hidden = round.mistakes.length === 0;
  show(els.end);
  els.endTitle.focus();
}

function quitRound() {
  stopTimer();
  round = null;
  show(els.config);
  showBest();
}

// ---------- cronômetro ----------

function startTimer() {
  stopTimer();
  els.timerArea.hidden = !config.timer;
  if (!config.timer) return;
  round.deadline = performance.now() + SECONDS_PER_QUESTION * 1000;
  tickTimer();
  timerId = setInterval(tickTimer, 100);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function tickTimer() {
  if (!round || round.answered) return;
  const left = Math.max(0, round.deadline - performance.now());
  els.timerBar.style.width = `${(left / (SECONDS_PER_QUESTION * 1000)) * 100}%`;
  els.timeLeft.textContent = `${Math.ceil(left / 1000)} s`;
  els.timerArea.classList.toggle('hurry', left <= 5000);
  if (left <= 0) answer(null, true);
}

// ---------- modo estudo ----------

function renderRegionFilter() {
  const chips = ['', ...REGIOES].map((regiao) => {
    const chip = el('button', regiao ? `chip ${regionClass(regiao)}` : 'chip', regiao || 'Todas');
    chip.type = 'button';
    chip.dataset.regiao = regiao;
    return chip;
  });
  els.regionFilter.replaceChildren(...chips);
  els.regionFilter.addEventListener('click', (event) => {
    const chip = event.target.closest('button.chip');
    if (!chip) return;
    studyRegion = chip.dataset.regiao;
    renderStudy();
  });
}

function studyStatus(list) {
  if (!studyRegion) return '27 unidades da federação: 26 estados e o Distrito Federal.';
  const hasDF = list.some((e) => e.sigla === 'DF');
  const states = list.length - (hasDF ? 1 : 0);
  return `Região ${studyRegion}: ${states} ${states === 1 ? 'estado' : 'estados'}${hasDF ? ' e o Distrito Federal' : ''}.`;
}

function renderStudy() {
  const collator = new Intl.Collator('pt-BR');
  const list = ESTADOS
    .filter((e) => !studyRegion || e.regiao === studyRegion)
    .sort((a, b) => collator.compare(a.nome, b.nome));
  const rows = list.map((e) => {
    const tr = el('tr');
    const name = el('th', '', e.nome);
    name.scope = 'row';
    const capital = el('td', '', e.capital);
    const region = el('td');
    region.append(el('span', `regiao ${regionClass(e.regiao)}`, e.regiao));
    const gentilico = el('td', '', e.gentilicos.join(' ou '));
    // Rótulos usados quando a tabela vira lista no celular.
    capital.dataset.label = 'Capital';
    region.dataset.label = 'Região';
    gentilico.dataset.label = 'Gentílico';
    tr.append(el('td', 'sigla', e.sigla), name, capital, region, gentilico);
    return tr;
  });
  els.studyTable.replaceChildren(...rows);
  for (const chip of els.regionFilter.children) chip.setAttribute('aria-pressed', String(chip.dataset.regiao === studyRegion));
  els.studyStatus.textContent = studyStatus(list);
}

// ---------- abas ----------

function selectTab(index, focus = false) {
  els.tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    els.panels[i].hidden = !selected;
  });
  if (focus) els.tabs[index].focus();
}

// ---------- eventos ----------

function bindEvents() {
  els.tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        selectTab((i + (event.key === 'ArrowRight' ? 1 : -1) + els.tabs.length) % els.tabs.length, true);
      }
    });
  });
  els.config.addEventListener('change', readConfig);
  els.config.addEventListener('submit', (event) => {
    event.preventDefault();
    startRound();
  });
  els.typedForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!els.typedInput.value.trim()) {
      els.feedback.className = 'feedback';
      els.feedback.replaceChildren(feedbackLine('fb-given', 'Escreva uma resposta antes de enviar. 😉'));
      els.typedInput.focus();
      return;
    }
    answer(els.typedInput.value.trim());
  });
  els.next.addEventListener('click', nextQuestion);
  els.quit.addEventListener('click', quitRound);
  els.again.addEventListener('click', () => startRound());
  els.trainErrors.addEventListener('click', () => startRound(round.mistakes.map((m) => m.sigla)));
  els.otherChallenge.addEventListener('click', quitRound);

  document.addEventListener('keydown', (event) => {
    if (els.game.hidden || !round || round.answered || config.answerType !== 'escolha') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const index = ['1', '2', '3', '4'].indexOf(event.key);
    if (index === -1) return;
    const button = els.options.querySelectorAll('.option')[index];
    if (button) {
      event.preventDefault();
      button.click();
    }
  });
}

function init() {
  renderModeTiles();
  loadConfig();
  showBest();
  renderRegionFilter();
  renderStudy();
  bindEvents();
}

init();
