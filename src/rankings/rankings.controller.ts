import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { iPartida } from './interfaces/partida.interface';
import { RankingsService } from './rankings.service';
import { iRankingResponse } from './interfaces/ranking-response.interface';

const ackErrors: string[] = ['E11000'];

@Controller()
export class RankingsController {
  private logger = new Logger(RankingsController.name);

  constructor(private readonly rankingService: RankingsService) {}

  @EventPattern('processar-partida')
  async processarPartida(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`data: ${JSON.stringify(data)}`);

      const idPartida: string = data.idPartida;
      const partida: iPartida = data.partida;

      await this.rankingService.processarPartida(idPartida, partida);

      await channel.ack(originalMsg);
    } catch (error) {
      const filterAckError = ackErrors.filter((ackError) =>
        error.message.includes(ackError),
      );

      if (filterAckError.length > 0) {
        await channel.ack(originalMsg);
      }
    }
  }

  @MessagePattern('consultar-rankings')
  async consultarRankings(
    @Payload() data: any,
    @Ctx() context: RmqContext,
  ): Promise<iRankingResponse[] | iRankingResponse> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const { idCategoria, dataRef } = data;

      return this.rankingService.consultarRankings(idCategoria, dataRef);
    } finally {
      await channel.ack(originalMsg);
    }
  }
}
