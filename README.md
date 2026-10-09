# Quiz das Capitais — aprenda os estados e capitais do Brasil brincando (HTML + JavaScript)

Um quiz colorido para crianças (e para adultos que esqueceram a matéria) aprenderem as 27 unidades da federação: capitais, siglas, regiões e gentílicos. Funciona no celular, no tablet e no computador, sem cadastro.

**Acesse online:** https://micdog22.github.io/quiz-capitais/

## Recursos
- Cinco desafios: estado → capital, capital → estado, sigla → estado, estado → região e estado → gentílico.
- Múltipla escolha com 4 alternativas (uma das erradas costuma ser da mesma região, para dar aquele frio na barriga) ou resposta digitada, que ignora acentos, maiúsculas e hífens: “Sao Paulo” vale.
- Rodadas de 10 perguntas ou com todas as 27, sem repetir estado na mesma rodada.
- Cronômetro opcional de 15 segundos por pergunta.
- Placar, sequência de acertos, estrelas no final e lista dos erros para revisar, com um botão para treinar só o que errou.
- Recorde de cada desafio guardado no navegador.
- Modo estudo: tabela com sigla, estado, capital, região e gentílico, com filtro por região.
- Botões grandes, atalhos de teclado (1 a 4 para escolher, Enter para continuar) e tema claro e escuro.

## Como usar
1. Em **Jogar**, escolha o desafio, o jeito de responder e o tamanho da rodada.
2. Clique em **Começar!** e responda. Depois de cada resposta aparece a resposta certa e uma frase para fixar (“A capital do Acre é Rio Branco.”).
3. No fim, veja as estrelas, revise os erros e, se quiser, jogue uma rodada só com eles.
4. Em **Modo estudo**, consulte a tabela completa antes ou depois de jogar.

## Os dados
São 26 estados e o Distrito Federal: Norte (7), Nordeste (9), Centro-Oeste (3 estados e o DF), Sudeste (4) e Sul (3). Três estados têm dois gentílicos aceitos: capixaba ou espírito-santense (ES), potiguar ou norte-rio-grandense (RN) e gaúcho ou sul-rio-grandense (RS). Nas respostas digitadas também vale o feminino (baiana, gaúcha).

As perguntas usam a preposição certa de cada nome (“do Acre”, “da Bahia”, “de Pernambuco”) e diferenciam estado e cidade quando os nomes são iguais (“a capital do estado de São Paulo é a cidade de São Paulo”).

## Como rodar localmente
```bash
python3 -m http.server 8000
```
Na pasta do projeto, rode o comando acima e abra http://localhost:8000 (os módulos ES não carregam via `file://`).

## Testes
```bash
npm test
```
(ou `node --test`). Os testes conferem os 27 registros contra uma tabela de referência, a quantidade de estados por região, a geração das perguntas (resposta certa sempre presente, 3 distratores diferentes, sem repetir estado na rodada) e a correção das respostas digitadas.

## Contribuindo
Issues e pull requests são bem-vindos. Ideias de novos desafios também.

## Licença
MIT — veja [LICENSE](LICENSE).
