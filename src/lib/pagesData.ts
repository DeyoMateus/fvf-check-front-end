// Dados de domínio para as páginas auxiliares do painel FVF Check

export interface Fabrica {
  id: string;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  especialidade: string;
  status: "ATIVA" | "EM_AUDITORIA" | "SUSPENSA";
  slaMedioHoras: number;
  rmaAbertos: number;
  taxaDefeito: number; // %
  lotesAtivos: number;
  contato: string;
  scoreQualidade: number; // 0-100
}

export interface LotePeca {
  id: string;
  codigo: string;
  descricao: string;
  material: string;
  fabrica: string;
  danfe: string;
  qtdPecas: number;
  qtdAveriadas: number;
  status: "EM_TRANSITO" | "EM_ESTOQUE" | "EM_MONTAGEM" | "ENCERRADO" | "RECALL";
  dataProducao: string;
  dataEntrega?: string;
  cidadeDestino: string;
}

export interface Montador {
  id: string;
  nome: string;
  equipe: string;
  cidade: string;
  uf: string;
  status: "EM_CAMPO" | "DISPONIVEL" | "FOLGA" | "TREINAMENTO";
  ticketsHoje: number;
  ticketsMes: number;
  taxaErro: number; // %
  nps: number; // 0-100
  especialidade: string;
  telefone: string;
  ultimaLocalizacao: string;
}

export interface RelatorioKpi {
  label: string;
  valor: string;
  delta: string;
  positivo: boolean;
}

export const FABRICAS_MOCK: Fabrica[] = [
  {
    id: "fab-01",
    nome: "Ind. Móveis Hannover",
    cnpj: "12.345.678/0001-90",
    cidade: "Bento Gonçalves",
    uf: "RS",
    especialidade: "MDF Ultra / Laca",
    status: "ATIVA",
    slaMedioHoras: 36,
    rmaAbertos: 4,
    taxaDefeito: 1.8,
    lotesAtivos: 12,
    contato: "qualidade@hannover.ind.br",
    scoreQualidade: 92,
  },
  {
    id: "fab-02",
    nome: "Planejados Serra Azul",
    cnpj: "98.765.432/0001-11",
    cidade: "Araucária",
    uf: "PR",
    especialidade: "Painéis ripados / Freijó",
    status: "ATIVA",
    slaMedioHoras: 42,
    rmaAbertos: 2,
    taxaDefeito: 2.4,
    lotesAtivos: 8,
    contato: "rma@serraazul.com.br",
    scoreQualidade: 87,
  },
  {
    id: "fab-03",
    nome: "Fábrica Concept Line",
    cnpj: "45.678.901/0001-22",
    cidade: "Jundiaí",
    uf: "SP",
    especialidade: "Laca acetinada / Ferragens",
    status: "EM_AUDITORIA",
    slaMedioHoras: 58,
    rmaAbertos: 7,
    taxaDefeito: 4.1,
    lotesAtivos: 5,
    contato: "suporte@conceptline.com.br",
    scoreQualidade: 71,
  },
  {
    id: "fab-04",
    nome: "MDF Sul Componentes",
    cnpj: "33.221.100/0001-55",
    cidade: "Caxias do Sul",
    uf: "RS",
    especialidade: "Fita de borda / Chapas",
    status: "ATIVA",
    slaMedioHoras: 28,
    rmaAbertos: 1,
    taxaDefeito: 0.9,
    lotesAtivos: 15,
    contato: "logistica@mdfsul.com.br",
    scoreQualidade: 96,
  },
  {
    id: "fab-05",
    nome: "Ferragens Atlas",
    cnpj: "77.888.999/0001-33",
    cidade: "Joinville",
    uf: "SC",
    especialidade: "Dobradiças / Corrediças / Minifix",
    status: "SUSPENSA",
    slaMedioHoras: 72,
    rmaAbertos: 11,
    taxaDefeito: 6.2,
    lotesAtivos: 0,
    contato: "qualidade@atlasferragens.com",
    scoreQualidade: 54,
  },
];

export const LOTES_MOCK: LotePeca[] = [
  {
    id: "lt-01",
    codigo: "L-FAB-09-2025-B12",
    descricao: "Kit porta de correr 1800x2400",
    material: "MDF Ultra 18mm — Carvalho Hanover",
    fabrica: "Ind. Móveis Hannover",
    danfe: "NF-e 45213",
    qtdPecas: 24,
    qtdAveriadas: 2,
    status: "EM_MONTAGEM",
    dataProducao: "2025-09-28",
    dataEntrega: "2025-10-12",
    cidadeDestino: "Barueri / SP",
  },
  {
    id: "lt-02",
    codigo: "L-FAB-09-2025-A07",
    descricao: "Prateleiras curvas 600x300",
    material: "MDF Branco TX 15mm",
    fabrica: "Fábrica Concept Line",
    danfe: "NF-e 45198",
    qtdPecas: 48,
    qtdAveriadas: 3,
    status: "EM_ESTOQUE",
    dataProducao: "2025-09-22",
    dataEntrega: "2025-10-08",
    cidadeDestino: "São Paulo / SP",
  },
  {
    id: "lt-03",
    codigo: "L-FAB-08-2025-D22",
    descricao: "Painel ripado 2500x1200",
    material: "MDF Freijó 25mm",
    fabrica: "Planejados Serra Azul",
    danfe: "NF-e 45182",
    qtdPecas: 12,
    qtdAveriadas: 1,
    status: "EM_MONTAGEM",
    dataProducao: "2025-08-30",
    dataEntrega: "2025-10-10",
    cidadeDestino: "Praia Grande / SP",
  },
  {
    id: "lt-04",
    codigo: "L-FAB-08-2025-C04",
    descricao: "Mesa diretoria laca preta",
    material: "Laca acetinada preta",
    fabrica: "Fábrica Concept Line",
    danfe: "NF-e 45144",
    qtdPecas: 6,
    qtdAveriadas: 1,
    status: "EM_TRANSITO",
    dataProducao: "2025-08-25",
    cidadeDestino: "São Paulo / SP",
  },
  {
    id: "lt-05",
    codigo: "L-FAB-08-2025-B18",
    descricao: "Trilhos deslizantes anodizados",
    material: "Alumínio anodizado",
    fabrica: "Ferragens Atlas",
    danfe: "NF-e 45099",
    qtdPecas: 80,
    qtdAveriadas: 5,
    status: "RECALL",
    dataProducao: "2025-08-18",
    dataEntrega: "2025-09-30",
    cidadeDestino: "São Paulo / SP",
  },
  {
    id: "lt-06",
    codigo: "L-FAB-07-2025-A31",
    descricao: "Kit minifix M6 + cavilhas",
    material: "Aço zamak M6",
    fabrica: "Ferragens Atlas",
    danfe: "NF-e 45021",
    qtdPecas: 500,
    qtdAveriadas: 12,
    status: "EM_ESTOQUE",
    dataProducao: "2025-07-28",
    dataEntrega: "2025-09-15",
    cidadeDestino: "São Paulo / SP",
  },
  {
    id: "lt-07",
    codigo: "L-FAB-07-2025-C09",
    descricao: "Chapas MDF Branco 15mm",
    material: "MDF Branco 15mm",
    fabrica: "MDF Sul Componentes",
    danfe: "NF-e 44872",
    qtdPecas: 120,
    qtdAveriadas: 1,
    status: "ENCERRADO",
    dataProducao: "2025-07-10",
    dataEntrega: "2025-09-20",
    cidadeDestino: "São Paulo / SP",
  },
  {
    id: "lt-08",
    codigo: "L-FAB-06-2025-E02",
    descricao: "Fita de borda PVC 0.4mm",
    material: "PVC 0.4mm — ref. 2104",
    fabrica: "MDF Sul Componentes",
    danfe: "NF-e 44811",
    qtdPecas: 2000,
    qtdAveriadas: 40,
    status: "ENCERRADO",
    dataProducao: "2025-06-15",
    dataEntrega: "2025-08-01",
    cidadeDestino: "Campinas / SP",
  },
];

export const MONTADORES_MOCK: Montador[] = [
  {
    id: "mt-01",
    nome: "Ricardo Alves",
    equipe: "SP-1 Norte",
    cidade: "Guarulhos",
    uf: "SP",
    status: "EM_CAMPO",
    ticketsHoje: 3,
    ticketsMes: 42,
    taxaErro: 1.2,
    nps: 94,
    especialidade: "Portas de correr / Ripados",
    telefone: "(11) 98765-4321",
    ultimaLocalizacao: "Alphaville, Barueri",
  },
  {
    id: "mt-02",
    nome: "Juliana Costa",
    equipe: "SP-2 Centro",
    cidade: "São Paulo",
    uf: "SP",
    status: "EM_CAMPO",
    ticketsHoje: 2,
    ticketsMes: 38,
    taxaErro: 0.8,
    nps: 97,
    especialidade: "Cozinhas planejadas",
    telefone: "(11) 97654-3210",
    ultimaLocalizacao: "Moema, SP",
  },
  {
    id: "mt-03",
    nome: "Fernando Dias",
    equipe: "SP-2 Centro",
    cidade: "São Paulo",
    uf: "SP",
    status: "DISPONIVEL",
    ticketsHoje: 0,
    ticketsMes: 31,
    taxaErro: 2.1,
    nps: 88,
    especialidade: "Escritórios / Laca",
    telefone: "(11) 96543-2109",
    ultimaLocalizacao: "Base Berrini",
  },
  {
    id: "mt-04",
    nome: "Marcos Vinícius",
    equipe: "Litoral",
    cidade: "Santos",
    uf: "SP",
    status: "EM_CAMPO",
    ticketsHoje: 1,
    ticketsMes: 27,
    taxaErro: 3.4,
    nps: 81,
    especialidade: "Residencial completo",
    telefone: "(13) 95432-1098",
    ultimaLocalizacao: "Praia Grande",
  },
  {
    id: "mt-05",
    nome: "Patrícia Nogueira",
    equipe: "Campinas",
    cidade: "Campinas",
    uf: "SP",
    status: "TREINAMENTO",
    ticketsHoje: 0,
    ticketsMes: 12,
    taxaErro: 1.5,
    nps: 90,
    especialidade: "Ferragens e regulagem",
    telefone: "(19) 94321-0987",
    ultimaLocalizacao: "CD Campinas",
  },
  {
    id: "mt-06",
    nome: "André Souza",
    equipe: "SP-1 Norte",
    cidade: "São Paulo",
    uf: "SP",
    status: "FOLGA",
    ticketsHoje: 0,
    ticketsMes: 35,
    taxaErro: 1.0,
    nps: 92,
    especialidade: "Closets e dormitórios",
    telefone: "(11) 93210-9876",
    ultimaLocalizacao: "—",
  },
];

export const RELATORIO_KPIS: RelatorioKpi[] = [
  { label: "Tickets no mês", valor: "186", delta: "+12%", positivo: false },
  { label: "Tempo médio de triagem", valor: "2,4h", delta: "-18%", positivo: true },
  { label: "Taxa de reabertura", valor: "4,1%", delta: "-0,6pp", positivo: true },
  { label: "NPS pós-montagem", valor: "91", delta: "+3", positivo: true },
  { label: "RMA aceitos fábrica", valor: "78%", delta: "+5pp", positivo: true },
  { label: "Custo médio sinistro", valor: "R$ 412", delta: "-8%", positivo: true },
];

export const RELATORIO_MENSAL = [
  { mes: "Mai", transporte: 22, fabrica: 18, montagem: 14 },
  { mes: "Jun", transporte: 28, fabrica: 21, montagem: 16 },
  { mes: "Jul", transporte: 19, fabrica: 25, montagem: 12 },
  { mes: "Ago", transporte: 31, fabrica: 17, montagem: 19 },
  { mes: "Set", transporte: 24, fabrica: 22, montagem: 15 },
  { mes: "Out", transporte: 27, fabrica: 20, montagem: 18 },
];

export const RELATORIO_TOP_DEFEITOS = [
  { nome: "Fita de borda soltando", qtd: 34, cat: "FABRICA" as const },
  { nome: "Canto esmagado (transporte)", qtd: 29, cat: "TRANSPORTE" as const },
  { nome: "Dobradiça desregulada", qtd: 21, cat: "MONTAGEM" as const },
  { nome: "Arranhões na laca", qtd: 18, cat: "TRANSPORTE" as const },
  { nome: "Parafuso minifix solto", qtd: 15, cat: "MONTAGEM" as const },
  { nome: "Dimensões fora do projeto", qtd: 11, cat: "FABRICA" as const },
];
