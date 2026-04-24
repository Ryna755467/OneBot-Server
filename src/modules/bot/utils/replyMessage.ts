import { NapCatService } from '@napcat/service';
import { NapCatEvent, MessageSegment } from '@napcat/interfaces/message';

export const replyMessage = (
  napCatService: NapCatService,
  message: NapCatEvent,
  content: MessageSegment[],
): void => {
  const { message_type, message_id, user_id, group_id } = message;

  if (message_type === 'private') {
    napCatService.sendPrivateMessage(user_id!, content);
  } else if (message_type === 'group') {
    napCatService.sendGroupMessage(group_id!, [
      {
        type: 'reply',
        data: { id: message_id },
      },
      ...content,
    ]);
  }
};
