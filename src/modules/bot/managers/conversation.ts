import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BotConversation } from '@sql/entities';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationManager {
  constructor(
    @InjectRepository(BotConversation)
    private readonly conversationRepo: Repository<BotConversation>,
  ) {}

  async findConversation(uid: string): Promise<string | undefined> {
    const record = await this.conversationRepo.findOneBy({ uid });
    return record?.conversationId;
  }

  async saveConversation(uid: string, conversationId?: string): Promise<void> {
    if (!conversationId) return;
    await this.conversationRepo.save({ uid, conversationId });
  }
}
