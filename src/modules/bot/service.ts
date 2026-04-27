import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { NapCatApiResponse, NapCatEvent } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';
import { ChatPlugin, HelpPlugin, RconPlugin } from './plugins';

export interface BotPlugin {
  name: string;
  description: string;
  match: (message: NapCatEvent) => boolean;
  handle: (
    message: NapCatEvent,
    napCatService: NapCatService,
  ) => void | Promise<void>;
  // 插件内部处理API响应
  handleApiResponse?: (message: NapCatApiResponse) => Promise<void>;
}

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private readonly plugins: BotPlugin[];

  constructor(
    @Inject(forwardRef(() => NapCatService))
    private readonly napCatService: NapCatService,
    private readonly helpPlugin: HelpPlugin,
    private readonly chatPlugin: ChatPlugin,
    private readonly rconPlugin: RconPlugin,
  ) {
    this.plugins = [this.rconPlugin, this.helpPlugin, this.chatPlugin];
  }

  // 广播给所有插件
  async handleApiResponse(message: NapCatApiResponse): Promise<void> {
    for (const plugin of this.plugins) {
      try {
        await plugin.handleApiResponse?.(message);
      } catch (error) {
        this.logger.error(`插件 ${plugin.name} API响应处理失败`, error);
      }
    }
  }

  async handleMessage(message: NapCatEvent): Promise<void> {
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

  async handleNotice(message: NapCatEvent): Promise<void> {}
  async handleRequest(message: NapCatEvent): Promise<void> {}
  async handleMetaEvent(message: NapCatEvent): Promise<void> {}
}
