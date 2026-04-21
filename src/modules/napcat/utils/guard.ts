import {
  NapCatMessage,
  NapCatEvent,
  NapCatApiResponse,
} from '../interfaces/message';

export const isNapCatEvent = (
  message: NapCatMessage,
): message is NapCatEvent => {
  return 'post_type' in message;
};

export const isNapCatApiResponse = (
  message: NapCatMessage,
): message is NapCatApiResponse => {
  return 'status' in message;
};
