export type MessageType =
  | 'text' // 文本
  | 'image' // 图片
  | 'record' // 语音
  | 'video' // 视频
  | 'file' // 文件
  | 'at'; // @用户

export type MessageData = {
  text?: string; // 文本内容
  file?: string; // 文件名称
  url?: string; // 访问链接
  qq?: string; // all代表@全体
};

export interface MessageSegment {
  type: MessageType;
  data: MessageData;
}

export interface NapCatMessage {
  post_type: 'message' | 'notice' | 'request' | 'meta_event';
  message_type?: 'private' | 'group';
  user_id?: number;
  group_id?: number;
  message_id?: number;
  message?: MessageSegment[];
  raw_message?: string; // 未解析的字符串消息 用CQ码表示多媒体内容
  meta_event_type?: string;
  [key: string]: unknown;
}

export interface NapCatApiRequest {
  action: string;
  params: Record<string, unknown>;
  echo?: string;
}
