import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NapCatModule } from './modules/napcat/module';
import { BotModule } from './modules/bot/module';
import { SqlModule } from './modules/sql/module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    NapCatModule,
    BotModule,
    SqlModule,
  ],
})
export class AppModule {}
