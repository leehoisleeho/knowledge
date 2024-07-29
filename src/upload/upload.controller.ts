import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { extname } from 'path';

function checkFileExtension(
  file: Express.Multer.File,
  allowedExtensions: string[],
) {
  const ext = extname(file.originalname).toLowerCase();
  const isExtensionAllowed = allowedExtensions.includes(ext);
  return isExtensionAllowed;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  // 上传文件
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file) {
    const allowedExtensions = ['.pdf', '.png'];
    const type = checkFileExtension(file, allowedExtensions);
    if (!type) {
      return {
        code: 1,
        message: '文件格式错误',
      };
    }
    return this.uploadService.handleFileUpload(file);
  }
}
