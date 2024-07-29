import { Injectable } from '@nestjs/common';
import { exec } from 'child_process'; // Import the exec function from the child_process module
import * as path from 'path'; // Import the path module
import * as faiss from 'faiss-node'; // 确保正确导入 faiss-node
import * as fs from 'fs/promises'; // Import fs/promises module

@Injectable()
export class QueryService {
  private index: any;
  private texts: string[];

  async query(question) {
    const indexPath = path.join(
      __dirname,
      '..',
      '..',
      'public/vector',
      'index.bin',
    );
    const textsPath = path.join(
      __dirname,
      '..',
      '..',
      'public/vector',
      'texts.json',
    );
    // 加载本地index和texts
    await this.loadIndex(indexPath, textsPath);
    if (!this.index || this.texts.length === 0) {
      throw new Error('索引或文本尚未加载');
    }
    try {
      const text = JSON.stringify(question);
      const vector = await this.vectorizeTextByPython(text);
      const result = this.index.search(vector, 5);
      // 处理结果
      const { distances, labels } = result;
      const queryResults = labels.map((label: number, index: number) => ({
        text: this.texts[label],
        distance: distances[index],
      }));
      return queryResults;
    } catch (err) {
      console.error('查询失败');
    }
  }

  // 加载index
  private async loadIndex(indexPath: string, textsPath: string) {
    try {
      // 读取索引文件
      const indexBuffer = await fs.readFile(indexPath);
      console.log(indexBuffer);
      this.index = faiss.IndexFlatL2.fromBuffer(indexBuffer);
      console.log('索引加载成功');
      const textsData = await fs.readFile(textsPath, 'utf-8');
      this.texts = JSON.parse(textsData);
      console.log('文本加载成功');
      return;
    } catch (err) {
      console.error('加载索引失败' + '\n' + err);
    }
  }

  // 调用python脚本 生成向量
  private async vectorizeTextByPython(text) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'src',
        'vectorizeQuery.py',
      );
      const command = `python3 "${scriptPath}" "${text}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行错误: ${error}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.error(`标准错误: ${stderr}`);
          reject(new Error(`Python脚本错误: ${stderr}`));
          return;
        }
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          console.error(`解析错误: ${parseError}`);
          reject(new Error(`无法解析向量化文本: ${parseError.message}`));
        }
      });
    });
  }

  // 调用大语言模型进行回答
}
