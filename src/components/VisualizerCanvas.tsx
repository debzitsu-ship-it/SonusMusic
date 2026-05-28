import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../services/audio';
import { useMusic } from '../context/MusicContext';

export const VisualizerCanvas: React.FC<{
  className?: string;
  isOverlay?: boolean;
}> = ({ className = "w-full h-full", isOverlay = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, currentColors } = useMusic();

  // Reference for physics simulation particles
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    hue: string;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const analyser = audioEngine.analyserNode;

    // Buffer preparation
    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);
    const waveArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);

      // Handle Resize
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!analyser) return;

      // Extract raw audio data
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(waveArray);

      const style = settings?.visualizerStyle || 'waveform';
      const intensityMod = (settings?.visualizerIntensity || 50) / 50;
      const sensitivityMod = (settings?.visualizerSensitivity || 50) / 50;

      // Compute mathematical band amplitudes
      let bassSum = 0;
      for (let i = 0; i < 10; i++) bassSum += dataArray[i];
      const bassAmt = (bassSum / 10) * sensitivityMod;

      const primaryColor = currentColors.primary;
      const accentColor = currentColors.accent;

      // 1. WAVEFORM STYLE
      if (style === 'waveform') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = accentColor;
        ctx.shadowBlur = 12;
        ctx.shadowColor = accentColor;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = waveArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }

      // 2. CIRCULAR SPECTRUM STYLE
      else if (style === 'circular') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.25 + (bassAmt * 0.15 * intensityMod);

        ctx.shadowBlur = 15;
        ctx.shadowColor = accentColor;

        const bars = 64;
        const step = (Math.PI * 2) / bars;

        for (let i = 0; i < bars; i++) {
          // Read mapped frequency array
          const val = dataArray[i * 4] * intensityMod * sensitivityMod;
          const barHeight = (val / 255) * (canvas.height * 0.2);

          const angle = i * step;
          
          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
          const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

          ctx.strokeStyle = i % 2 === 0 ? primaryColor : accentColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // 3. PULSE BARS STYLE
      else if (style === 'bars') {
        const bars = 40;
        const barWidth = canvas.width / bars;

        ctx.shadowBlur = 8;
        ctx.shadowColor = primaryColor;

        for (let i = 0; i < bars; i++) {
          const val = dataArray[i * 6] * intensityMod * sensitivityMod;
          const height = (val / 255) * canvas.height * 0.7;

          // Gradient bar
          const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - height);
          grad.addColorStop(0, primaryColor);
          grad.addColorStop(1, accentColor);

          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 2, canvas.height - height, barWidth - 4, height);
        }
        ctx.shadowBlur = 0;
      }

      // 4. AMBIENT GLOW STYLE
      else if (style === 'ambient') {
        const maxVal = Math.max(...dataArray);
        const alpha = (maxVal / 255) * 0.8 * intensityMod;

        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 10,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.6
        );
        
        grad.addColorStop(0, `${accentColor}`);
        grad.addColorStop(0.5, `${primaryColor}`);
        grad.addColorStop(1, 'transparent');

        ctx.globalAlpha = alpha;
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      }

      // 5. FLOWING WAVE STYLE
      else if (style === 'flowing') {
        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = 0.3;

        // Draw 3 offset layers
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          ctx.moveTo(0, canvas.height);

          const points = 20;
          const slice = canvas.width / points;

          for (let i = 0; i <= points; i++) {
            const dataIdx = i * 12 + layer * 4;
            const val = (dataArray[dataIdx] || 0) * intensityMod * sensitivityMod;
            const y = canvas.height - (val / 255) * canvas.height * 0.5 - (layer * 20);

            ctx.lineTo(i * slice, y);
          }

          ctx.lineTo(canvas.width, canvas.height);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // 6. PARTICLE VISUALIZER STYLE
      else if (style === 'particles') {
        // Spawn particles on strong bass hits
        if (bassAmt > 140 && Math.random() < 0.4) {
          for (let k = 0; k < 3; k++) {
            particlesRef.current.push({
              x: canvas.width / 2,
              y: canvas.height * 0.8,
              vx: (Math.random() - 0.5) * 8 * intensityMod,
              vy: -Math.random() * 10 * intensityMod,
              size: Math.random() * 6 + 2,
              alpha: 1.0,
              hue: Math.random() > 0.5 ? primaryColor : accentColor
            });
          }
        }

        // Update and draw particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.015;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.hue;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.hue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // 7. EDGE GLOW STYLE
      else if (style === 'edge') {
        const edgeThickness = (bassAmt / 255) * 40 * intensityMod;
        
        if (edgeThickness > 2) {
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = edgeThickness;
          ctx.shadowBlur = 30;
          ctx.shadowColor = accentColor;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
          ctx.shadowBlur = 0;
        }
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [settings, currentColors]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`${className} ${isOverlay ? 'pointer-events-none' : ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
