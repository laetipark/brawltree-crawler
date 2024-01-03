import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { CrawlerModule } from './crawler.module';
import { WorkersService } from './workers/services/workers.service';
import { isMainThread } from 'worker_threads';

async function bootstrap() {
  if (isMainThread) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      methods: 'GET, POST',
      credentials: true,
    });
    const configService = app.get(ConfigService);
    const port = configService.get<number>('HOST_PORT', 3000);

    await app.listen(port);

    const workerService = app.get(WorkersService);
    await workerService.startCrawling();

    return port;
  } else {
    const app = await NestFactory.create(CrawlerModule);

    const workerService = app.get(WorkersService);
    await workerService.startCrawling();
  }
}

bootstrap().then((port) => {
  Logger.log(
    `🌸 | Plant Brawl Tree Crawler ${port && `at ${port}`}`,
    'Brawl Tree',
  );
});
