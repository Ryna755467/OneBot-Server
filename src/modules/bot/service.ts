import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { NapCatMessage } from '../napcat/interfaces/message';
import { NapCatService } from '../napcat/service';
import { EchoPlugin } from './plugins/echo';
import { HelpPlugin } from './plugins/help';

export interface BotPlugin {
  name: string;
  description: string;
  match: (message: NapCatMessage) => boolean;
  handle: (
    message: NapCatMessage,
    napCatService: NapCatService,
  ) => void | Promise<void>;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly plugins: BotPlugin[] = [new EchoPlugin(), new HelpPlugin()];

  constructor(
    @Inject(forwardRef(() => NapCatService))
    private readonly napCatService: NapCatService,
  ) {}

  async handleMessage(message: NapCatMessage): Promise<void> {
    this.logger.log(
      `收到 ${message.message_type} 消息，来自 ${message.user_id}`,
    );

    for (const plugin of this.plugins) {
      try {
        if (plugin.match(message)) {
          this.logger.debug(`触发插件: ${plugin.name}`);
          await plugin.handle(message, this.napCatService);
          break;
        }
      } catch (error) {
        this.logger.error(
          `插件 ${plugin.name} 执行失败: ${(error as Error).message}`,
        );
      }
    }
  }

  async handleNotice(message: NapCatMessage): Promise<void> {}

  async handleRequest(message: NapCatMessage): Promise<void> {}
}
