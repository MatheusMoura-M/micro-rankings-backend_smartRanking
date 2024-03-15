import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import * as momentTimezone from 'moment-timezone';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { ClientProxySmartRanking } from 'src/proxyrmq/client-proxy';
import { EventoNome } from './evento-nome.enum';
import { iCategoria } from './interfaces/categoria.interface';
import { iDesafio } from './interfaces/desafio.interface';
import { iPartida } from './interfaces/partida.interface';
import {
  iHistorico,
  iRankingResponse,
} from './interfaces/ranking-response.interface';
import { Ranking } from './interfaces/ranking.schema';

@Injectable()
export class RankingsService {
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
    private clientProxySmartRanking: ClientProxySmartRanking,
  ) {}

  private logger = new Logger(RankingsService.name);

  private clientAdminBackend =
    this.clientProxySmartRanking.getClientProxyAdminBackendInstance();

  private clientDesafiosBackend =
    this.clientProxySmartRanking.getClientProxyDesafiosInstance();

  async processarPartida(idPartida: string, partida: iPartida): Promise<void> {
    try {
      const categoria: iCategoria = await lastValueFrom(
        this.clientAdminBackend.send('consultar-categorias', partida.categoria),
      );

      await Promise.all(
        partida.jogadores.map(async (jogador) => {
          const ranking = new this.desafioModel();

          ranking.categoria = partida.categoria;
          ranking.desafio = partida.desafio;
          ranking.partida = idPartida;
          ranking.jogador = jogador;

          if (jogador == partida.def) {
            const eventoFilter = categoria.eventos.filter(
              (evento) => evento.nome == EventoNome.VITORIA,
            );

            ranking.evento = EventoNome.VITORIA;
            ranking.operacao = eventoFilter[0].operacao;
            ranking.pontos = eventoFilter[0].valor;
          } else {
            const eventoFilter = categoria.eventos.filter(
              (evento) => evento.nome == EventoNome.DERROTA,
            );

            ranking.evento = EventoNome.DERROTA;
            ranking.operacao = eventoFilter[0].operacao;
            ranking.pontos = eventoFilter[0].valor;
          }

          this.logger.log(`ranking: ${JSON.stringify(ranking)}`);

          await ranking.save();
        }),
      );
    } catch (error) {
      this.logger.error(`error: ${error}`);

      throw new RpcException(error.message);
    }
  }

  async consultarRankings(
    idCategoria: string,
    dataRef: string,
  ): Promise<iRankingResponse[] | iRankingResponse> {
    try {
      if (!dataRef) {
        dataRef = momentTimezone()
          .tz('America/Sao_Paulo')
          .format('YYYY-MM-DD ');

        this.logger.log(`dataRef: ${dataRef}`);
      }

      const registrosRanking = await this.desafioModel
        .find({ categoria: idCategoria })
        // .where('categoria')
        // .equals(idCategoria)
        .exec();

      this.logger.log(`registrosRanking: ${JSON.stringify(registrosRanking)}`);

      const desafios: iDesafio[] = await lastValueFrom(
        this.clientDesafiosBackend.send('consultar-desafios-realizados', {
          idCategoria: idCategoria,
          dataRef: dataRef,
        }),
      );

      _.remove(registrosRanking, function (item) {
        return (
          desafios.filter((desafio) => desafio._id == item.desafio).length === 0
        );
      });

      this.logger.log(
        `registrosRankingNovo : ${JSON.stringify(registrosRanking)}`,
      );

      const resultado = _(registrosRanking)
        .groupBy('jogador')
        .map((items, key) => ({
          jogador: key,
          historico: _.countBy(items, 'evento'),
          pontos: _.sumBy(items, 'pontos'),
        }))
        .value();

      this.logger.log(`resultado : ${JSON.stringify(resultado)}`);

      const resultadoOrdenado = _.orderBy(resultado, 'pontos', 'desc');

      this.logger.log(
        `resultadoOrdenado: ${JSON.stringify(resultadoOrdenado)}`,
      );

      // const rankingResponseList: iRankingResponse[] = [];

      // resultadoOrdenado.map((item, i) => {
      //   const rankingResponse: iRankingResponse = {};

      //   rankingResponse.jogador = item.jogador;
      //   rankingResponse.posicao = i + 1;
      //   rankingResponse.pontuacao = item.pontos;

      //   const historico: iHistorico = {};

      //   historico.vitorias = item.historico.VITORIA
      //     ? item.historico.VITORIA
      //     : 0;
      //   historico.derrotas = item.historico.DERROTA
      //     ? item.historico.DERROTA
      //     : 0;

      //   rankingResponse.historicoPartidas = historico;

      //   rankingResponseList.push(rankingResponse);
      // });
      const rankingResponseList: iRankingResponse[] = resultadoOrdenado.map(
        (item, i) => ({
          jogador: item.jogador,
          posicao: i + 1,
          pontuacao: item.pontos,
          historicoPartidas: {
            vitorias: item.historico.VITORIA || 0,
            derrotas: item.historico.DERROTA || 0,
          },
        }),
      );

      return rankingResponseList;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);

      throw new RpcException(error.message);
    }
  }
}
