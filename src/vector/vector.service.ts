import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { exec } from 'child_process';
import * as faiss from 'faiss-node';
import { promises as fs } from 'fs';
import { ensureDirectoryExistence } from '../utils';

@Injectable()
export class VectorService {
  constructor() {}
  // pdf向量化并存储
  async vector(fileName: string) {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'public',
      'pdf',
      fileName,
    );
    const outPath = path.join(__dirname, '..', '..', 'temp', 'output.json');
    const indexPath = path.join(
      __dirname,
      '..',
      '..',
      'public',
      'vector',
      'index.bin',
    );
    const textsPath = path.join(
      __dirname,
      '..',
      '..',
      'public',
      'vector',
      'texts.json',
    );
    try {
      const pdfPath = filePath;
      await this.vectorizeTextByPython(pdfPath, outPath);
      // 读取向量化后的文件
      // 读取向量化后的文件并解析为对象
      const vectorDataString = await fsPromises.readFile(outPath, 'utf-8');
      const vectorData: [string, number[]][] = JSON.parse(vectorDataString);
      const { index, texts } = await this.createFaissIndex(vectorData);
      await this.saveIndex(index, texts, indexPath, textsPath);
      return {
        code: 0,
        msg: 'success',
      };
    } catch (error) {
      return {
        code: 1,
        msg: error,
      };
    }
  }

  // 调用python脚本 生成向量
  private async vectorizeTextByPython(
    pdfPath: string,
    outPath: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'src',
        'vectorizeFile.py',
      );
      const command = `python3 "${scriptPath}" "${pdfPath}" "${outPath}"`;
      exec(
        command,
        { maxBuffer: 1024 * 1024 * 50 },
        async (error, stdout, stderr) => {
          if (error) {
            console.error(`执行出错: ${error}`);
            reject(error);
            return;
          }
          if (stderr) {
            console.error(`脚本错误输出: ${stderr}`);
          }

          // 检查标准输出中是否包含任务完成的标志
          if (stdout.includes('任务完成')) {
            try {
              const data = await fs.readFile(outPath, 'utf8');
              const result = JSON.parse(data);
              resolve(result);
            } catch (err) {
              reject(new Error(`无法读取或解析 JSON 文件: ${err}`));
            }
          } else {
            reject(new Error(`Python 脚本未能成功完成`));
          }
        },
      );
    });
  }
  //存储向量到faiss索引
  async createFaissIndex(vectorsData: [string, number[]][]) {
    // Ensure vectorizedData is an array
    if (!Array.isArray(vectorsData)) {
      throw new Error('vectorizedData must be an array');
    }

    // Extract the dimension from the first vector
    const dimension = vectorsData[0][1].length;
    console.log(`Vector dimension: ${dimension}`);

    // Create the index
    const index = new faiss.IndexFlatL2(dimension);

    // Prepare vectors for addition
    const texts: string[] = [];
    const flatVectors: number[] = [];
    console.log('开始添加向量到索引');
    vectorsData.forEach((item) => {
      if (Array.isArray(item) && item.length === 2 && Array.isArray(item[1])) {
        texts.push(item[0]);
        flatVectors.push(...item[1]);
      } else {
        console.warn('Skipping invalid item:', item);
      }
    });

    // Add vectors to the index
    if (flatVectors.length > 0) {
      index.add(flatVectors);
      const totalVectors = flatVectors.length / dimension;
      if (index.ntotal() !== totalVectors) {
        throw new Error(
          `向索引添加向量时出错，预期添加 ${totalVectors} 个向量，但实际添加了 ${index.ntotal()} 个向量。`,
        );
      }
      console.log('FAISS创建成功');
    } else {
      console.warn('没有要添加到索引的有效向量');
    }
    return { index, texts };
  }

  // 保存索引和文本到磁盘
  async saveIndex(
    index: any,
    texts: string[],
    indexPath: string,
    textsPath: string,
  ) {
    try {
      await ensureDirectoryExistence(
        path.join(__dirname, '..', '..', 'public', 'vector'),
      );
      await index.write(indexPath);
      await ensureDirectoryExistence(
        path.join(__dirname, '..', '..', 'public', 'vector'),
      );
      await fs.writeFile(textsPath, JSON.stringify(texts));
      console.error('保存索引和文本成功');
    } catch (error) {
      console.error('保存索引和文本时出错:', error);
    }
  }
}
