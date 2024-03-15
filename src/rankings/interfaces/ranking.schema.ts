import {
  Prop,
  Schema as SchemaDecorator,
  SchemaFactory,
} from '@nestjs/mongoose';
import { Document, Schema } from 'mongoose';

@SchemaDecorator({ timestamps: true, collection: 'rankings' })
export class Ranking extends Document {
  @Prop({ type: Schema.Types.ObjectId })
  desafio: string;

  @Prop({ type: Schema.Types.ObjectId })
  jogador: string;

  @Prop({ type: Schema.Types.ObjectId })
  partida: string;

  @Prop({ type: Schema.Types.ObjectId })
  categoria: string;

  @Prop()
  evento: string;

  @Prop()
  operacao: string;

  @Prop()
  pontos: number;
}

export const RankingSchema = SchemaFactory.createForClass(Ranking);
