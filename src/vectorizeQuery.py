from sentence_transformers import SentenceTransformer
import sys
import json

def vectorize_text(text):
    model = SentenceTransformer('aspire/acge_text_embedding')
    embeddings = model.encode([text], normalize_embeddings=True)
    return embeddings[0].tolist()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("错误: 未提供输入文本。", file=sys.stderr)
        sys.exit(1)

    try:
        input_text = sys.argv[1]

        # 检查输入是否为字符串
        if not isinstance(input_text, str):
            raise ValueError("输入必须是一个字符串。")

        # 对输入文本进行向量化
        result = vectorize_text(input_text)
        
        # 打印向量化结果
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"值错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"未预期的错误: {e}", file=sys.stderr)
        sys.exit(1)