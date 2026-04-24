import { LlmResponse } from '../types';
import axios from 'axios';

interface CallResponse {
  content: string;
  newConversationId?: string;
}

export const callLLM = async (
  prompt: string,
  conversationId?: string,
): Promise<CallResponse> => {
  const res = await axios.post<LlmResponse>(process.env.LLM_CHAT_URL!, {
    prompt,
    conversationId,
  });
  const { data } = res;
  const { success, content, conversationId: newConversationId } = data;

  if (!success) {
    throw new Error(content);
  }

  return { content, newConversationId };
};
