import { NapCatEvent } from '@napcat/interfaces/message';

export const getUid = (message: NapCatEvent): string => {
  const { message_type, user_id, group_id } = message;

  return message_type === 'group' ? `g_${group_id}_${user_id}` : `p_${user_id}`;
};
