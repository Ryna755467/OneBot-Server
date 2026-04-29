import { NapCatEvent } from '@napcat/interfaces';

// 匹配 ["/prefix","@bot /prefix"]
export const isMatch = (
  message: NapCatEvent,
  prefix: string,
): { match: boolean; cmd?: string } => {
  const { message: userMsg } = message;
  if (!userMsg) return { match: false };

  const botId = process.env.USER_ID;

  for (const segment of userMsg) {
    const { type, data } = segment;
    const { text, qq } = data;
    const validText = text?.trim();

    if (type === 'at' && qq === botId) continue;

    if (
      type === 'text' &&
      (validText === prefix || validText?.startsWith(`${prefix} `))
    ) {
      const cmd = validText.slice(prefix.length).trim();
      return { match: true, cmd };
    }

    return { match: false };
  }
  return { match: false };
};
