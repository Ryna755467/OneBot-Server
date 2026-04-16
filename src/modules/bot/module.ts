import { Module, forwardRef } from '@nestjs/common';
import { BotService } from './service';
import { NapCatModule } from '@napcat/module';

@Module({
  imports: [forwardRef(() => NapCatModule)],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
