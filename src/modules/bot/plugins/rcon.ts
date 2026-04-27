import { BotPlugin } from '../service';
import { NapCatEvent } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { replyMessage } from '../utils';
import { Rcon } from 'rcon-client';

export class RconPlugin implements BotPlugin {
  private readonly commandPrefix = '/rcon ';
  private readonly allowedUsers: number[] = process.env
    .RCON_ALLOWED_USERS!.split(',')
    .map(Number)
    .filter(Boolean);

  private readonly rconConfig = {
    host: process.env.RCON_HOST!,
    port: Number(process.env.RCON_PORT!),
    password: process.env.RCON_PASSWORD!,
    timeout: 6000,
  };

  private rcon: Rcon | null = null;
  private isConnecting = false;

  name = 'rcon';
  description = 'RCON 远程控制：/rcon 指令';

  match(message: NapCatEvent): boolean {
    return message.raw_message?.startsWith(this.commandPrefix) || false;
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    try {
      const userId = message.user_id;
      if (!userId || !this.allowedUsers.includes(userId)) {
        return replyMessage(napCatService, message, [
          { type: 'text', data: { text: '无RCON权限' } },
        ]);
      }

      const cmd = message.raw_message?.slice(this.commandPrefix.length).trim();
      if (!cmd) {
        return replyMessage(napCatService, message, [
          { type: 'text', data: { text: 'RCON 用法：/rcon ${cmd}' } },
        ]);
      }

      const rcon = await this.getRcon();
      const result = await rcon.send(cmd);

      const reply = result.length > 800 ? result.slice(0, 800) + '...' : result;

      replyMessage(napCatService, message, [
        { type: 'text', data: { text: `RCON 执行结果：\n${reply}` } },
      ]);
    } catch (err) {
      replyMessage(napCatService, message, [
        {
          type: 'text',
          data: { text: `RCON 执行错误：\n${(err as Error).message}` },
        },
      ]);
      this.rcon = null;
    }
  }

  private async getRcon(): Promise<Rcon> {
    if (this.rcon) {
      return this.rcon;
    }

    // 异步锁 避免并发重复连接
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getRcon();
    }

    try {
      this.isConnecting = true;
      this.rcon = await Rcon.connect(this.rconConfig);

      this.rcon.on('end', () => {
        this.rcon = null;
      });

      this.rcon.on('error', () => {
        this.rcon = null;
      });

      return this.rcon;
    } finally {
      this.isConnecting = false;
    }
  }
}
