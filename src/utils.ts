import { promises as fsPromises } from 'fs';

// 确认目录是否存在 不存在就创建目录
export async function ensureDirectoryExistence(dirPath: string): Promise<void> {
  try {
    await fsPromises.access(dirPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fsPromises.mkdir(dirPath, { recursive: true });
    } else {
      throw err;
    }
  }
}
