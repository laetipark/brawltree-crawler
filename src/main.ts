import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import WorkersService from './workers/services/workers.service';
import { isMainThread } from 'worker_threads';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET, POST',
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('HOST_PORT', 3000);

  if (isMainThread) {
    await app.listen(port);
  }

  const workerService = app.get(WorkersService);
  await workerService.startCrawling();

  return port;
}

bootstrap().then((port) => {
  Logger.log(
    `🌸 | Plant Brawl Tree Crawler ${port && `at ${port}`}`,
    'Brawl Tree',
  );
});
