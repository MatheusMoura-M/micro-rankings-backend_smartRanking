export interface iHistorico {
  vitorias?: number;
  derrotas?: number;
}

export interface iRankingResponse {
  jogador?: string;
  posicao?: number;
  pontuacao?: number;
  historicoPartidas?: iHistorico;
}
