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
    const userMsg = message.raw_message?.trim();
    const uid = this.getUid(message);
    if (!userMsg || !uid) return;

    try {
      const reply = await this.callLLM(userMsg, uid);

      if (message.message_type === 'private') {
        napCatService.sendPrivateMessage(message.user_id!, reply);
      } else if (message.message_type === 'group') {
        napCatService.sendGroupMessage(message.group_id!, reply);
      }
    } catch {
      const errMsg = '服务器异常';

      if (message.message_type === 'private') {
        napCatService.sendPrivateMessage(message.user_id!, errMsg);
      } else if (message.message_type === 'group') {
        napCatService.sendGroupMessage(message.group_id!, errMsg);
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

  private getUid(msg: NapCatMessage): string | undefined {
    if (msg.message_type === 'private') {
      return `p_${msg.user_id}`;
    } else if (msg.message_type === 'group') {
      return `g_${msg.group_id}_${msg.user_id}`;
    }
  }
}
