from functools import lru_cache
from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent
from langchain.memory import ConversationBufferMemory

from app.core.config import OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS, OPENAI_TIMEOUT
from app.agents.tools import get_tools

@lru_cache(maxsize=1)
def get_agent():
    llm = ChatOpenAI(
        model_name=OPENAI_MODEL,
        temperature=OPENAI_TEMPERATURE,
        max_tokens=OPENAI_MAX_TOKENS,
        request_timeout=OPENAI_TIMEOUT,
    )
    tools = get_tools()
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    agent = initialize_agent(
        tools,
        llm,
        agent="conversational-react-description",
        memory=memory,
        verbose=True,
    )
    return agent
