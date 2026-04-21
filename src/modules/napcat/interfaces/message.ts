export type MessageType =
  | 'text' // 文本
  | 'image' // 图片
  | 'record' // 语音
  | 'video' // 视频
  | 'file' // 文件
  | 'at'; // @用户

export interface MessageData {
  text?: string; // 文本内容
  file?: string; // 文件名称
  file_id?: string; // 文件ID
  url?: string; // 访问链接
  qq?: string; // all代表@全体
}

export interface MessageSegment {
  type: MessageType;
  data: MessageData;
}

export type PostType =
  | 'message' // 消息事件（私聊、群聊、频道消息）
  | 'notice' // 通知事件（文件上传、群成员增减、禁言等）
  | 'request' // 请求事件（加好友、加群、邀请机器人）
  | 'meta_event'; // 元事件（心跳、生命周期、在线状态）

export interface NapCatEvent {
  post_type: PostType;
  message_type?: 'private' | 'group';
  user_id?: number;
  group_id?: number;
  message?: MessageSegment[];
  message_id?: number;
  raw_message?: string; // 未解析的字符串消息 用CQ码表示多媒体内容
  meta_event_type?: string;
}

export interface NapCatApiResponse {
  status: 'ok' | 'failed';
  retcode: number;
  data: {
    url?: string;
  };
  message: string;
  wording: string;
  echo?: string;
  stream?: string;
}

export type NapCatMessage = NapCatEvent | NapCatApiResponse;

export interface NapCatApiRequest {
  action: string;
  params: Record<string, unknown>;
  echo?: string;
}
