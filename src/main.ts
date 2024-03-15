import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import * as momentTimezone from 'moment-timezone';

const logger = new Logger('Main');
const configService = new ConfigService();

async function bootstrap() {
  const RABBITMQ_USER = configService.get<string>('RABBITMQ_USER');
  const RABBITMQ_PASS = configService.get<string>('RABBITMQ_PASS');
  const RABBITMQ_URL = configService.get<string>('RABBITMQ_URL');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_URL}`],
        noAck: false,
        queue: 'rankings',
      },
    },
  );

  Date.prototype.toJSON = function (): any {
    return momentTimezone(this)
      .tz('America/Sao_Paulo')
      .format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  await app.listen().then(() => logger.log('Micro-rankings is listening'));
}
bootstrap();
