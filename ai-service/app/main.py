from app.llm.ollama_client import OllamaClient


def main():
    client = OllamaClient()

    prompt = """
You are testing an AI service.

Respond with exactly:
AI Service is connected.
"""

    result = client.generate(prompt)

    print("\nModel response:")
    print(result)


if __name__ == "__main__":
    main()