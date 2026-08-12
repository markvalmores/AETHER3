
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AnimeServiceProps {
  onBackgroundLoaded: (url: string) => void;
  gameStatus: string;
}

const AnimeBackground: React.FC<AnimeServiceProps> = ({ onBackgroundLoaded, gameStatus }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnimeBackground = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Hyper-detailed anime cinematic landscape, ${gameStatus}, ethereal atmospheric lighting, vibrant fantasy color palette, high contrast, 16:9 aspect ratio, masterpiece quality, Makoto Shinkai style.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        onBackgroundLoaded(imageUrl);
      } else {
        throw new Error("No image data found in response");
      }
    } catch (err: any) {
      console.error("Failed to generate anime background:", err);
      setError("Background generation failed.");
      // Standard fallback to a high-quality space background
      onBackgroundLoaded("https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1920&auto=format&fit=crop");
    } finally {
      setLoading(false);
    }
  }, [gameStatus, onBackgroundLoaded]);

  useEffect(() => {
    fetchAnimeBackground();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && !error) return null;

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
      {loading && (
        <div className="bg-slate-900/80 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-4 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-left-4">
          <div className="relative w-5 h-5">
             <div className="absolute inset-0 border-[3px] border-pink-500/30 rounded-full"></div>
             <div className="absolute inset-0 border-[3px] border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-none mb-1">AETHER GEN</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dreaming Dimension...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-widest border border-red-500/20 shadow-2xl">
          Neural link severed. Defaulting to local data.
        </div>
      )}
    </div>
  );
};

export default AnimeBackground;
