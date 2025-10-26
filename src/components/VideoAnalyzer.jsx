import React, { useEffect, useRef, useState } from 'react';
import { Video, Camera } from 'lucide-react';

export default function VideoAnalyzer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [energy, setEnergy] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const stream = videoRef.current?.srcObject;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setRunning(true);
      analyzeLoop();
    } catch (e) {
      console.error(e);
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setEnergy(0);
  };

  const analyzeLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const w = 160;
    const h = 120;
    canvas.width = w;
    canvas.height = h;

    const step = () => {
      try {
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h).data;
        // Very rough motion energy estimate using brightness difference vs previous frame
        if (!analyzeLoop.prev) analyzeLoop.prev = new Uint8ClampedArray(frame);
        let diff = 0;
        for (let i = 0; i < frame.length; i += 4) {
          const lum = 0.2126 * frame[i] + 0.7152 * frame[i + 1] + 0.0722 * frame[i + 2];
          const pl = 0.2126 * analyzeLoop.prev[i] + 0.7152 * analyzeLoop.prev[i + 1] + 0.0722 * analyzeLoop.prev[i + 2];
          diff += Math.abs(lum - pl);
        }
        const norm = diff / (w * h * 255);
        setEnergy(Math.min(1, norm * 2));
        analyzeLoop.prev.set(frame);
      } catch (e) {
        // ignore draw errors while camera starts
      }
      rafRef.current = requestAnimationFrame(step);
    };
    step();
  };

  const emotion = () => {
    if (energy > 0.5) return 'excited/animated likely';
    if (energy > 0.25) return 'engaged';
    if (energy > 0.1) return 'calm/neutral';
    return 'very calm/neutral';
  };

  return (
    <section className="bg-white/60 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
          <Video size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Video Analysis</h2>
          <p className="text-sm text-slate-600">Real-time webcam preview with simple motion energy as a proxy for arousal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-3">
          <canvas ref={canvasRef} className="w-full rounded" />
          <div className="flex items-center gap-2 text-sm">
            <Camera size={16} className="text-sky-600" />
            Motion energy: <span className="font-medium">{Math.round(energy * 100)}%</span> –{' '}
            <span className="capitalize">{emotion()}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={running ? stop : start}
              className={`px-3 py-2 rounded-lg text-white ${running ? 'bg-sky-600 hover:bg-sky-700' : 'bg-sky-500 hover:bg-sky-600'}`}
            >
              {running ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
