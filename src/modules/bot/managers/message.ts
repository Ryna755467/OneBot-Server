import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NapCatMessage } from '@sql/entities';
import { NapCatEvent } from '@napcat/interfaces';
import { Repository } from 'typeorm';

@Injectable()
export class MessageManager {
  constructor(
    @InjectRepository(NapCatMessage)
    private readonly messageRepo: Repository<NapCatMessage>,
  ) {}

  async findMessage(id: number): Promise<NapCatEvent | undefined> {
    const record = await this.messageRepo.findOneBy({ id });
    return record?.data;
  }

  async saveMessage(message: NapCatEvent): Promise<void> {
    const { message_id } = message;
    if (!message_id) return;

    await this.messageRepo.save({
      id: message_id,
      data: message,
    });
  }
}
