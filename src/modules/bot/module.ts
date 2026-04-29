import { Module, forwardRef } from '@nestjs/common';
import { NapCatModule } from '@napcat/module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NapCatMessage, BotConversation } from '@sql/entities';
import { ConversationManager, MessageManager } from './managers';
import { HelpPlugin, ChatPlugin, RconPlugin, UploadPlugin } from './plugins';
import { BotService } from './service';

@Module({
  imports: [
    forwardRef(() => NapCatModule),
    TypeOrmModule.forFeature([NapCatMessage, BotConversation]),
  ],
  providers: [
    ConversationManager,
    MessageManager,
    UploadPlugin,
    HelpPlugin,
    ChatPlugin,
    RconPlugin,
    BotService,
  ],
  exports: [BotService],
})
export class BotModule {}
