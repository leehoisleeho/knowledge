import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as faiss from 'faiss-node';
import * as fs from 'fs/promises';
import { Ollama } from 'ollama';

@Injectable()
export class QueryService {
  private ollama: Ollama;
  private index: any;
  private texts: string[];

  constructor() {
    this.ollama = new Ollama({
      host: 'http://localhost:11434',
    });
  }

  async queryAndAnswer(question: string) {
    // 1. 检索相关信息
    const retrievedInfo = await this.query(question);

    // 2. 构造提示
    const prompt = this.constructPrompt(question, retrievedInfo);

    // 3. 使用大语言模型生成最终答案
    const answer = await this.ollamaQuery(prompt);

    return answer;
  }

  async query(question: string) {
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
      console.error('查询失败', err);
      throw err;
    }
  }

  private constructPrompt(question: string, retrievedInfo: any[]): string {
    let prompt = `基于以下信息回答问题: "${question}"\n\n相关信息:\n`;

    retrievedInfo.forEach((info, index) => {
      prompt += `${index + 1}. ${info.text}\n`;
    });

    prompt +=
      '\n请根据上述信息提供一个全面而准确的回答。并且用中文回答，如果信息不足以回答问题,就回答"你只能回答知识库提供的内容，其他问题自行搜索"。';

    return prompt;
  }

  private async loadIndex(indexPath: string, textsPath: string) {
    try {
      const indexBuffer = await fs.readFile(indexPath);
      this.index = faiss.IndexFlatL2.fromBuffer(indexBuffer);
      console.log('索引加载成功');

      const textsData = await fs.readFile(textsPath, 'utf-8');
      this.texts = JSON.parse(textsData);
      console.log('文本加载成功');
    } catch (err) {
      console.error('加载索引失败', err);
      throw err;
    }
  }

  private async vectorizeTextByPython(text: string) {
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

  async ollamaQuery(prompt) {
    const response = await this.ollama.generate({
      model: 'llama3.1',
      stream: false,
      prompt,
    });
    return response.response;
  }
}
