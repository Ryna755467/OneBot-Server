import { BotPlugin } from '../service';
import { NapCatEvent } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';

export class EchoPlugin implements BotPlugin {
  name = 'echo';
  description = '复读插件：发送 /echo 内容 即可复读';

  match(message: NapCatEvent): boolean {
    return message.raw_message?.startsWith('/echo ') ?? false;
  }

  handle(message: NapCatEvent, napCatService: NapCatService): void {
    const content = message.raw_message!.replace('/echo ', '');

    if (message.message_type === 'private') {
      napCatService.sendPrivateMessage(message.user_id!, content);
    } else if (message.message_type === 'group') {
      napCatService.sendGroupMessage(message.group_id!, content);
    }
  }
}
