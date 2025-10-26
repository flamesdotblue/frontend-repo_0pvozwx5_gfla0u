import React, { useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

function useImageBrightness(file) {
  const [avg, setAvg] = useState(null);
  const imgRef = useRef(null);

  useMemo(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const w = 128;
      const h = Math.round((img.height / img.width) * w) || 128;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        // luminance approximation
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      const brightness = sum / (data.length / 4) / 255; // 0..1
      setAvg(brightness);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    imgRef.current = img;
  }, [file]);

  return avg;
}

export default function ImageAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const avg = useImageBrightness(file);

  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const label = () => {
    if (avg == null) return '—';
    if (avg > 0.7) return 'joy/neutral likely';
    if (avg > 0.45) return 'neutral';
    if (avg > 0.3) return 'sad/neutral likely';
    return 'low-light: emotion unclear';
  };

  return (
    <section className="bg-white/60 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
          <ImageIcon size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Image Analysis</h2>
          <p className="text-sm text-slate-600">Uploads an image and estimates emotion from basic luminance (demo heuristic).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600 hover:border-emerald-400 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Upload size={18} />
          <span className="text-sm">Drop or select an image</span>
        </label>

        <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-center min-h-[160px]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-60 rounded-lg object-contain" />
          ) : (
            <span className="text-slate-400 text-sm">No image selected</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-700">
          Estimated emotion: <span className="font-medium capitalize">{label()}</span>
        </div>
        <div className="text-sm text-slate-500">Avg brightness: {avg == null ? '—' : Math.round(avg * 100) + '%'}</div>
      </div>
    </section>
  );
}
