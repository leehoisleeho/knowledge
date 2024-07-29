import { Injectable } from '@nestjs/common';
import * as PDFLoader from 'pdf-parse';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { exec } from 'child_process';
import * as faiss from 'faiss-node';
import { promises as fs } from 'fs';

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
    // const fileBuffer = await fsPromises.readFile(filePath);
    // const { text } = await PDFLoader(fileBuffer);
    const text = `
      近期，上海合合信息科技股份有限公司发布的文本向量化模型 acge_text_embedding 在中文文本向量化领域取得了重大突破，荣获 Massive Text Embedding Benchmark (MTEB) 中文榜单（C-MTEB）第一名的成绩。这一成就标志着该模型将在大模型领域的应用中发挥更加迅速和广泛的影响。
      acge_text_embedding 是上海合合信息科技股份有限公司基于大规模文本数据集训练的文本向量化模型，具有较高的文本向量化精度和效率。该模型在 C-MTEB 中文榜单中取得了第一名的成绩，证明了其在中文文本向量化领域的领先地位。
    `;
    const segments = await this.segmentation(text);
    const vectors: any = await this.vectorizeTextByPython(segments);
    const { index, texts } = await this.createFaissIndex(vectors);
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
    await this.saveIndex(index, texts, indexPath, textsPath);
  }

  // 分割文本
  private async segmentation(text: string) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 20, // 你可以根据需要调整这个值
      chunkOverlap: 10, // 你可以根据需要调整这个值
    });
    const output = await splitter.createDocuments([text]);
    return output; // 假设 segment 有 pageContent 属性包含分割后的文本
  }

  // 调用python脚本 生成向量
  // 修改后的vectorizeTextByPython函数;
  private async vectorizeTextByPython(text) {
    // 只提取pageContent字段
    const textChunks = text.map((doc) => doc.pageContent);

    // 将文本数组转换为JSON字符串，并正确转义
    const jsonString = JSON.stringify(textChunks);
    const escapedJsonString = jsonString.replace(/"/g, '\\"');

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'src',
        'vectorizeFile.py',
      );
      const command = `python3 "${scriptPath}" "${escapedJsonString}"`;

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
      console.log(`已添加 ${totalVectors} 个向量到索引中`);
      if (index.ntotal() !== totalVectors) {
        throw new Error(
          `向索引添加向量时出错，预期添加 ${totalVectors} 个向量，但实际添加了 ${index.ntotal()} 个向量。`,
        );
      }
      console.log('FAISS创建成功');
      console.log('索引中的向量数量:', index);
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
      await index.write(indexPath);
      await fs.writeFile(textsPath, JSON.stringify(texts));
    } catch (error) {
      console.error('保存索引和文本时出错:', error);
    }
  }
}
