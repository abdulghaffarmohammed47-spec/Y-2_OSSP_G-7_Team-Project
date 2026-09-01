import os
import json
from dotenv import load_dotenv
from google import genai
from app.schemas.command import ExplainResponse, ExplainBreakdown

load_dotenv()

class ExplainService:
    @staticmethod
    async def explain(query: str, level: str = "beginner") -> ExplainResponse:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return ExplainResponse(
                user_query=query,
                normalized_intent="Missing API Key",
                generated_command=query,
                summary="Please configure GEMINI_API_KEY to enable AI explanations.",
                breakdown=[],
                os_flow=["Shell receives request", "Execution failed"],
                relevant_syscalls=[],
                concepts=["Configuration Error"],
                status="failed"
            )

        try:
            client = genai.Client(api_key=api_key)
            system_prompt = f"""You are a Linux OS professor explaining what happens when a user runs a command.
Target audience level: {level}
Explain the following query: "{query}"

Output ONLY valid JSON matching this schema exactly:
{{
  "user_query": "The original query string",
  "normalized_intent": "A short, verb-first summary of the intent (e.g. 'find_files_by_extension')",
  "generated_command": "The exact valid POSIX shell command for the intent",
  "summary": "A 1-2 sentence quick answer of what the command does",
  "breakdown": [
    {{"part": "command/flag part", "meaning": "short explanation of this specific part"}}
  ],
  "os_flow": [
    "Step 1 plain English explanation (e.g. Shell parses two commands)",
    "Step 2 with syscall (e.g. pipe() creates a communication channel)"
  ],
  "relevant_syscalls": ["list", "of", "core", "syscalls", "like", "execve", "fork"],
  "concepts": ["List", "of", "relevant", "OS", "concepts", "e.g.", "PROCESS CONTROL", "IPC"],
  "result": "A short description of what the user would see as output"
}}
"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=query,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            
            data = json.loads(response.text)
            
            return ExplainResponse(
                user_query=data.get("user_query", query),
                normalized_intent=data.get("normalized_intent", "Unknown"),
                generated_command=data.get("generated_command", query),
                summary=data.get("summary", "No summary available"),
                breakdown=[ExplainBreakdown(**b) for b in data.get("breakdown", [])],
                os_flow=data.get("os_flow", []),
                relevant_syscalls=data.get("relevant_syscalls", []),
                concepts=data.get("concepts", []),
                result=data.get("result", "Command execution completed")
            )
            
        except Exception as e:
            return ExplainResponse(
                user_query=query,
                normalized_intent="Error",
                generated_command=query,
                summary=f"Failed to generate explanation: {str(e)}",
                breakdown=[],
                os_flow=[],
                relevant_syscalls=[],
                concepts=[],
                status="failed"
            )
