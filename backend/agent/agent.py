import openai
from config import get_llm_config
from .prompt import AGENT_PROMPT
import json
class Agent:  
    def __init__(self):
        self.api_key = get_llm_config()["openai_api_key"]
        self.client = openai.OpenAI(api_key=self.api_key)
        self.messages = [{"role": "system", "content": AGENT_PROMPT}]

    def generate_response(self, message: str):
        self.messages.append({"role": "user", "content": message})
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=self.messages
        )

        response = json.loads(response.choices[0].message.content)
        
        if 'fields' in response:
            return response
        else:
            return None