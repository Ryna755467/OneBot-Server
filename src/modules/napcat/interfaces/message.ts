export interface NapCatMessage {
  post_type: 'message' | 'notice' | 'request' | 'meta_event';
  message_type?: 'private' | 'group';
  user_id?: number;
  group_id?: number;
  message_id?: number;
  message?: string | Array<{ type: string; data: Record<string, unknown> }>;
  raw_message?: string;
  meta_event_type?: string;
  [key: string]: unknown;
}

export interface NapCatApiRequest {
  action: string;
  params: Record<string, unknown>;
  echo?: string;
}
