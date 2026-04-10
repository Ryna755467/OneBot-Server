import { Module } from '@nestjs/common';
import { NapCatModule } from './modules/napcat/module';
import { BotModule } from './modules/bot/module';

@Module({
  imports: [NapCatModule, BotModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
