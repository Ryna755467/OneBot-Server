export interface NapCatApiRequest {
  action: string;
  params: Record<string, unknown>;
  echo?: string;
}

export interface GroupFile {
  group_id: number;
  file_id: string;
  file_name: string;
  busid: number;
  size: number;
  file_size: number;
  upload_time: number;
  dead_time: number;
  modify_time: number;
  download_times: number;
  uploader: number; // 上传此文件的QQ号
  uploader_name: string; // 上传此文件的用户名
}

export interface GroupFolder {
  group_id: number;
  folder_id: string;
  folder: string;
  folder_name: string;
  create_time: number;
  creator: number; // 创建此目录的QQ号
  creator_name: string; // 创建此目录的用户名
  total_file_count: number;
}

export interface NapCatApiResponse {
  status: 'ok' | 'failed';
  retcode: number;
  data: {
    url?: string;
    files?: GroupFile[];
    folders?: GroupFolder[];
  };
  message: string;
  wording: string;
  echo?: string;
  stream?: string;
}
