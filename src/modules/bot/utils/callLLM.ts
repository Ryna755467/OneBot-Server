import { LlmResponse } from '../types';
import axios from 'axios';

const userContext = new Map<string, string>();

export const callLLM = async (prompt: string, uid: string): Promise<string> => {
  const conversationId = userContext.get(uid);

  const res = await axios.post<LlmResponse>(process.env.LLM_CHAT_URL!, {
    prompt,
    conversationId,
  });
  const { data } = res;
  const { success, content, conversationId: newConversationId } = data;

  if (!success) {
    throw new Error(content);
  }
  if (newConversationId) {
    userContext.set(uid, newConversationId);
  }

  return content;
};
