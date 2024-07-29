from sentence_transformers import SentenceTransformer
import os
import sys
import json
import fitz  # PyMuPDF
import re
from langchain.text_splitter import CharacterTextSplitter  # 引入 CharacterTextSplitter

def extract_text_from_pdf(pdf_path):
    all_text = ""
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            all_text += page.get_text() + "\n"
    return all_text

def split_text_into_chunks(text, chunk_size=500):
    # 使用 CharacterTextSplitter 切割文本
    text_splitter = CharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=100)  # 设置切割大小和重叠部分
    chunks = text_splitter.split_text(text)
    return chunks

def vectorize_text(text_chunks):
    model = SentenceTransformer('aspire/acge_text_embedding')
    embeddings = model.encode(text_chunks, normalize_embeddings=True)
    return list(zip(text_chunks, embeddings.tolist()))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("错误: 未提供输入文本或输出路径。", file=sys.stderr)
        sys.exit(1)

    try:
        pdf_path = sys.argv[1]
        output_path = sys.argv[2]

        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # 从PDF中提取文本
        extracted_text = extract_text_from_pdf(pdf_path)
        
        # 分割文本
        text_chunks = split_text_into_chunks(extracted_text)

        # 向量化文本
        results = vectorize_text(text_chunks)
        
        # 保存结果
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False)
        
        print(f"向量化结果已保存到 {output_path}")
        print("任务完成")  # 添加这行表示任务完成

    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"值错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"未预期的错误: {e}", file=sys.stderr)
        sys.exit(1)