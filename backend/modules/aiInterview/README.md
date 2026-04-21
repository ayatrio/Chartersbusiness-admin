# AI Interview Module

This module adds a real-time mock interview flow with:

- LiveKit token generation endpoint
- Gemini-backed language scoring endpoint with local fallback
- Optional Python voice agent (LiveKit + Deepgram + Gemini)

## API endpoints

- `GET /api/ai-interview/health` (admin)
- `GET /api/ai-interview/token?roomId=<id>`
- `POST /api/ai-interview/score-language`

Compatibility aliases are also mounted at:

- `GET /api/interview/token?roomId=<id>`
- `POST /api/interview/score-language`

## Required environment variables

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_AGENT_NAME` (use the same value in the Node backend and the Python worker, default: `charters-ai-interviewer`)
- `GOOGLE_GENERATIVE_AI_API_KEY` (or `GEMINI_API_KEY`)

## Optional Python agent

Run from `backend/modules/aiInterview/agent`:

```bash
pip install -r requirements.txt
python agent.py dev
```

Production worker start:

```bash
python agent.py start
```

If the worker starts correctly, logs will include the configured `agent_name` and no import errors for `livekit.agents`.

The Node token endpoint now requests an explicit LiveKit agent dispatch for each interview room. The Python worker must be running separately and must register with the same `LIVEKIT_AGENT_NAME`, otherwise the candidate can join the room but no live interviewer will appear.

The frontend works in fallback mode even without the agent by using manual answer scoring.
