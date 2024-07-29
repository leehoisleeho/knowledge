from sentence_transformers import SentenceTransformer
import sys
import json

def vectorize_text(text_chunks):
    model = SentenceTransformer('aspire/acge_text_embedding')
    embeddings = model.encode(text_chunks, normalize_embeddings=True)
    return list(zip(text_chunks, embeddings.tolist()))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("错误: 未提供输入文本。", file=sys.stderr)
        sys.exit(1)

    try:
        input_text = sys.argv[1]
        text_chunks = json.loads(input_text)

        if not isinstance(text_chunks, list):
            raise ValueError("输入必须是文本块的JSON数组。")

        results = vectorize_text(text_chunks)
        print(json.dumps(results))
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"值错误: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"未预期的错误: {e}", file=sys.stderr)
        sys.exit(1)