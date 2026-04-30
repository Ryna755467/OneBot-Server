import { NapCatService } from '@napcat/service';
import { NapCatEvent, MessageSegment } from '@napcat/interfaces/message';

// 回复消息
export const replyMessage = (
  napCatService: NapCatService,
  message: NapCatEvent,
  content: MessageSegment[],
): void => {
  const { message_type, message_id, user_id, group_id } = message;

  const segments: MessageSegment[] = [
    {
      type: 'reply',
      data: { id: message_id },
    },
    ...content,
  ];

  if (message_type === 'private') {
    napCatService.sendPrivateMessage(user_id!, segments);
  } else if (message_type === 'group') {
    napCatService.sendGroupMessage(group_id!, segments);
  }
};

// 发送消息
export const sendMessage = (
  napCatService: NapCatService,
  message: NapCatEvent,
  content: MessageSegment[],
): void => {
  const { message_type, user_id, group_id } = message;

  if (message_type === 'private') {
    napCatService.sendPrivateMessage(user_id!, content);
  } else if (message_type === 'group') {
    napCatService.sendGroupMessage(group_id!, content);
  }
};

// 自动识别
export const sendMatchMessage = (
  napCatService: NapCatService,
  message: NapCatEvent,
  content: MessageSegment[],
): void => {
  const { message_type } = message;

  if (message_type === 'private') {
    sendMessage(napCatService, message, content);
  } else if (message_type === 'group') {
    replyMessage(napCatService, message, content);
  }
};
