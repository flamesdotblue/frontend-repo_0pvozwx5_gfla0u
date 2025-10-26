import React, { useMemo, useState } from 'react';
import { FileText, Wand2 } from 'lucide-react';

const EMOTION_LEXICON = {
  joy: ['happy', 'joy', 'glad', 'excited', 'love', 'wonderful', 'great', 'awesome', 'delight', 'pleased'],
  sadness: ['sad', 'down', 'unhappy', 'depressed', 'tragic', 'cry', 'lonely', 'heartbroken', 'sorrow'],
  anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage', 'hate', 'upset'],
  fear: ['afraid', 'scared', 'fear', 'anxious', 'worried', 'terrified', 'panic', 'nervous'],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'wow'],
  disgust: ['disgust', 'gross', 'nasty', 'repulsed', 'revolting'],
};

function analyzeText(text) {
  const tokens = text.toLowerCase().match(/[a-zA-Z']+/g) || [];
  const scores = Object.fromEntries(Object.keys(EMOTION_LEXICON).map((k) => [k, 0]));
  tokens.forEach((t) => {
    for (const [emo, words] of Object.entries(EMOTION_LEXICON)) {
      if (words.includes(t)) scores[emo] += 1;
    }
  });
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const normalized = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, total ? Math.round((v / total) * 100) : 0])
  );
  const top = Object.entries(normalized).sort((a, b) => b[1] - a[1])[0] || ['neutral', 0];
  const label = top[1] === 0 ? 'neutral' : top[0];
  return { scores: normalized, label };
}

export default function TextAnalyzer() {
  const [text, setText] = useState('');
  const result = useMemo(() => analyzeText(text), [text]);

  return (
    <section className="bg-white/60 backdrop-blur rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
          <FileText size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Text Analysis</h2>
          <p className="text-sm text-slate-600">Detects emotion from written content using a lightweight keyword heuristic.</p>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type some text..."
        className="w-full h-28 resize-none rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-3 bg-white"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Wand2 size={18} className="text-indigo-600" />
          <span className="text-sm">Predicted emotion:</span>
          <span className="font-medium capitalize">{result.label}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(result.scores).map(([emo, pct]) => (
            <div key={emo} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
              {emo}: {pct}%
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
