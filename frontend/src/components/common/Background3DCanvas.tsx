/** Moving 3D Canvas Particle & Constellation Background.
 * Renders smooth moving 3D particle nodes, floating glowing light orbs,
 * and dynamic connecting constellations across all pages.
 */
import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  alpha: number;
}

export function Background3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particleCount = 65;
    const particles: Particle[] = [];
    const colors = ["#863bff", "#00f2fe", "#4facfe", "#d4af5e", "#a855f7"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        radius: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const focalLength = 400;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark gradient backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#080612");
      bgGrad.addColorStop(0.5, "#0d091e");
      bgGrad.addColorStop(1, "#070510");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Update & draw particles with 3D projection
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Wrap around bounds
        if (p.z <= 10) p.z = 800;
        if (p.z > 800) p.z = 10;
        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;

        const scale = focalLength / (focalLength + p.z);
        const projX = cx + p.x * scale;
        const projY = cy + p.y * scale;
        const projRadius = Math.max(0.5, p.radius * scale * 1.8);

        // Draw particle glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(projX, projY, projRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * scale;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();

        // Connect nearby particles with glowing lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const scale2 = focalLength / (focalLength + p2.z);
          const projX2 = cx + p2.x * scale2;
          const projY2 = cy + p2.y * scale2;

          const dx = projX - projX2;
          const dy = projY - projY2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(projX2, projY2);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 130) * 0.2 * scale;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] select-none"
    />
  );
}
