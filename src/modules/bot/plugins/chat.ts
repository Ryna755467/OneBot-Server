import { BotPlugin } from '../service';
import { NapCatMessage } from '@napcat/interfaces/message';
import { NapCatService } from '@napcat/service';
import { LlmResponse } from '../types/llm';
import axios from 'axios';

export class ChatPlugin implements BotPlugin {
  name = 'chat';
  description = '大模型对话';

  private userContext = new Map<string, string>();
  private readonly llmChatUrl = process.env.LLM_CHAT_URL!;

  match(message: NapCatMessage): boolean {
    return true;
  }

  async handle(
    message: NapCatMessage,
    napCatService: NapCatService,
  ): Promise<void> {
    const { message_type, user_id, group_id, message: userMsg } = message;

    const uid = this.getUid(message);
    if (!userMsg || !uid) return;

    try {
      const prompt = userMsg.reduce((prev, segment) => {
        const { type, data } = segment;
        const { text, file, url } = data;

        switch (type) {
          case 'text':
            return prev + text;

          case 'image':
            return prev + `[图片名称：${file}，图片链接：${url}]`;
        }

        return prev;
      }, '');

      const reply = await this.callLLM(prompt, uid);

      if (message_type === 'private') {
        napCatService.sendPrivateMessage(user_id!, reply);
      } else if (message_type === 'group') {
        napCatService.sendGroupMessage(group_id!, reply);
      }
    } catch {
      const errMsg = '服务器异常';

      if (message_type === 'private') {
        napCatService.sendPrivateMessage(user_id!, errMsg);
      } else if (message_type === 'group') {
        napCatService.sendGroupMessage(group_id!, errMsg);
      }
    }
  }

  private async callLLM(prompt: string, uid: string): Promise<string> {
    const conversationId = this.userContext.get(uid);

    const res = await axios.post<LlmResponse>(this.llmChatUrl, {
      prompt,
      conversationId,
    });
    const data = res.data;

    if (!data.success) {
      throw new Error(data.content);
    }

    if (data.conversationId) {
      this.userContext.set(uid, data.conversationId);
    }

    return data.content;
  }

  private getUid(message: NapCatMessage): string | undefined {
    const { message_type, user_id, group_id } = message;

    if (message_type === 'private') {
      return `p_${user_id}`;
    } else if (message_type === 'group') {
      return `g_${group_id}_${user_id}`;
    }
  }
}
