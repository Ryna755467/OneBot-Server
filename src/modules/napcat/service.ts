import { Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { NapCatMessage, NapCatApiRequest } from './interfaces/message';
import { BotService } from '../bot/service';

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
    // 心跳和生命周期
    if (message.post_type === 'meta_event') {
      this.handleMetaEvent(message);
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

    // this.logger.debug(`未处理的 NapCat 事件类型: ${message.post_type}`);
  }

  private handleMetaEvent(message: NapCatMessage): void {
    if (message.meta_event_type === 'heartbeat') {
      // this.logger.debug('收到 NapCat 心跳');
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
      params: {
        user_id: userId,
        message,
      },
    });
  }

  sendGroupMessage(groupId: number, message: string): void {
    this.sendApiRequest({
      action: 'send_group_msg',
      params: {
        group_id: groupId,
        message,
      },
    });
  }
}
