import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Waveform } from 'lucide-react';

function useSpeechRecognition(enabled) {
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = true;
    recog.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };
    recog.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recog;
    return () => recog.stop();
  }, [enabled]);

  const start = () => {
    if (recognitionRef.current) {
      setTranscript('');
      recognitionRef.current.start();
      setListening(true);
    }
  };
  const stop = () => {
    recognitionRef.current?.stop();
  };

  return { transcript, listening, start, stop, supported: !!recognitionRef.current };
}

export default function AudioAnalyzer() {
  const [useSTT, setUseSTT] = useState(true);
  const { transcript, listening, start, stop, supported } = useSpeechRecognition(useSTT);
  const [volume, setVolume] = useState(0);
  const [recording, setRecording] = useState(false);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setRecording(true);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // Compute rough volume from waveform deviation
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setVolume(Math.min(1, rms * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error(e);
    }
  };

  const stopMic = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setRecording(false);
    setVolume(0);
  };

  const emotionFromAudio = () => {
    // Very rough heuristic from loudness only
    if (volume > 0.4) return 'anger/excitement likely';
    if (volume > 0.2) return 'engaged';
    if (volume > 0.08) return 'calm/neutral';
    return 'very calm/neutral';
  };

  return (
    <section className="bg-white/60 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
          <Mic size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Audio Analysis</h2>
          <p className="text-sm text-slate-600">Records speech, optional on-device speech-to-text, and estimates vocal energy.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={recording ? stopMic : startMic}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white ${
            recording ? 'bg-rose-600 hover:bg-rose-700' : 'bg-rose-500 hover:bg-rose-600'
          }`}
        >
          {recording ? <MicOff size={16} /> : <Mic size={16} />}
          {recording ? 'Stop Mic' : 'Start Mic'}
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={useSTT}
            onChange={(e) => setUseSTT(e.target.checked)}
          />
          Enable on-device speech-to-text {supported ? '' : '(not supported in this browser)'}
        </label>
        <button
          onClick={listening ? stop : start}
          disabled={!useSTT || !supported}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
            listening ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-slate-300 text-slate-700'
          } disabled:opacity-50`}
        >
          {listening ? 'Stop STT' : 'Start STT'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-[width] duration-150"
              style={{ width: `${Math.round(volume * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Vocal energy: <span className="font-medium">{Math.round(volume * 100)}%</span> –{' '}
            <span className="capitalize">{emotionFromAudio()}</span>
          </div>
        </div>
        <Waveform className="text-rose-500" />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Transcript</label>
        <div className="mt-2 rounded-xl border border-slate-300 bg-white p-3 text-sm min-h-[56px]">
          {transcript || <span className="text-slate-400">Speak to see live transcript (if supported)</span>}
        </div>
      </div>
    </section>
  );
}
