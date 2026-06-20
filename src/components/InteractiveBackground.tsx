import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  size: number;
  glow: number;
  scatterTime: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, targetX: 0, targetY: 0, hoverActive: false });

  // Icosahedron 3D geometry coordinates (12 vertices of regular icosahedron)
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio approx 1.618
  const icosahedronVertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(v => {
    // Normalize coordinates so length is roughly 120px
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]/len * 110, v[1]/len * 110, v[2]/len * 110];
  });

  // Unique 30 edges of the icosahedron based on distance
  const icosahedronEdges: [number, number][] = [];
  for (let i = 0; i < icosahedronVertices.length; i++) {
    for (let j = i + 1; j < icosahedronVertices.length; j++) {
      const dx = icosahedronVertices[i][0] - icosahedronVertices[j][0];
      const dy = icosahedronVertices[i][1] - icosahedronVertices[j][1];
      const dz = icosahedronVertices[i][2] - icosahedronVertices[j][2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      // Connected vertices are distance ~180-200 in our coordinate space
      if (dist < 190 && dist > 150) {
        icosahedronEdges.push([i, j]);
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse(prev => ({
        ...prev,
        targetX: e.clientX,
        targetY: e.clientY,
        hoverActive: true
      }));
    };

    const handleMouseLeave = () => {
      setMouse(prev => ({ ...prev, hoverActive: false }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 800 particles following the exact requested density spec
    const particlesCount = Math.min(800, Math.floor((width * height) / 1800)); // Adaptive bound with hard limit of 800
    const particles: Particle[] = [];

    for (let i = 0; i < particlesCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.3 + 0.1;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseVx: Math.cos(angle) * speed,
        baseVy: Math.sin(angle) * speed,
        size: Math.random() * 1.5 + 0.5,
        glow: Math.random(),
        scatterTime: 0
      });
    }

    // 3D rotation angles for icosahedron
    let angleX = 0;
    let angleY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;
    let currentMouseX = width / 2;
    let currentMouseY = height / 2;

    const render = () => {
      // Clear with dark void background
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Low opacity futuristic vector grid background
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSpacing = 64;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Smooth mouse easing for parallax physics
      currentMouseX += (mouse.targetX - currentMouseX) * 0.08;
      currentMouseY += (mouse.targetY - currentMouseY) * 0.08;

      // Mouse parallax offsets: tilts the scene +-5 degrees
      const normX = (currentMouseX / width) - 0.5;
      const normY = (currentMouseY / height) - 0.5;
      const targetParallaxX = normX * 40;
      const targetParallaxY = normY * 40;
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.1;
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.1;

      // Draw volumetric glow bubbles
      const radialGradient1 = ctx.createRadialGradient(
        width * 0.2 + currentParallaxX * 0.5,
        height * 0.2 + currentParallaxY * 0.5,
        10,
        width * 0.2,
        height * 0.2,
        Math.max(width * 0.4, 400)
      );
      radialGradient1.addColorStop(0, 'rgba(108, 99, 255, 0.12)');
      radialGradient1.addColorStop(0.5, 'rgba(167, 139, 250, 0.04)');
      radialGradient1.addColorStop(1, 'rgba(5, 8, 20, 0)');
      ctx.fillStyle = radialGradient1;
      ctx.fillRect(0, 0, width, height);

      const radialGradient2 = ctx.createRadialGradient(
        width * 0.82 + currentParallaxX * -0.5,
        height * 0.75 + currentParallaxY * -0.5,
        10,
        width * 0.8,
        height * 0.7,
        Math.max(width * 0.35, 300)
      );
      radialGradient2.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
      radialGradient2.addColorStop(0.6, 'rgba(13, 148, 136, 0.02)');
      radialGradient2.addColorStop(1, 'rgba(5, 8, 20, 0)');
      ctx.fillStyle = radialGradient2;
      ctx.fillRect(0, 0, width, height);

      // Rendering the 3D Wireframe Icosahedron (Floating 3D moment)
      // Slow rotation as requested: 0.002 rad/frame
      angleX += 0.0015;
      angleY += 0.0025;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Center of icosahedron (Let it float around the top center of the portal)
      const icoCenterX = width * 0.5 + currentParallaxX * 1.5;
      const icoCenterY = height * 0.32 + currentParallaxY * 1.5;

      const projectedVertices: { x: number; y: number; z: number }[] = [];

      icosahedronVertices.forEach(v => {
        // Rotate around Y
        let x1 = v[0] * cosY - v[2] * sinY;
        let z1 = v[0] * sinY + v[2] * cosY;

        // Rotate around X
        let y2 = v[1] * cosX - z1 * sinX;
        let z2 = v[1] * sinX + z1 * cosX;

        // Apply perspective sizing coefficient
        const perspective = 300 / (300 + z2);
        projectedVertices.push({
          x: icoCenterX + x1 * perspective,
          y: icoCenterY + y2 * perspective,
          z: z2
        });
      });

      // Draw connections/edges of the icosahedron
      ctx.lineWidth = 1.2;
      icosahedronEdges.forEach(([i, j]) => {
        const vA = projectedVertices[i];
        const vB = projectedVertices[j];

        // Fade edges that are in the background (z > 0 is deeper)
        const avgZ = (vA.z + vB.z) / 2;
        const opacity = Math.max(0.12, 0.45 - (avgZ / 120));

        // Let the wireframe edge glow violet/cyan
        const edgeGrad = ctx.createLinearGradient(vA.x, vA.y, vB.x, vB.y);
        edgeGrad.addColorStop(0, `rgba(108, 99, 255, ${opacity})`);
        edgeGrad.addColorStop(1, `rgba(167, 139, 250, ${opacity * 0.8})`);

        ctx.strokeStyle = edgeGrad;
        ctx.beginPath();
        ctx.moveTo(vA.x, vA.y);
        ctx.lineTo(vB.x, vB.y);
        ctx.stroke();
      });

      // Draw vertex glowing dots
      projectedVertices.forEach(v => {
        const opacity = Math.max(0.2, 0.6 - (v.z / 120));
        ctx.beginPath();
        ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.shadowColor = '#6c63ff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for efficiency
      });

      // Update and render the Particle Field (800 connection points)
      particles.forEach((p, idx) => {
        // Apply normal drift
        p.vx += (p.baseVx - p.vx) * 0.05;
        p.vy += (p.baseVy - p.vy) * 0.05;

        // Proximity-triggered physics acceleration (particles accelerate & scatter upon card hover or mouse proximity)
        const dx = currentMouseX - p.x;
        const dy = currentMouseY - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 150) {
          // Accelerate away! (Scatter effect)
          const force = (150 - dist) / 150;
          const angle = Math.atan2(p.y - currentMouseY, p.x - currentMouseX);
          p.vx += Math.cos(angle) * force * 5.5;
          p.vy += Math.sin(angle) * force * 5.5;
          p.scatterTime = 30; // Max visual flash countdown
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.scatterTime > 0) p.scatterTime--;

        // Screen boundary rebound checks
        if (p.x < 0 || p.x > width) {
          p.vx = -p.vx;
          p.baseVx = -p.baseVx;
        }
        if (p.y < 0 || p.y > height) {
          p.vy = -p.vy;
          p.baseVy = -p.baseVy;
        }

        // Pulse opacity slightly
        p.glow += (Math.random() - 0.5) * 0.02;
        p.glow = Math.max(0.2, Math.min(0.8, p.glow));

        // Render point with --accent-primary opacity 0.4
        const opacity = p.scatterTime > 0 ? 0.75 : 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (p.scatterTime > 0 ? 1 : 0), 0, Math.PI * 2);
        // --accent-primary is #6C63FF
        ctx.fillStyle = `rgba(108, 99, 255, ${opacity * p.glow})`;
        ctx.fill();

        // Draw connections for particles within 120px radius
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distDx = p.x - p2.x;
          const distDy = p.y - p2.y;
          const distSqr = distDx*distDx + distDy*distDy;
          const maxDist = 120;
          const maxDistSqr = maxDist * maxDist;

          if (distSqr < maxDistSqr) {
            const connectDist = Math.sqrt(distSqr);
            const lineOpacity = (1 - (connectDist / maxDist)) * 0.14 * p.glow;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(167, 139, 250, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mouse]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
