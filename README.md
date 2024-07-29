<p align="center">
 <img src="./logo.png" width="180" alt="Nest Logo" />
</p>

## Description

NestJS开发的一个本地知识库系统
1. 基于nestjs开发的本地知识库系统，暂时支持PDF格式的文档
2. node-faiis库进行文档的存储与查询
3. 基于llama3.1模型进行文档的问答

🤦🏻‍♂️🤦🏻‍♂️问题：
1. 向量检索部分还需要优化，很多问题无法找到答案，需要进一步优化

## Installation
💾 安装Python虚拟环境
```bash
$ python3 -m venv venv
$ source venv/bin/activate // 激活虚拟环境
$ pip3 install -r SentenceTransformer
```

🚀 启动项目
```bash
$ npm install
```
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

License MIT
