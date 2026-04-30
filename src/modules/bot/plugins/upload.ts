import { BotPlugin } from '../service';
import { NapCatEvent, NapCatApiResponse, GroupFile } from '@napcat/interfaces';
import { NapCatService } from '@napcat/service';
import { replyMessage, sendMessage, isMatch } from '../utils';
import { randomUUID } from 'crypto';
import { join } from 'path';
import axios from 'axios';
import fs from 'fs-extra';

export class UploadPlugin implements BotPlugin {
  private readonly commandPrefix = '/upload';

  private readonly folderName = process.env.UPLOAD_FOLDER_NAME;
  private readonly saveDir = process.env.UPLOAD_SAVE_DIR!;
  // 暂存等待响应的回调函数
  private waiting = new Map<string, (res: NapCatApiResponse) => void>();

  name = 'upload';
  description = '上传群文件到服务器 /upload';

  match(message: NapCatEvent): boolean {
    return isMatch(message, this.commandPrefix).match;
  }

  async handle(
    message: NapCatEvent,
    napCatService: NapCatService,
  ): Promise<void> {
    try {
      const { message_type, group_id } = message;
      if (message_type !== 'group' || !group_id) {
        return replyMessage(napCatService, message, [
          { type: 'text', data: { text: `${this.commandPrefix} 仅群聊可用` } },
        ]);
      }

      const folderId = await this.getFolderId(napCatService, group_id);
      if (!folderId) {
        return replyMessage(napCatService, message, [
          { type: 'text', data: { text: `未找到${this.folderName}文件夹` } },
        ]);
      }

      const files = await this.getFolderFiles(
        napCatService,
        group_id,
        folderId,
      );
      if (!files.length) {
        return replyMessage(napCatService, message, [
          { type: 'text', data: { text: `${this.folderName}文件夹为空` } },
        ]);
      }

      const status = { success: 0, skipped: 0, failed: 0 };

      for (const [i, file] of files.entries()) {
        const { file_name, file_id } = file;
        const progress = `${i + 1}/${files.length}`;
        const filePath = join(this.saveDir, file_name);

        const exists = await fs.pathExists(filePath);
        if (exists) {
          sendMessage(napCatService, message, [
            {
              type: 'text',
              data: {
                text: `${file_name} 已经存在 - ${progress} skipped`,
              },
            },
          ]);
          status.skipped++;
          continue;
        }

        const fileUrl = await this.getFileUrl(napCatService, group_id, file_id);
        if (!fileUrl) {
          sendMessage(napCatService, message, [
            {
              type: 'text',
              data: {
                text: `${file_name} 未获取到下载链接 - ${progress} failed`,
              },
            },
          ]);
          status.failed++;
          continue;
        }

        sendMessage(napCatService, message, [
          {
            type: 'text',
            data: {
              text: `${file_name} 正在上传 - ${progress} processing`,
            },
          },
        ]);

        const ok = await this.download(fileUrl, filePath);
        if (ok) {
          sendMessage(napCatService, message, [
            {
              type: 'text',
              data: {
                text: `${file_name} 上传成功 - ${progress} done`,
              },
            },
          ]);
          status.success++;
        } else {
          sendMessage(napCatService, message, [
            {
              type: 'text',
              data: {
                text: `${file_name} 上传失败 - ${progress} failed`,
              },
            },
          ]);
          status.failed++;
        }
      }

      return replyMessage(napCatService, message, [
        {
          type: 'text',
          data: {
            text: `上传完成 - 成功：${status.success} 失败：${status.failed} 跳过：${status.skipped}`,
          },
        },
      ]);
    } catch (err) {
      return replyMessage(napCatService, message, [
        {
          type: 'text',
          data: { text: `上传错误 - ${(err as Error).message}` },
        },
      ]);
    }
  }

  handleApiResponse(message: NapCatApiResponse): void {
    const { echo } = message;
    if (!echo) return;

    const cb = this.waiting.get(echo);
    if (cb) {
      this.waiting.delete(echo);
      cb(message);
    }
  }

  // WebSocket收发不同步 用Promise+回调实现等待
  private wait(echo: string): Promise<NapCatApiResponse> {
    return new Promise((resolve, reject) => {
      this.waiting.set(echo, resolve);
      setTimeout(() => {
        this.waiting.delete(echo);
        reject(new Error(`请求超时：${echo}`));
      }, 5000);
    });
  }

  private async getFolderId(
    service: NapCatService,
    groupId: number,
  ): Promise<string> {
    const echo = randomUUID();
    service.getGroupRootFiles(groupId, echo);

    const res = await this.wait(echo);
    const folders = res.data.folders || [];
    const target = folders.find((f) => f.folder_name === this.folderName);
    return target?.folder_id ?? '';
  }

  private async getFolderFiles(
    service: NapCatService,
    groupId: number,
    folderId: string,
  ): Promise<GroupFile[]> {
    const echo = randomUUID();
    service.getGroupFilesByFolder(groupId, folderId, echo);

    const res = await this.wait(echo);
    return res.data.files ?? [];
  }

  private async getFileUrl(
    service: NapCatService,
    groupId: number,
    fileId: string,
  ): Promise<string> {
    const echo = randomUUID();
    service.getGroupFileUrl(groupId, fileId, echo);

    const res = await this.wait(echo);
    return res.data.url ?? '';
  }

  private async download(url: string, savePath: string): Promise<boolean> {
    try {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 1000 * 60 * 15,
      });

      const buffer = Buffer.from(res.data);
      await fs.ensureDir(this.saveDir);
      await fs.writeFile(savePath, buffer);

      return true;
    } catch {
      return false;
    }
  }
}
