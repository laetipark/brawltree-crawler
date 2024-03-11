import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(SchedulerModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SCHEDULER_PORT', 3000);

  await app.listen(port);
}

bootstrap().then(() => {
  Logger.log(`🌸 | Plant Brawl Tree Crawler`, 'Brawl Tree');
});
