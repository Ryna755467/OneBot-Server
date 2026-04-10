import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  Logger.log(`ws://localhost:${PORT}`, 'Bootstrap');
}
bootstrap();
