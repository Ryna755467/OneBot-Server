import { join } from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import fileType from 'file-type';
import { randomUUID } from 'crypto';

export const download = async (
  url: string,
  filename?: string,
): Promise<string> => {
  try {
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    const buffer = Buffer.from(res.data);

    if (!filename) {
      const type = await fileType.fromBuffer(buffer);
      const ext = type ? `.${type.ext}` : '.bin';
      filename = `${randomUUID()}${ext}`;
    }

    const saveDir = join(__dirname, '../../public/files');
    await fs.ensureDir(saveDir); // 自动创建目录

    const savePath = join(saveDir, filename);
    await fs.writeFile(savePath, buffer);

    return `${process.env.PUBLIC_DIR}/${filename}`;
  } catch {
    return 'undefined';
  }
};
