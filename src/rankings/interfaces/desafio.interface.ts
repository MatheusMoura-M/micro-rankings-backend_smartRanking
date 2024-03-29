import { DesafioStatus } from './desafio-status.enum';

export interface iDesafio {
  _id: string;
  dataHoraDesafio: Date;
  status: DesafioStatus;
  dataHoraSolicitacao: Date;
  dataHoraResposta?: Date;
  solicitante: string;
  categoria: string;
  partida?: string;
  jogadores: string[];
}
