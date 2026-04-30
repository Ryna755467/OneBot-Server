import { BotPlugin } from '../service';
import { NapCatEvent } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { sendMatchMessage } from '../utils';

export class HelpPlugin implements BotPlugin {
  name = 'help';
  description = '帮助插件：发送 /help 查看所有插件';

  match(message: NapCatEvent): boolean {
    return message.raw_message === '/help';
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    const helpText = '插件列表：/help - 查看帮助';

    await sendMatchMessage(napCatService, message, [
      { type: 'text', data: { text: helpText } },
    ]);
  }
}
