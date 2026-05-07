/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { Zap, ZapOff, Loader2, AlertCircle, Info, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isFlashing, setIsFlashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashCount, setFlashCount] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const blinkFlashlight = useCallback(async () => {
    if (isFlashing) return;

    setIsFlashing(true);
    setError(null);
    setFlashCount(0);

    try {
      // Optymalizacja: Rozpocznij strumień tylko jeśli go nie ma
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      }

      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (!capabilities.torch) {
        throw new Error('Twoje urządzenie/przeglądarka nie pozwala na sterowanie latarką.');
      }

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 1; i <= 5; i++) {
        setFlashCount(i);
        
        await track.applyConstraints({
          advanced: [{ torch: true }]
        } as any);
        await sleep(200); // Szybsze mignięcia

        await track.applyConstraints({
          advanced: [{ torch: false }]
        } as any);
        
        if (i < 5) {
          await sleep(200);
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        setError('Brak uprawnień. Zezwól na dostęp do aparatu w ustawieniach przeglądarki.');
      } else {
        setError(err.message || 'Błąd latarki.');
      }
    } finally {
      // Zatrzymujemy strumień, aby zwolnić aparat (wymóg większości przeglądarek)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsFlashing(false);
    }
  }, [isFlashing]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-yellow-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-md w-full z-10 space-y-10" id="main-ui">
        <header className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-3xl bg-white/5 border border-white/10 mb-4"
          >
            {isFlashing ? (
              <Zap className="w-12 h-12 text-yellow-400 animate-pulse" />
            ) : (
              <ZapOff className="w-12 h-12 text-zinc-600" />
            )}
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-white">BŁYSKACZ 5X</h1>
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Flashlight Automator</p>
        </header>

        <div className="relative group">
          <button
            id="main-action"
            onClick={blinkFlashlight}
            disabled={isFlashing}
            className={`
              w-full aspect-square rounded-[40px] flex flex-col items-center justify-center gap-4
              transition-all duration-500 border-t border-white/20
              ${isFlashing 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-600' 
                : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-[0_0_50px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95'}
            `}
          >
            {isFlashing ? (
              <>
                <Loader2 className="w-16 h-16 animate-spin opacity-20" />
                <span className="text-4xl font-black">{flashCount}</span>
              </>
            ) : (
              <>
                <Zap className="w-20 h-20 fill-current" />
                <span className="text-xl font-bold uppercase tracking-tight">START</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Jak zrobić APK?
            </button>
            <div className="p-4 bg-white/5 rounded-2xl text-[10px] text-zinc-500 uppercase flex items-center">
              v1.2 Stable
            </div>
          </div>

          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-4 text-xs text-zinc-400 leading-relaxed">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    INSTRUKCJA KOMPILACJI (APK)
                  </h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Eksportuj projekt jako <b>ZIP</b> (Settings &gt; Export).</li>
                    <li>Zainstaluj środowisko <b>Node.js</b> na PC.</li>
                    <li>W terminalu wpisz: <code className="bg-black p-1 rounded text-yellow-400">npm install @capacitor/core @capacitor/android</code>.</li>
                    <li>Zainicjuj Capacitora: <code className="bg-black p-1 rounded text-yellow-400">npx cap init</code>.</li>
                    <li>Zbuduj projekt i dodaj Androida: <code className="bg-black p-1 rounded text-yellow-400">npm run build && npx cap add android</code>.</li>
                    <li>Otwórz w <b>Android Studio</b> i kliknij "Build APK".</li>
                  </ol>
                  <p className="italic text-[10px]">
                    Tip: Aby nie pytał o uprawnienia w przeglądarce, kliknij "Dodaj do ekranu głównego" w menu Chrome/Safari.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

