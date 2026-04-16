import { BotPlugin } from '../service';
import { NapCatMessage } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';

export class HelpPlugin implements BotPlugin {
  name = 'help';
  description = '帮助插件：发送 /help 查看所有插件';

  match(message: NapCatMessage): boolean {
    return message.raw_message === '/help';
  }

  handle(message: NapCatMessage, napCatService: NapCatService): void {
    const helpText = `机器人插件列表：
/echo 内容 - 复读内容
/help - 查看帮助`;

    if (message.message_type === 'private') {
      napCatService.sendPrivateMessage(message.user_id!, helpText);
    } else if (message.message_type === 'group') {
      napCatService.sendGroupMessage(message.group_id!, helpText);
    }
  }
}
