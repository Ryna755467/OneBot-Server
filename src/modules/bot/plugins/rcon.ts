import { BotPlugin } from '../service';
import { NapCatEvent } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { sendMatchMessage, isMatch } from '../utils';
import { Rcon } from 'rcon-client';

export class RconPlugin implements BotPlugin {
  private readonly commandPrefix = '/remote';

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
  description = 'RCON 远程控制：/remote 指令';

  match(message: NapCatEvent): boolean {
    return isMatch(message, this.commandPrefix).match;
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    try {
      const userId = message.user_id;
      if (!userId || !this.allowedUsers.includes(userId)) {
        await sendMatchMessage(napCatService, message, [
          { type: 'text', data: { text: '没有远程控制台权限' } },
        ]);
        return;
      }

      const { cmd } = isMatch(message, this.commandPrefix);
      if (!cmd) {
        await sendMatchMessage(napCatService, message, [
          { type: 'text', data: { text: 'rcon 指令：/remote ${cmd}' } },
        ]);
        return;
      }

      const rcon = await this.getRcon();
      const result = await rcon.send(cmd);

      const reply = result.length > 800 ? result.slice(0, 800) + '...' : result;

      await sendMatchMessage(napCatService, message, [
        {
          type: 'text',
          data: {
            text: reply ? `${cmd} response:\n${reply}` : `${cmd} done`,
          },
        },
      ]);
    } catch (err) {
      await sendMatchMessage(napCatService, message, [
        {
          type: 'text',
          data: { text: `rcon error:\n${(err as Error).message}` },
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
