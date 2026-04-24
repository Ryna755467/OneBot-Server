import { BotPlugin } from '../service';
import { Injectable } from '@nestjs/common';
import { NapCatApiResponse, NapCatEvent } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';
import { ConversationManager, MessageManager } from '../managers';
import { replyMessage, callLLM, getUid } from '../utils';
import { randomUUID } from 'crypto';
import { download } from '@utils/index';

type PendingTask = {
  napCatService: NapCatService;
  message: NapCatEvent;
  prompt: string;
  remaining: number;
};

@Injectable()
export class ChatPlugin implements BotPlugin {
  constructor(
    private readonly conversationManager: ConversationManager,
    private readonly messageManager: MessageManager,
  ) {}

  private pendingTasks = new Map<number, PendingTask>();
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
    const { message_type, message_id, message: userMsg } = message;
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

    try {
      const { prompt, fileCount } = await this.handleSegments(
        message,
        napCatService,
      );

      if (fileCount === 0) {
        const reply = await this.handleChat(prompt, getUid(message));

        replyMessage(napCatService, message, [
          { type: 'text', data: { text: reply } },
        ]);
      } else {
        this.pendingTasks.set(message_id!, {
          napCatService,
          message,
          prompt,
          remaining: fileCount,
        });
      }
    } catch {
      replyMessage(napCatService, message, [
        { type: 'text', data: { text: '服务器异常' } },
      ]);
    }
  }

  async handleApiResponse(message: NapCatApiResponse): Promise<void> {
    try {
      const { echo, data } = message;
      const { url } = data;
      if (!echo || !url) return;

      let targetTask: PendingTask | null = null;
      let targetId: number | null = null;

      for (const [id, task] of this.pendingTasks) {
        if (task.prompt.includes(`UUID：${echo}`)) {
          targetTask = task;
          targetId = id;
          break;
        }
      }
      if (!targetTask || !targetId) return;

      const publicUrl = await download(url);
      const newPrompt = targetTask.prompt.replace(
        `UUID：${echo}`,
        `文件链接：${publicUrl}`,
      );
      targetTask.remaining--;

      if (targetTask.remaining > 0) {
        targetTask.prompt = newPrompt;
        return;
      }

      const reply = await this.handleChat(
        newPrompt,
        getUid(targetTask.message),
      );

      replyMessage(targetTask.napCatService, targetTask.message, [
        { type: 'text', data: { text: reply } },
      ]);
      this.pendingTasks.delete(targetId);
    } catch {
      console.error('handleApiResponse error');
    }
  }

  private async handleSegments(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<{ prompt: string; fileCount: number }> {
    const { message_type, user_id, group_id, message: userMsg } = message;

    let prompt = '';
    let fileCount = 0;

    for (const segment of userMsg!) {
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
          const publicUrl = await download(url!);
          // 视频可以立刻拿到下载链接 需要转存到服务器才能访问
          prompt += `[视频名称：${file}，视频链接：${publicUrl}]`;
          break;
        }

        case 'file': {
          const echo = randomUUID();

          if (message_type === 'private') {
            napCatService.getPrivateFileUrl(user_id!, file_id!, echo);
          } else if (message_type === 'group') {
            napCatService.getGroupFileUrl(group_id!, file_id!, echo);
          }

          prompt += `[文件名称：${file}，UUID：${echo}]`;
          fileCount++;
          break;
        }

        case 'reply': {
          const replyMessage = await this.messageManager.findMessage(id!);
          if (!replyMessage) continue;

          const { prompt: replyPrompt, fileCount: replyFileCount } =
            await this.handleSegments(replyMessage, napCatService);

          prompt += `[引用了一条消息：“${replyPrompt}”]`;
          fileCount += replyFileCount;
          break;
        }
      }
    }

    return { prompt, fileCount };
  }

  private async handleChat(prompt: string, uid: string) {
    console.log(prompt);
    const conversationId = await this.conversationManager.findConversation(uid);
    const { content, newConversationId } = await callLLM(
      prompt,
      conversationId,
    );

    await this.conversationManager.saveConversation(uid, newConversationId);
    return content;
  }
}
