import { Module, forwardRef } from '@nestjs/common';
import { NapCatGateway } from './gateway';
import { NapCatService } from './service';
import { BotModule } from '@bot/module';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [NapCatGateway, NapCatService],
  exports: [NapCatService],
})
export class NapCatModule {}
