import { BotPlugin } from '../service';
import { Injectable } from '@nestjs/common';
import { NapCatApiResponse, NapCatEvent } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { ConversationManager, MessageManager } from '../managers';
import { sendMatchMessage, callLLM, getUid } from '../utils';
import { download } from '@utils/index';

@Injectable()
export class ChatPlugin implements BotPlugin {
  constructor(
    private readonly conversationManager: ConversationManager,
    private readonly messageManager: MessageManager,
  ) {}

  private readonly userId = process.env.USER_ID!;

  name = 'chat';
  description = '大模型对话';

  match(message: NapCatEvent): boolean {
    return true;
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    try {
      const { message_type, message: userMsg } = message;
      if (!userMsg) return;

      // 保存所有消息 引用时读取
      await this.messageManager.saveMessage(message);

      // 群聊只处理@机器人的消息
      if (message_type === 'group') {
        const isAtMe = userMsg.some((segment) => {
          const { type, data } = segment;
          const { qq } = data;
          if (type === 'at' && qq === this.userId) {
            return true;
          }
        });
        if (!isAtMe) return;
      }

      const prompt = await this.handleSegments(message, napCatService);
      const reply = await this.handleChat(prompt, getUid(message));

      await sendMatchMessage(napCatService, message, [
        { type: 'text', data: { text: reply } },
      ]);
    } catch (error) {
      await sendMatchMessage(napCatService, message, [
        { type: 'text', data: { text: (error as Error).message } },
      ]);
    }
  }

  private async handleSegments(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<string> {
    const { message_type, user_id, group_id, message: userMsg } = message;
    if (!userMsg) return '';

    let prompt = '';
    for (const segment of userMsg) {
      const { type, data } = segment;
      const { text, file, file_id, url, id } = data;

      switch (type) {
        case 'text':
          prompt += text;
          break;

        case 'image':
          prompt += `[图片名称：${file}，图片链接：${url}]`;
          break;

        case 'video': {
          if (!url) continue;
          // 视频可以立刻拿到下载链接 需要转存到服务器才能访问
          const publicUrl = await download(url);
          prompt += `[视频名称：${file}，视频链接：${publicUrl}]`;
          break;
        }

        case 'file': {
          if (!file_id) continue;
          let res: NapCatApiResponse;

          if (message_type === 'private') {
            res = await napCatService.getPrivateFileUrl(user_id!, file_id);
          } else {
            res = await napCatService.getGroupFileUrl(group_id!, file_id);
          }

          const url = res.data.url;
          if (!url) continue;

          const publicUrl = await download(url);
          prompt += `[文件名称：${file}，文件链接：${publicUrl}]`;
          break;
        }

        case 'reply': {
          const prevMessage = await this.messageManager.findMessage(id!);
          if (!prevMessage) continue;

          const replyPrompt = await this.handleSegments(
            prevMessage,
            napCatService,
          );

          prompt += `[引用消息："${replyPrompt}"]`;
          break;
        }
      }
    }
    return prompt;
  }

  private async handleChat(prompt: string, uid: string) {
    const conversationId = await this.conversationManager.findConversation(uid);
    const { content, newConversationId } = await callLLM(
      prompt,
      conversationId,
    );
    await this.conversationManager.saveConversation(uid, newConversationId);
    return content;
  }
}
