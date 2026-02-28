import os
from groq import Groq
from dotenv import load_dotenv

# Use absolute path to .env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)
api_key = os.getenv('GROQ_API_KEY')
model = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')

print(f"Testing with API Key: {api_key[:6]}...{api_key[-4:]}")
print(f"Model: {model}")

try:
    client = Groq(api_key=api_key)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Say hello world in 2 words",
            }
        ],
        model=model,
    )
    print("SUCCESS!")
    print(f"Response: {chat_completion.choices[0].message.content}")
except Exception as e:
    print("FAILED!")
    print(f"Error: {str(e)}")
