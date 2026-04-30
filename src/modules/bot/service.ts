import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { NapCatEvent } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { ChatPlugin, HelpPlugin, RconPlugin, UploadPlugin } from './plugins';

export interface BotPlugin {
  name: string;
  description: string;
  match: (message: NapCatEvent) => boolean;
  handle: (message: NapCatEvent, napCatService: NapCatService) => Promise<void>;
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
    private readonly uploadPlugin: UploadPlugin,
  ) {
    this.plugins = [
      this.uploadPlugin,
      this.rconPlugin,
      this.helpPlugin,
      this.chatPlugin,
    ];
  }

  async handleMessage(message: NapCatEvent): Promise<void> {
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
