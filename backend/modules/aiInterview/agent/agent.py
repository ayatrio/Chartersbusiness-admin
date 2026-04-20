"""
LiveKit Voice Agent for AI Interview module.

Run locally:
  pip install -r requirements.txt
  python agent.py dev
"""

import asyncio
import inspect
import json
import logging
import re
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, google, silero

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("profile-branding-ai-interview-agent")

SYSTEM_PROMPT = """
You are a professional, warm, and objective job interviewer for a placement platform.

Rules:
- Ask exactly one question at a time.
- Keep each question concise (1-2 sentences).
- Ask a follow-up only when the candidate answer is vague.
- Stay neutral during the interview and avoid judging answers.
- Conclude after around five major questions.

Interview structure:
1. Introduction
2. Motivation
3. Experience/project depth
4. Challenge and resolution
5. Role-relevant technical or scenario question
"""

OPENING_PROMPT = "Hello! Let's begin your interview. Could you start by introducing yourself?"


async def entrypoint(ctx: JobContext):
    logger.info("Agent starting for room: %s", ctx.room.name)

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=SYSTEM_PROMPT,
    )

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            model="nova-3",
            language="en-IN",
            smart_format=True,
            filler_words=True,
            punctuate=True,
        ),
        llm=google.LLM(
            model="gemini-2.0-flash",
            temperature=0.7,
        ),
        tts=deepgram.TTS(
            model="aura-asteria-en",
            encoding="linear16",
            sample_rate=24000,
        ),
        chat_ctx=initial_ctx,
        min_endpointing_delay=0.6,
        allow_interruptions=False,
    )

    async def publish_payload(payload: dict):
        await ctx.room.local_participant.publish_data(
            json.dumps(payload).encode(),
            reliable=True,
        )

    @agent.on("user_speech_committed")
    def on_user_speech(msg: llm.ChatMessage):
        asyncio.create_task(
            publish_payload(
                {
                    "type": "transcript",
                    "speaker": "user",
                    "text": msg.content,
                }
            )
        )

    @agent.on("agent_speech_committed")
    def on_agent_speech(msg: llm.ChatMessage):
        asyncio.create_task(
            publish_payload(
                {
                    "type": "transcript",
                    "speaker": "ai",
                    "text": msg.content,
                }
            )
        )

    @agent.on("agent_started_speaking")
    def on_agent_started_speaking():
        asyncio.create_task(
            publish_payload({"type": "agent_status", "status": "speaking"})
        )

    @agent.on("agent_stopped_speaking")
    def on_agent_stopped_speaking():
        asyncio.create_task(
            publish_payload({"type": "agent_status", "status": "listening"})
        )

    @agent.on("user_speech_committed")
    def score_voice(msg: llm.ChatMessage):
        text = msg.content or ""
        words = text.split()
        filler_pattern = re.compile(
            r"\b(um+|uh+|like|you know|basically|literally|sort of|kind of|i mean)\b",
            re.IGNORECASE,
        )
        filler_count = len(filler_pattern.findall(text))
        word_count = len(words)

        filler_rate = filler_count / max(word_count, 1)
        voice_score = max(0, min(100, round(85 - filler_rate * 150 + min(word_count * 0.3, 15))))

        asyncio.create_task(
            publish_payload({"type": "voice_score", "score": voice_score})
        )

    agent.start(ctx.room)

    say_method = getattr(agent, "say", None)
    if callable(say_method):
        try:
            logger.info("Sending opening prompt through the voice agent")
            speak_result = say_method(OPENING_PROMPT, allow_interruptions=False)
            if inspect.isawaitable(speak_result):
                await speak_result
        except TypeError:
            speak_result = say_method(OPENING_PROMPT)
            if inspect.isawaitable(speak_result):
                await speak_result
        except Exception:
            logger.exception("Failed to deliver opening prompt through VoicePipelineAgent.say()")
            await publish_payload({"type": "transcript", "speaker": "ai", "text": OPENING_PROMPT})
            await publish_payload({"type": "agent_status", "status": "listening"})
    else:
        logger.warning("VoicePipelineAgent.say() is unavailable; publishing transcript-only opening prompt")
        await publish_payload({"type": "transcript", "speaker": "ai", "text": OPENING_PROMPT})
        await publish_payload({"type": "agent_status", "status": "listening"})

    await asyncio.sleep(float("inf"))


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
