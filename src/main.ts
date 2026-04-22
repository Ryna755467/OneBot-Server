import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';

async function bootstrap() {
  // 只允许本地连接的机器人服务
  const botServer = await NestFactory.create<NestExpressApplication>(AppModule);
  botServer.useWebSocketAdapter(new WsAdapter(botServer));
  await botServer.listen(process.env.BOT_SERVER_PORT ?? 3002, '127.0.0.1');

  // 允许公网访问的静态资源服务
  const fileServer =
    await NestFactory.create<NestExpressApplication>(AppModule);
  fileServer.useStaticAssets('public');
  await fileServer.listen(process.env.FILE_SERVER_PORT ?? 3009, '0.0.0.0');
}
bootstrap();
