import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';
import type { NapCatEvent } from '@napcat/interfaces';

@Entity('napcat_messages')
export class NapCatMessage {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'json' })
  data: NapCatEvent;

  @CreateDateColumn()
  createdAt: Date;
}
