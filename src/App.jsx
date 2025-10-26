import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import TextAnalyzer from './components/TextAnalyzer';
import AudioAnalyzer from './components/AudioAnalyzer';
import ImageAnalyzer from './components/ImageAnalyzer';
import VideoAnalyzer from './components/VideoAnalyzer';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Brain size={20} />
            </div>
            <div>
              <h1 className="font-semibold">Multimodal Emotion Lab</h1>
              <p className="text-xs text-slate-600">Text, Audio, Image, and Video insights in one place</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
            <Sparkles size={16} className="text-indigo-600" />
            On-device demo – no data leaves your browser
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TextAnalyzer />
          <AudioAnalyzer />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImageAnalyzer />
          <VideoAnalyzer />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-slate-500">
        Built for context-aware human-computer interaction. This demo uses lightweight heuristics for instant feedback.
      </footer>
    </div>
  );
}
