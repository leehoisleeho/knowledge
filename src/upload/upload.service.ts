import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

@Injectable()
export class UploadService {
  async handleFileUpload(file: Express.Multer.File) {
    try {
      const fileExtName = path.extname(file.originalname);
      const fileName = `${Date.now()}${fileExtName}`;
      const filePath = path.join(__dirname, '..', '../public/pdf', fileName);
      await this.ensureDirectoryExistence(
        path.join(__dirname, '..', '../public/pdf'),
      );
      await this.writeFile(file, filePath);
    } catch (err) {
      return {
        code: 1,
        message: '文件上传失败',
      };
    } finally {
      return {
        code: 0,
        message: '文件上传成功',
      };
    }
  }
  // 删除文件
  private async deleteFile(filePath: string) {
    try {
      await fsPromises.unlink(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }
  // 写入文件
  private async writeFile(
    file: Express.Multer.File,
    filePath: string,
  ): Promise<void> {
    await fsPromises.writeFile(filePath, file.buffer);
  }
  // 确保目录是否存在
  private async ensureDirectoryExistence(dirPath: string): Promise<void> {
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
}
