// As 27 unidades da federação: 26 estados e o Distrito Federal.
// `artigo` é o artigo usado antes do nome ("do Acre", "da Bahia", "de Pernambuco").
// O primeiro gentílico é o principal; os outros também são aceitos como resposta.

export const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

export const ESTADOS = [
  { sigla: 'AC', nome: 'Acre', capital: 'Rio Branco', regiao: 'Norte', gentilicos: ['acriano'], artigo: 'o' },
  { sigla: 'AL', nome: 'Alagoas', capital: 'Maceió', regiao: 'Nordeste', gentilicos: ['alagoano'], artigo: '' },
  { sigla: 'AP', nome: 'Amapá', capital: 'Macapá', regiao: 'Norte', gentilicos: ['amapaense'], artigo: 'o' },
  { sigla: 'AM', nome: 'Amazonas', capital: 'Manaus', regiao: 'Norte', gentilicos: ['amazonense'], artigo: 'o' },
  { sigla: 'BA', nome: 'Bahia', capital: 'Salvador', regiao: 'Nordeste', gentilicos: ['baiano'], artigo: 'a' },
  { sigla: 'CE', nome: 'Ceará', capital: 'Fortaleza', regiao: 'Nordeste', gentilicos: ['cearense'], artigo: 'o' },
  { sigla: 'DF', nome: 'Distrito Federal', capital: 'Brasília', regiao: 'Centro-Oeste', gentilicos: ['brasiliense'], artigo: 'o' },
  { sigla: 'ES', nome: 'Espírito Santo', capital: 'Vitória', regiao: 'Sudeste', gentilicos: ['capixaba', 'espírito-santense'], artigo: 'o' },
  { sigla: 'GO', nome: 'Goiás', capital: 'Goiânia', regiao: 'Centro-Oeste', gentilicos: ['goiano'], artigo: '' },
  { sigla: 'MA', nome: 'Maranhão', capital: 'São Luís', regiao: 'Nordeste', gentilicos: ['maranhense'], artigo: 'o' },
  { sigla: 'MT', nome: 'Mato Grosso', capital: 'Cuiabá', regiao: 'Centro-Oeste', gentilicos: ['mato-grossense'], artigo: '' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul', capital: 'Campo Grande', regiao: 'Centro-Oeste', gentilicos: ['sul-mato-grossense'], artigo: '' },
  { sigla: 'MG', nome: 'Minas Gerais', capital: 'Belo Horizonte', regiao: 'Sudeste', gentilicos: ['mineiro'], artigo: '' },
  { sigla: 'PA', nome: 'Pará', capital: 'Belém', regiao: 'Norte', gentilicos: ['paraense'], artigo: 'o' },
  { sigla: 'PB', nome: 'Paraíba', capital: 'João Pessoa', regiao: 'Nordeste', gentilicos: ['paraibano'], artigo: 'a' },
  { sigla: 'PR', nome: 'Paraná', capital: 'Curitiba', regiao: 'Sul', gentilicos: ['paranaense'], artigo: 'o' },
  { sigla: 'PE', nome: 'Pernambuco', capital: 'Recife', regiao: 'Nordeste', gentilicos: ['pernambucano'], artigo: '' },
  { sigla: 'PI', nome: 'Piauí', capital: 'Teresina', regiao: 'Nordeste', gentilicos: ['piauiense'], artigo: 'o' },
  { sigla: 'RJ', nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', regiao: 'Sudeste', gentilicos: ['fluminense'], artigo: 'o' },
  { sigla: 'RN', nome: 'Rio Grande do Norte', capital: 'Natal', regiao: 'Nordeste', gentilicos: ['potiguar', 'norte-rio-grandense'], artigo: 'o' },
  { sigla: 'RS', nome: 'Rio Grande do Sul', capital: 'Porto Alegre', regiao: 'Sul', gentilicos: ['gaúcho', 'sul-rio-grandense'], artigo: 'o' },
  { sigla: 'RO', nome: 'Rondônia', capital: 'Porto Velho', regiao: 'Norte', gentilicos: ['rondoniense'], artigo: '' },
  { sigla: 'RR', nome: 'Roraima', capital: 'Boa Vista', regiao: 'Norte', gentilicos: ['roraimense'], artigo: '' },
  { sigla: 'SC', nome: 'Santa Catarina', capital: 'Florianópolis', regiao: 'Sul', gentilicos: ['catarinense'], artigo: '' },
  { sigla: 'SP', nome: 'São Paulo', capital: 'São Paulo', regiao: 'Sudeste', gentilicos: ['paulista'], artigo: '' },
  { sigla: 'SE', nome: 'Sergipe', capital: 'Aracaju', regiao: 'Nordeste', gentilicos: ['sergipano'], artigo: '' },
  { sigla: 'TO', nome: 'Tocantins', capital: 'Palmas', regiao: 'Norte', gentilicos: ['tocantinense'], artigo: 'o' },
];
