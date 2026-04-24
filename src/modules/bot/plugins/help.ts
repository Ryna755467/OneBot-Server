import { BotPlugin } from '../service';
import { NapCatEvent } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';
import { replyMessage } from '../utils';

export class HelpPlugin implements BotPlugin {
  name = 'help';
  description = '帮助插件：发送 /help 查看所有插件';

  match(message: NapCatEvent): boolean {
    return message.raw_message === '/help';
  }

  handle(message: NapCatEvent, napCatService: NapCatService): void {
    const helpText = '机器人插件列表：/help - 查看帮助';

    replyMessage(napCatService, message, [
      { type: 'text', data: { text: helpText } },
    ]);
  }
}
