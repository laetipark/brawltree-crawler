import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET, POST',
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('HOST_PORT', 3000);

  await app.listen(port);

  return port;
}

bootstrap().then((port) => {
  Logger.log(`🌸 | Plant Brawl Tree API ${port && `at ${port}`}`, 'Brawl Tree');
});
