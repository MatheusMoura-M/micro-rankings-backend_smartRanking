import { Module } from '@nestjs/common';
import { RankingsModule } from './rankings/rankings.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://rankings_sr:duOm4qSsiAjRyAIz@microrankingcluster.zq6y3hn.mongodb.net/srRankingsBackend?retryWrites=true&w=majority&appName=microRankingCluster',
    ),
    ConfigModule.forRoot({ isGlobal: true }),
    RankingsModule,
    ProxyRMQModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
