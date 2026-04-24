import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('bot_conversations')
export class BotConversation {
  @PrimaryColumn()
  uid: string;

  @Column()
  conversationId: string;

  @CreateDateColumn()
  createdAt: Date;
}
