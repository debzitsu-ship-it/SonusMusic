import React, { useRef, useEffect, useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { audioEngine } from '../services/audio';

export const AmbientBackground: React.FC = () => {
  const { currentSong, currentColors } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bassIntensity, setBassIntensity] = useState<number>(0.3);
  const animationRef = useRef<number | null>(null);
  
  const activeCover = currentSong?.customArtUrl;

  // Real-time bass detection for subtle glow reactivity
  useEffect(() => {
    const analyser = audioEngine.analyserNode;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let frameCount = 0;

    const detectBass = () => {
      frameCount++;
      // Only update every 3 frames for smoothness (20fps)
      if (frameCount % 3 === 0) {
        analyser.getByteFrequencyData(dataArray);
        
        // Average low frequencies (bass range ~20-150Hz)
        let bassSum = 0;
        const bassBins = 8;
        for (let i = 0; i < bassBins; i++) {
          bassSum += dataArray[i];
        }
        const avgBass = bassSum / bassBins / 255; // Normalize 0-1
        
        // Smooth interpolation for elegant transitions
        setBassIntensity(prev => prev + (avgBass * 0.6 + 0.2 - prev) * 0.08);
      }
      
      animationRef.current = requestAnimationFrame(detectBass);
    };

    detectBass();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Canvas ambient glow effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let glowAnimation: number;

    const render = () => {
      time += 0.005;
      
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Create subtle ambient glow orbs that drift slowly
      const orbs = 3;
      
      for (let i = 0; i < orbs; i++) {
        const offset = (i * Math.PI * 2) / orbs;
        const driftX = Math.sin(time + offset) * 100;
        const driftY = Math.cos(time * 0.7 + offset) * 80;
        
        // Bass affects the glow radius subtly
        const baseRadius = 200 + (bassIntensity * 100);
        const radius = baseRadius + Math.sin(time * 2 + i) * 30;
        
        const gradient = ctx.createRadialGradient(
          centerX + driftX,
          centerY + driftY,
          0,
          centerX + driftX,
          centerY + driftY,
          radius
        );

        // Parse RGB from current accent color for dynamic tinting
        const accentMatch = currentColors.accent.match(/\d+/g);
        const r = accentMatch ? parseInt(accentMatch[0]) : 139;
        const g = accentMatch ? parseInt(accentMatch[1]) : 92;
        const b = accentMatch ? parseInt(accentMatch[2]) : 246;

        // Very subtle glow - alpha stays low (0.05-0.15)
        const alpha = 0.05 + (bassIntensity * 0.08) + (Math.sin(time + i) * 0.02);
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Subtle vignette that breathes with bass
      const vignetteGradient = ctx.createRadialGradient(
        centerX, centerY, canvas.width * 0.3,
        centerX, centerY, canvas.width * 0.8
      );
      const vignetteAlpha = 0.3 + (bassIntensity * 0.1);
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
      
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      glowAnimation = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(glowAnimation);
  }, [currentColors.accent, bassIntensity]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base blurred album artwork layer */}
      {activeCover ? (
        <>
          {/* Primary blurred image */}
          <div 
            className="absolute inset-[-50px] animate-ambient-drift"
            style={{
              backgroundImage: `url(${activeCover})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(50px) brightness(0.4) saturate(1.2)',
            }}
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Vignette */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
      )}

      {/* Canvas ambient glow layer */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Subtle noise texture for cinematic film grain feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
