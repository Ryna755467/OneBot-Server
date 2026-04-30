import { Injectable } from '@nestjs/common';
import { BotService } from '@bot/service';
import { WebSocket } from 'ws';
import {
  NapCatMessage,
  MessageSegment,
  NapCatApiRequest,
  NapCatApiResponse,
} from './interfaces';
import { isNapCatApiResponse } from './utils';
import { randomUUID } from 'crypto';

@Injectable()
export class NapCatService {
  constructor(private readonly botService: BotService) {}

  private activeClient: WebSocket | null = null;
  private requestMap = new Map<
    string,
    {
      resolve: (res: NapCatApiResponse) => void;
      reject: (err: Error) => void;
    }
  >();

  setActiveClient(client: WebSocket): void {
    this.activeClient = client;
  }

  clearActiveClient(): void {
    this.activeClient = null;
  }

  handleIncomingMessage(message: NapCatMessage): void {
    // API响应
    if (isNapCatApiResponse(message)) {
      const res = message;
      const { status, message: content, echo } = res;

      if (echo && this.requestMap.has(echo)) {
        const { resolve, reject } = this.requestMap.get(echo)!;
        this.requestMap.delete(echo);

        if (status === 'ok') {
          resolve(res);
        } else {
          reject(new Error(content));
        }
      }
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

  // 不要对外提供协议层的方法
  private sendApiRequest(
    request: Omit<NapCatApiRequest, 'echo'>,
  ): Promise<NapCatApiResponse> {
    return new Promise((resolve, reject) => {
      if (
        !this.activeClient ||
        this.activeClient.readyState !== WebSocket.OPEN
      ) {
        reject(new Error('客户端未连接'));
        return;
      }

      const echo = randomUUID();
      const fullRequest: NapCatApiRequest = { ...request, echo };

      const timeout = setTimeout(() => {
        this.requestMap.delete(echo);
        reject(new Error(`${request.action} - 请求超时`));
      }, 5000);

      this.requestMap.set(echo, {
        resolve: (res: NapCatApiResponse) => {
          clearTimeout(timeout);
          resolve(res);
        },
        reject: (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      const data = JSON.stringify(fullRequest);
      this.activeClient.send(data);
    });
  }

  // 发送私聊消息
  sendPrivateMessage(
    userId: number,
    message: MessageSegment[],
  ): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'send_private_msg',
      params: { user_id: userId, message },
    });
  }

  // 发送群聊消息
  sendGroupMessage(
    groupId: number,
    message: MessageSegment[],
  ): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'send_group_msg',
      params: { group_id: groupId, message },
    });
  }

  // 获取私聊文件真实URL
  getPrivateFileUrl(
    userId: number,
    fileId: string,
  ): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'get_private_file_url',
      params: { user_id: userId, file_id: fileId },
    });
  }

  // 获取群聊文件真实URL
  getGroupFileUrl(groupId: number, fileId: string): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'get_group_file_url',
      params: { group_id: groupId, file_id: fileId },
    });
  }

  // 获取群根目录文件列表
  getGroupRootFiles(groupId: number): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'get_group_root_files',
      params: { group_id: groupId },
    });
  }

  // 获取群文件夹文件列表
  getGroupFilesByFolder(
    groupId: number,
    folderId: string,
  ): Promise<NapCatApiResponse> {
    return this.sendApiRequest({
      action: 'get_group_files_by_folder',
      params: { group_id: groupId, folder_id: folderId },
    });
  }
}
