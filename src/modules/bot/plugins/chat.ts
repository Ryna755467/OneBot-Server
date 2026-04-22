import { BotPlugin } from '../service';
import { NapCatApiResponse, NapCatEvent } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';
import { LlmResponse } from '../types/llm';
import { randomUUID } from 'crypto';
import { download } from '@utils/index';
import axios from 'axios';

type PendingTask = {
  napCatService: NapCatService;
  message: NapCatEvent;
  prompt: string;
  remaining: number;
};

export class ChatPlugin implements BotPlugin {
  name = 'chat';
  description = '大模型对话';

  private userContext = new Map<string, string>();
  private pendingTasks = new Map<number, PendingTask>();
  private readonly llmChatUrl = process.env.LLM_CHAT_URL!;

  match(message: NapCatEvent): boolean {
    return true;
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    const {
      message_type,
      message_id,
      user_id,
      group_id,
      message: userMsg,
    } = message;
    if (!userMsg) return;

    try {
      let fileCount = 0;

      const prompt = userMsg.reduce((prev, segment) => {
        const { type, data } = segment;
        const { text, file, file_id, url } = data;

        switch (type) {
          case 'text':
            return prev + text;

          case 'image':
            return prev + `[图片名称：${file}，图片链接：${url}]`;

          case 'video':
            return prev + `[视频名称：${file}，视频链接：${url}]`;

          case 'file': {
            fileCount++;
            const echo = randomUUID();

            if (message_type === 'private') {
              napCatService.getPrivateFileUrl(user_id!, file_id!, echo);
            } else if (message_type === 'group') {
              napCatService.getGroupFileUrl(group_id!, file_id!, echo);
            }

            return prev + `[文件名称：${file}，UUID：${echo}]`;
          }
        }

        return prev;
      }, '');

      if (fileCount === 0) {
        const reply = await this.callLLM(prompt, this.getUid(message));
        this.replyMessage(napCatService, message, reply);
      } else {
        this.pendingTasks.set(message_id!, {
          napCatService,
          message,
          prompt,
          remaining: fileCount,
        });
      }
    } catch {
      this.replyMessage(napCatService, message, '服务器异常');
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

      const reply = await this.callLLM(
        newPrompt,
        this.getUid(targetTask.message),
      );
      this.replyMessage(targetTask.napCatService, targetTask.message, reply);
      this.pendingTasks.delete(targetId);
    } catch {
      console.error('handleApiResponse error');
    }
  }

  private async callLLM(prompt: string, uid: string): Promise<string> {
    const conversationId = this.userContext.get(uid);

    const res = await axios.post<LlmResponse>(this.llmChatUrl, {
      prompt,
      conversationId,
    });
    const { data } = res;
    const { success, content, conversationId: newConversationId } = data;

    if (!success) {
      throw new Error(content);
    }
    if (newConversationId) {
      this.userContext.set(uid, newConversationId);
    }

    return content;
  }

  private replyMessage(
    napCatService: NapCatService,
    message: NapCatEvent,
    content: string,
  ) {
    const { message_type, user_id, group_id } = message;

    if (message_type === 'private') {
      napCatService.sendPrivateMessage(user_id!, content);
    } else if (message_type === 'group') {
      napCatService.sendGroupMessage(group_id!, content);
    }
  }

  private getUid(message: NapCatEvent): string {
    const { message_type, user_id, group_id } = message;

    return message_type === 'group'
      ? `g_${group_id}_${user_id}`
      : `p_${user_id}`;
  }
}
