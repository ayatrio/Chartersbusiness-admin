import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiCameraLine,
  RiMicLine,
  RiSignalWifiErrorLine,
  RiStopCircleLine,
  RiTimerLine,
} from 'react-icons/ri';
import Card from '../../../components/Common/Card';
import Button from '../../../components/Common/Button';
import { aiInterviewService } from '../../../services/api';
import FaceTracker from './FaceTracker';
import { analyzeLanguageChunk, calculateFinalScore } from '../utils/scoring';

const LOCAL_PRACTICE_PROMPT = 'Hello! Let\'s begin your interview. Could you start by introducing yourself?';

const STATUS_META = {
  connecting: { label: 'Connecting', color: 'var(--orange)' },
  listening: { label: 'Listening', color: 'var(--green)' },
  speaking: { label: 'AI Speaking', color: 'var(--accent)' },
  thinking: { label: 'Thinking', color: 'var(--gold)' },
};

const FALLBACK_FOLLOWUPS = [
  'What interests you the most about this role?',
  'Walk me through one project you are most proud of.',
  'Tell me about a challenge you faced and how you resolved it.',
  'How would you approach a technical problem in a new domain?',
  'Thank you. Is there anything else you want to add before we close?',
];

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const logLiveKitDebug = (event, details = {}) => {
  console.info('[AIInterview][LiveKit]', event, details);
};

const readDisconnectReason = (reason) => {
  if (reason === undefined || reason === null) {
    return '';
  }

  return String(reason);
};

export default function InterviewRoom({
  interviewId,
  durationLabel,
  onEnd,
  onCancel,
}) {
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const localPreviewRef = useRef(null);
  const transcriptRef = useRef(null);
  const remoteAudioHostRef = useRef(null);
  const remoteAudioElementsRef = useRef(new Map());
  const disconnectingRef = useRef(false);
  const localFallbackPromptInjectedRef = useRef(false);
  const agentJoinedRef = useRef(false);
  const agentJoinWarningTimerRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [bodyTrackingUnavailable, setBodyTrackingUnavailable] = useState(false);
  const [agentStatus, setAgentStatus] = useState('connecting');
  const [ending, setEnding] = useState(false);

  const [transcript, setTranscript] = useState([]);
  const [languageSnapshots, setLanguageSnapshots] = useState([]);
  const [bodySnapshots, setBodySnapshots] = useState([]);
  const [liveScore, setLiveScore] = useState({
    language: 0,
    body: 0,
    voice: 0,
  });
  const [manualAnswer, setManualAnswer] = useState('');

  const status = STATUS_META[agentStatus] || STATUS_META.connecting;

  const clearAgentJoinWarningTimer = useCallback(() => {
    if (agentJoinWarningTimerRef.current) {
      window.clearTimeout(agentJoinWarningTimerRef.current);
      agentJoinWarningTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, agentStatus]);

  const stopLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      localPreviewRef.current.getTracks().forEach((track) => track.stop());
      localPreviewRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detachRemoteAudioElements = useCallback(() => {
    remoteAudioElementsRef.current.forEach(({ track, element }) => {
      try {
        if (track?.detach && element) {
          track.detach(element);
        }
      } catch (error) {
        // Ignore detach cleanup errors.
      }

      if (element?.remove) {
        element.remove();
      }
    });

    remoteAudioElementsRef.current.clear();
  }, []);

  const startLocalPreview = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      return;
    }

    stopLocalPreview();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      localPreviewRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      // Camera permissions can be denied during testing.
    }
  }, [stopLocalPreview]);

  const handleLanguageScore = useCallback(async (text) => {
    const score = await analyzeLanguageChunk(text);
    setLanguageSnapshots((prev) => [...prev, score]);
    setLiveScore((prev) => ({
      ...prev,
      language: clampPercent(score?.overall),
    }));
  }, []);

  const ensureLocalFallbackPrompt = useCallback(() => {
    if (localFallbackPromptInjectedRef.current) {
      return;
    }

    localFallbackPromptInjectedRef.current = true;
    setTranscript((prev) => (
      prev.length
        ? prev
        : [{ speaker: 'ai', text: LOCAL_PRACTICE_PROMPT }]
    ));
  }, []);

  const handleIncomingData = useCallback((dataBuffer) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(dataBuffer));

      if (message?.type === 'transcript' && message?.text) {
        const speaker = message.speaker === 'user' ? 'user' : 'ai';
        const shouldReplaceFallbackPrompt = speaker === 'ai' && localFallbackPromptInjectedRef.current;
        const nextEntry = {
          speaker,
          text: String(message.text),
        };

        setTranscript((prev) => (
          shouldReplaceFallbackPrompt
            && prev.length === 1
            && prev[0]?.speaker === 'ai'
            && prev[0]?.text === LOCAL_PRACTICE_PROMPT
            ? [nextEntry]
            : [...prev, nextEntry]
        ));

        if (speaker === 'ai') {
          localFallbackPromptInjectedRef.current = false;
        }

        logLiveKitDebug('data-received', {
          type: 'transcript',
          speaker,
          preview: nextEntry.text.slice(0, 80),
        });

        if (speaker === 'user' && nextEntry.text.trim().length > 20) {
          handleLanguageScore(nextEntry.text);
        }
      }

      if (message?.type === 'agent_status' && STATUS_META[message.status]) {
        logLiveKitDebug('data-received', {
          type: 'agent_status',
          status: message.status,
        });
        setAgentStatus(message.status);
      }

      if (message?.type === 'voice_score') {
        logLiveKitDebug('data-received', {
          type: 'voice_score',
          score: clampPercent(message.score),
        });
        setLiveScore((prev) => ({
          ...prev,
          voice: clampPercent(message.score),
        }));
      }
    } catch (error) {
      // Ignore non-JSON packets.
    }
  }, [handleLanguageScore]);

  useEffect(() => {
    let mounted = true;

    const connectToLiveKit = async () => {
      disconnectingRef.current = false;
      localFallbackPromptInjectedRef.current = false;
      agentJoinedRef.current = false;
      clearAgentJoinWarningTimer();
      setConnected(false);
      setFallbackMode(false);
      setConnectionError('');
      setAgentStatus('connecting');
      setTranscript([]);

      try {
        logLiveKitDebug('token-request-start', { interviewId });
        const { data } = await aiInterviewService.getToken(interviewId);
        const token = data?.token;
        const wsUrl = data?.wsUrl;

        if (!token || !wsUrl) {
          throw new Error('Token response is incomplete');
        }

        logLiveKitDebug('token-request-success', {
          interviewId,
          wsUrl,
          room: data?.room,
          identity: data?.identity,
          expiresIn: data?.expiresIn,
          agentDispatch: data?.agentDispatch || null,
        });

        if (data?.agentDispatch?.attempted && !data?.agentDispatch?.success) {
          const dispatchMessage = String(data?.agentDispatch?.message || '').trim();
          setConnectionError(
            dispatchMessage
              ? `${dispatchMessage} The room can still connect, but the live interviewer may not join until the Python agent worker is running with the same LIVEKIT_AGENT_NAME.`
              : 'Live interviewer dispatch failed. The room can still connect, but the live interviewer may not join until the Python agent worker is running with the same LIVEKIT_AGENT_NAME.'
          );
        }

        const livekitModule = await import('livekit-client');
        const { Room, RoomEvent, Track } = livekitModule;
        const room = new Room();
        roomRef.current = room;

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          logLiveKitDebug('connection-state-changed', {
            state: String(state),
            roomName: room.name || data?.room || '',
          });
        });
        room.on(RoomEvent.SignalConnected, () => {
          logLiveKitDebug('signal-connected', {
            roomName: room.name || data?.room || '',
          });
        });
        room.on(RoomEvent.Connected, () => {
          logLiveKitDebug('room-connected', {
            roomName: room.name || data?.room || '',
            localParticipant: room.localParticipant?.identity || '',
          });
        });
        room.on(RoomEvent.Reconnecting, () => {
          logLiveKitDebug('room-reconnecting', {
            roomName: room.name || data?.room || '',
          });

          if (mounted) {
            setAgentStatus('connecting');
            setConnectionError('Live interviewer connection is unstable. Attempting to reconnect...');
          }
        });
        room.on(RoomEvent.Reconnected, () => {
          logLiveKitDebug('room-reconnected', {
            roomName: room.name || data?.room || '',
          });

          if (mounted) {
            setAgentStatus('listening');
            setConnectionError('');
          }
        });
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          agentJoinedRef.current = true;
          clearAgentJoinWarningTimer();
          logLiveKitDebug('participant-connected', {
            identity: participant?.identity || '',
            sid: participant?.sid || '',
          });

          if (mounted) {
            setConnectionError('');
          }
        });
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          logLiveKitDebug('participant-disconnected', {
            identity: participant?.identity || '',
            sid: participant?.sid || '',
          });
        });
        room.on(RoomEvent.DataReceived, handleIncomingData);
        room.on(RoomEvent.TrackSubscribed, (track) => {
          logLiveKitDebug('track-subscribed', {
            kind: track?.kind || '',
            sid: track?.sid || '',
          });

          if (track?.kind === Track.Kind.Audio) {
            const key = String(track?.sid || track?.mediaStreamTrack?.id || Date.now());
            const attachedElement = track.attach();

            if (attachedElement) {
              attachedElement.autoplay = true;
              attachedElement.playsInline = true;
              attachedElement.style.display = 'none';
              remoteAudioElementsRef.current.set(key, { track, element: attachedElement });
              remoteAudioHostRef.current?.appendChild(attachedElement);
            }
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          logLiveKitDebug('track-unsubscribed', {
            kind: track?.kind || '',
            sid: track?.sid || '',
          });

          if (track?.kind !== Track.Kind.Audio) {
            return;
          }

          const key = String(track?.sid || track?.mediaStreamTrack?.id || '');
          const tracked = remoteAudioElementsRef.current.get(key);

          if (tracked) {
            try {
              track.detach(tracked.element);
            } catch (error) {
              // Ignore detach cleanup errors.
            }
            tracked.element?.remove?.();
            remoteAudioElementsRef.current.delete(key);
            return;
          }

          try {
            track.detach();
          } catch (error) {
            // Ignore detach cleanup errors.
          }
        });
        room.on(RoomEvent.Disconnected, (reason) => {
          const reasonText = readDisconnectReason(reason);
          logLiveKitDebug('room-disconnected', {
            reason: reasonText || 'unknown',
            roomName: room.name || data?.room || '',
            localParticipant: room.localParticipant?.identity || '',
          });

          agentJoinedRef.current = false;
          clearAgentJoinWarningTimer();
          detachRemoteAudioElements();

          if (!mounted) {
            return;
          }

          setConnected(false);

          if (disconnectingRef.current) {
            return;
          }

          setFallbackMode(true);
          setConnected(true);
          setAgentStatus('listening');
          setLiveScore((prev) => ({ ...prev, voice: 0 }));
          setConnectionError(
            reasonText
              ? `Disconnected from LiveKit room (${reasonText}). You can still run local practice mode below.`
              : 'Disconnected from the LiveKit room. You can still run local practice mode below.'
          );
          ensureLocalFallbackPrompt();
          void startLocalPreview();
        });

        logLiveKitDebug('room-connect-start', {
          wsUrl,
          room: data?.room,
        });
        await room.connect(wsUrl, token);
        await room.localParticipant.enableCameraAndMicrophone();
        await startLocalPreview();

        if (!mounted) {
          return;
        }

        agentJoinedRef.current = room.remoteParticipants.size > 0;
        clearAgentJoinWarningTimer();
        if (!agentJoinedRef.current) {
          agentJoinWarningTimerRef.current = window.setTimeout(() => {
            if (!mounted || disconnectingRef.current || agentJoinedRef.current) {
              return;
            }

            setConnectionError((prev) => (
              prev
                || 'Connected to the LiveKit room, but the interviewer agent has not joined yet. Check the Python worker logs and confirm LIVEKIT_AGENT_NAME matches on both services.'
            ));
          }, 8000);
        }

        setConnected(true);
        setAgentStatus('listening');
      } catch (error) {
        agentJoinedRef.current = false;
        clearAgentJoinWarningTimer();
        logLiveKitDebug('room-connect-failed', {
          interviewId,
          message: String(error?.message || ''),
          status: error?.status || error?.response?.status || null,
          details: String(error?.response?.data?.message || ''),
        });

        if (!mounted) {
          return;
        }

        const fallbackMessage = 'Live interviewer is unreachable right now. You can still run local practice mode below.';
        const backendMessage = String(
          error?.response?.data?.message
          || error?.message
          || ''
        ).trim();
        const combinedMessage = `${backendMessage} ${String(error?.message || '')}`.trim();
        const livekitSpecific = /livekit|token|ws|interview/i.test(backendMessage);
        const livekitAuthRejected = /could not fetch region settings|notallowed|401/i.test(combinedMessage);
        const connectionHint = livekitAuthRejected
          ? 'LiveKit rejected the room token (401). Check that LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET belong to the same LiveKit project.'
          : '';
        const detailedMessage = connectionHint || backendMessage || 'LiveKit connection failed.';

        setFallbackMode(true);
        setConnected(true);
        setAgentStatus('listening');
        setLiveScore((prev) => ({ ...prev, voice: 0 }));
        setConnectionError(
          livekitSpecific
            ? `${detailedMessage} You can still run local practice mode below.`
            : fallbackMessage
        );
        ensureLocalFallbackPrompt();
        await startLocalPreview();
      }
    };

    connectToLiveKit();

    return () => {
      mounted = false;
      agentJoinedRef.current = false;
      clearAgentJoinWarningTimer();
      if (roomRef.current) {
        disconnectingRef.current = true;
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      detachRemoteAudioElements();
      stopLocalPreview();
    };
  }, [clearAgentJoinWarningTimer, detachRemoteAudioElements, ensureLocalFallbackPrompt, handleIncomingData, interviewId, startLocalPreview, stopLocalPreview]);

  const handleBodyScore = useCallback((snapshot) => {
    if (snapshot?.unavailable) {
      setBodyTrackingUnavailable(true);
      setLiveScore((prev) => ({
        ...prev,
        body: 0,
      }));
      return;
    }

    setBodyTrackingUnavailable(false);
    setBodySnapshots((prev) => [...prev, snapshot]);
    const bodyScore = clampPercent(
      Number(snapshot?.confidence || 0) * 45
      + Number(snapshot?.engagement || 0) * 30
      + Number(snapshot?.eyeContact || 0) * 20
      - Number(snapshot?.nervousness || 0) * 25
    );

    setLiveScore((prev) => ({
      ...prev,
      body: bodyScore,
    }));
  }, []);

  const handleManualSubmit = async () => {
    const text = String(manualAnswer || '').trim();
    if (!text) {
      return;
    }

    setManualAnswer('');
    localFallbackPromptInjectedRef.current = true;
    setTranscript((prev) => {
      const nextUserTurns = prev.filter((item) => item.speaker === 'user').length + 1;
      const followup = FALLBACK_FOLLOWUPS[Math.min(nextUserTurns - 1, FALLBACK_FOLLOWUPS.length - 1)];
      return [...prev, { speaker: 'user', text }, { speaker: 'ai', text: followup }];
    });

    await handleLanguageScore(text);
  };

  const handleEndInterview = async () => {
    if (ending) {
      return;
    }

    setEnding(true);
    disconnectingRef.current = true;

    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      stopLocalPreview();

      const finalScore = calculateFinalScore({
        transcript,
        languageSnapshots,
        bodySnapshots,
        voiceScore: liveScore.voice ?? 0,
      });

      onEnd({
        ...finalScore,
        transcript,
        languageSnapshots,
        bodySnapshots,
        source: fallbackMode ? 'fallback' : 'livekit',
      });
    } finally {
      setEnding(false);
    }
  };

  return (
    <div>
      <div ref={remoteAudioHostRef} aria-hidden="true" style={{ display: 'none' }} />
      <Card hover={false} style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div className="ai-room-topbar">
          <div className="ai-room-topbar-left">
            <span className="ai-room-session">Session #{interviewId}</span>
            <span className="ai-room-timer">
              <RiTimerLine />
              {durationLabel}
            </span>
          </div>

          <div className="ai-room-topbar-right">
            <div className="ai-room-status" style={{ borderColor: status.color, color: status.color }}>
              <span className="ai-room-status-dot" style={{ background: status.color }} />
              {status.label}
            </div>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Back
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              icon={<RiStopCircleLine style={{ fontSize: 15 }} />}
              onClick={handleEndInterview}
              loading={ending}
            >
              End Interview
            </Button>
          </div>
        </div>
      </Card>

      <div className="ai-room-grid">
        <Card hover={false} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ai-video-wrap">
            <video ref={videoRef} autoPlay muted playsInline className="ai-video-feed" />
            <div className="ai-video-chip-row">
              <span className="ai-video-chip">
                <RiCameraLine />
                Camera preview
              </span>
              <span className="ai-video-chip">
                <RiMicLine />
                Mic enabled
              </span>
            </div>
          </div>

          {connected && (
            <FaceTracker videoRef={videoRef} onScore={handleBodyScore} />
          )}

          <div style={{ padding: 16 }}>
            <h4 style={sectionTitleStyle}>Live Score Signals</h4>
            <ScoreMeter label="Content answers" value={liveScore.language || 50} color="var(--accent)" />
            <ScoreMeter label="Body language" value={liveScore.body} color="var(--navy)" />
            <ScoreMeter label="Voice tone" value={liveScore.voice ?? 0} color="var(--green)" />
            {bodyTrackingUnavailable && (
              <p style={{ fontSize: 12, color: 'var(--orange)', marginTop: 8 }}>
                Face tracking models are unavailable, so body language scoring is paused.
              </p>
            )}
          </div>
        </Card>

        <Card hover={false} style={{ display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          <h4 style={sectionTitleStyle}>Live Transcript</h4>

          {connectionError && (
            <div className="ai-room-fallback-alert">
              <RiSignalWifiErrorLine style={{ fontSize: 16, flexShrink: 0 }} />
              <span>{connectionError}</span>
            </div>
          )}

          <div ref={transcriptRef} className="ai-transcript-feed">
            {transcript.length === 0 && (
              <p className="ai-transcript-empty">
                Waiting for the live interviewer transcript. If nothing appears, the voice agent may not have joined the room yet.
              </p>
            )}

            {transcript.map((entry, index) => (
              <div
                key={`${entry.speaker}-${index}`}
                className={`ai-transcript-item ${entry.speaker === 'user' ? 'is-user' : 'is-ai'}`}
              >
                <span className="ai-transcript-label">
                  {entry.speaker === 'user' ? 'You' : 'Interviewer'}
                </span>
                <p className="ai-transcript-text">{entry.text}</p>
              </div>
            ))}

            {agentStatus === 'thinking' && (
              <div className="ai-transcript-item is-ai">
                <span className="ai-transcript-label">Interviewer</span>
                <p className="ai-transcript-text">Thinking...</p>
              </div>
            )}
          </div>

          {fallbackMode && (
            <div className="ai-fallback-box">
              <label htmlFor="manual-answer" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Local practice input
              </label>
              <textarea
                id="manual-answer"
                rows={3}
                value={manualAnswer}
                onChange={(event) => setManualAnswer(event.target.value)}
                placeholder="Type your answer here to score language while LiveKit is offline."
                className="ai-manual-textarea"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="sm" onClick={handleManualSubmit}>
                  Score This Answer
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <style>{`
        .ai-room-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ai-room-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ai-room-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-room-session {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .ai-room-timer {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ai-room-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 11px;
        }
        .ai-room-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          animation: ai-room-pulse 1.3s ease infinite;
        }
        @keyframes ai-room-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.78); }
        }
        .ai-room-grid {
          display: grid;
          grid-template-columns: minmax(280px, 380px) 1fr;
          gap: 16px;
        }
        .ai-video-wrap {
          position: relative;
          background: var(--bg-hover);
          border-bottom: 1px solid var(--border);
          aspect-ratio: 4 / 3;
        }
        .ai-video-feed {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ai-video-chip-row {
          position: absolute;
          left: 10px;
          bottom: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-video-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 4px 8px;
        }
        .ai-room-fallback-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          border: 1px solid rgba(169, 104, 66, 0.26);
          background: rgba(169, 104, 66, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--orange);
          font-size: 13px;
        }
        .ai-transcript-feed {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          background: var(--surface-tint);
          overflow-y: auto;
          min-height: 340px;
          max-height: 430px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }
        .ai-transcript-empty {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.6;
        }
        .ai-transcript-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ai-transcript-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .ai-transcript-item.is-ai .ai-transcript-label {
          color: var(--accent);
        }
        .ai-transcript-item.is-user .ai-transcript-label {
          color: var(--green);
        }
        .ai-transcript-text {
          margin: 0;
          padding: 10px 11px;
          border-radius: 10px;
          border: 1px solid var(--border);
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary);
          background: #fff;
        }
        .ai-transcript-item.is-user .ai-transcript-text {
          border-color: rgba(45, 122, 96, 0.24);
          background: rgba(45, 122, 96, 0.08);
        }
        .ai-fallback-box {
          border: 1px dashed var(--border-hover);
          background: var(--surface-tint);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-manual-textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 10px 11px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary);
          resize: vertical;
          background: #fff;
          min-height: 92px;
        }
        .ai-manual-textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(177, 7, 56, 0.08);
        }
        @media (max-width: 980px) {
          .ai-room-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function ScoreMeter({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>
          {clampPercent(value)}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: 6,
        borderRadius: 99,
        background: 'var(--bg-hover)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampPercent(value)}%`,
          height: '100%',
          borderRadius: 99,
          background: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

const sectionTitleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 12,
  color: 'var(--text-primary)',
};
