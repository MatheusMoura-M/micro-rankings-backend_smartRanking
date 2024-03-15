import { Document } from 'mongoose';

export interface iPartida extends Document {
  categoria: string;
  desafio: string;
  jogadores: string[];
  def: string;
  resultado: Array<iResultado>;
}

export interface iResultado {
  set: string;
}
