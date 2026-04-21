import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { NapCatMessage, NapCatApiRequest } from './interfaces/message';
import { isNapCatApiResponse } from './utils/guard';
import { BotService } from '@bot/service';

@Injectable()
export class NapCatService {
  private readonly logger = new Logger(NapCatService.name);
  private activeClient: WebSocket | null = null;

  constructor(private readonly botService: BotService) {}

  setActiveClient(client: WebSocket): void {
    this.activeClient = client;
  }

  clearActiveClient(): void {
    this.activeClient = null;
  }

  handleIncomingMessage(message: NapCatMessage, client: WebSocket): void {
    // API响应处理
    if (isNapCatApiResponse(message)) {
      void this.botService.handleApiResponse(message);
      return;
    }

    // 心跳和生命周期
    if (message.post_type === 'meta_event') {
      void this.botService.handleMetaEvent(message);
      return;
    }

    // 群成员增减、禁言、撤回、文件上传等非消息类的通知
    if (message.post_type === 'notice') {
      void this.botService.handleNotice(message);
      return;
    }

    // 加好友请求、加群请求等需要同意或拒绝的操作
    if (message.post_type === 'request') {
      void this.botService.handleRequest(message);
      return;
    }

    // 收到私聊、群聊、讨论组消息等
    if (message.post_type === 'message') {
      void this.botService.handleMessage(message);
      return;
    }
  }

  sendApiRequest(request: NapCatApiRequest): void {
    if (!this.activeClient || this.activeClient.readyState !== WebSocket.OPEN) {
      this.logger.error('NapCat 客户端未连接，无法发送请求');
      return;
    }

    const data = JSON.stringify(request);
    this.activeClient.send(data);
    this.logger.debug(`发送 NapCat API 请求: ${data}`);
  }

  sendPrivateMessage(userId: number, message: string): void {
    this.sendApiRequest({
      action: 'send_private_msg',
      params: { user_id: userId, message },
    });
  }

  sendGroupMessage(groupId: number, message: string): void {
    this.sendApiRequest({
      action: 'send_group_msg',
      params: { group_id: groupId, message },
    });
  }

  // 获取私聊文件真实URL
  getPrivateFileUrl(userId: number, fileId: string, echo: string): void {
    this.sendApiRequest({
      action: 'get_private_file_url',
      params: { user_id: userId, file_id: fileId },
      echo,
    });
  }

  // 获取群聊文件真实URL
  getGroupFileUrl(groupId: number, fileId: string, echo: string): void {
    this.sendApiRequest({
      action: 'get_group_file_url',
      params: { group_id: groupId, file_id: fileId },
      echo,
    });
  }
}
