"""
LiveKit Voice Agent for AI Interview module.

Run locally:
  pip install -r requirements.txt
  python agent.py dev
"""

import asyncio
import json
import logging
import os
import re
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AgentStateChangedEvent,
    AutoSubscribe,
    ConversationItemAddedEvent,
    JobContext,
    JobProcess,
    UserInputTranscribedEvent,
    WorkerOptions,
    cli,
)
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
AGENT_NAME = os.getenv("LIVEKIT_AGENT_NAME", "charters-ai-interviewer").strip() or "charters-ai-interviewer"


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


def map_agent_status(state: str) -> str:
    normalized = (state or "").strip().lower()
    if normalized == "initializing":
        return "connecting"
    if normalized == "idle":
        return "listening"
    if normalized in {"listening", "thinking", "speaking"}:
        return normalized
    return "listening"


def score_voice_text(text: str) -> int:
    words = text.split()
    filler_pattern = re.compile(
        r"\b(um+|uh+|like|you know|basically|literally|sort of|kind of|i mean)\b",
        re.IGNORECASE,
    )
    filler_count = len(filler_pattern.findall(text))
    word_count = len(words)
    filler_rate = filler_count / max(word_count, 1)
    return max(0, min(100, round(85 - filler_rate * 150 + min(word_count * 0.3, 15))))


def text_from_conversation_event(event: ConversationItemAddedEvent) -> str:
    item = event.item
    role = str(getattr(item, "role", "")).strip().lower()
    if role != "assistant":
        return ""
    text = getattr(item, "text_content", None)
    if not isinstance(text, str):
        return ""
    return text.strip()


async def entrypoint(ctx: JobContext):
    logger.info("Agent starting for room: %s", ctx.room.name)
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    vad_model = ctx.proc.userdata.get("vad") or silero.VAD.load()

    interviewer = Agent(
        instructions=SYSTEM_PROMPT,
        vad=vad_model,
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
        min_endpointing_delay=0.6,
        allow_interruptions=False,
    )

    async def publish_payload(payload: dict):
        try:
            await ctx.room.local_participant.publish_data(
                json.dumps(payload).encode(),
                reliable=True,
            )
        except Exception:
            logger.exception("Failed publishing payload to room data channel")

    session = AgentSession()

    def on_agent_state_changed(event: AgentStateChangedEvent):
        asyncio.create_task(
            publish_payload(
                {
                    "type": "agent_status",
                    "status": map_agent_status(event.new_state),
                }
            )
        )

    def on_user_input_transcribed(event: UserInputTranscribedEvent):
        if not event.is_final:
            return

        text = (event.transcript or "").strip()
        if not text:
            return

        asyncio.create_task(
            publish_payload(
                {
                    "type": "transcript",
                    "speaker": "user",
                    "text": text,
                }
            )
        )
        asyncio.create_task(
            publish_payload(
                {
                    "type": "voice_score",
                    "score": score_voice_text(text),
                }
            )
        )

    def on_conversation_item_added(event: ConversationItemAddedEvent):
        text = text_from_conversation_event(event)
        if not text:
            return

        asyncio.create_task(
            publish_payload(
                {
                    "type": "transcript",
                    "speaker": "ai",
                    "text": text,
                }
            )
        )

    session.on("agent_state_changed", on_agent_state_changed)
    session.on("user_input_transcribed", on_user_input_transcribed)
    session.on("conversation_item_added", on_conversation_item_added)

    await session.start(interviewer, room=ctx.room)

    try:
        session.say(OPENING_PROMPT, allow_interruptions=False)
    except Exception:
        logger.exception("Failed to deliver opening prompt through AgentSession.say()")
        await publish_payload({"type": "transcript", "speaker": "ai", "text": OPENING_PROMPT})
        await publish_payload({"type": "agent_status", "status": "listening"})

    await asyncio.Event().wait()


if __name__ == "__main__":
    logger.info("Starting LiveKit AI interview worker with agent_name=%s", AGENT_NAME)
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name=AGENT_NAME,
        )
    )
