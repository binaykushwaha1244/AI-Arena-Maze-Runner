/* Canvas drawing: Modern game board with elegant connected walls,
   subtle tiled floor, smooth visited cell gradients, algorithm-colored glowing frontier,
   comet trail, red backtracking trail, animated bobbing robot, waving flag,
   start ripple, confetti explosion, and floating victory banner. */

/**
 * Draws a filled rounded rectangle.
 */
let bannerStart = 0; // time the victory banner appeared

function rr(x, y, w, h, r, f) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (f) {
    ctx.fillStyle = f;
    ctx.fill();
  }
}

/**
 * Helper to draw a tiny star for confetti particles.
 */
function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Theme color map for frontier glow per algorithm.
 */
const ALG_THEMES = {
  bfs: {
    glow: "rgba(2, 132, 199, 0.45)",
    border: "#0284c7",
    bg: "rgba(186, 230, 253, 0.95)",
    text: "#0369a1"
  },
  dfs: {
    glow: "rgba(245, 158, 11, 0.45)",
    border: "#f59e0b",
    bg: "rgba(253, 230, 138, 0.95)",
    text: "#b45309"
  },
  greedy: {
    glow: "rgba(192, 38, 211, 0.45)",
    border: "#c026d3",
    bg: "rgba(245, 208, 254, 0.95)",
    text: "#a21caf"
  },
  astar: {
    glow: "rgba(13, 148, 136, 0.45)",
    border: "#0d9488",
    bg: "rgba(153, 246, 228, 0.95)",
    text: "#0f766e"
  }
};

/**
 * Main draw loop: renders whole game board scene on each animation frame.
 */
function draw() {
  const tNow = performance.now();
  const W = C * S;
  const H = R * S;

  // 1. ARENA FLOOR & SUBTLE TILE GRID
  ctx.clearRect(0, 0, W, H);

  // Soft radiant board background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#f8fafc");
  bgGrad.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle floor tiles with delicate borders
  for (let i = 0; i < C * R; i++) {
    if (!wall[i]) {
      const x = X(i) * S;
      const y = Y(i) * S;
      const isAlt = (X(i) + Y(i)) % 2;

      ctx.fillStyle = isAlt ? "#ffffff" : "#f7fafd";
      ctx.fillRect(x + 1, y + 1, S - 2, S - 2);

      ctx.strokeStyle = "rgba(226, 232, 240, 0.45)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);
    }
  }

  // 2. VISITED CELLS (Smooth radiant multi-hue gradient)
  for (let i = 0; i < C * R; i++) {
    if (!wall[i] && closed[i]) {
      const x = X(i) * S;
      const y = Y(i) * S;
      const progress = Math.min(1, Math.max(0, ord[i] / Math.max(cnt, 1)));

      // Smooth color transition: Sunset Coral (22) -> Amethyst Rose (310) -> Icy Cyan (195)
      // Orange (explored early) -> cyan (explored late), matching the legend
      const hue = 28 + (190 - 28) * progress;

      const cellGrad = ctx.createRadialGradient(
        x + S / 2,
        y + S / 2,
        1,
        x + S / 2,
        y + S / 2,
        S / 2 + 1
      );
      cellGrad.addColorStop(0, "hsl(" + hue + ", 90%, 88%)");
      cellGrad.addColorStop(1, "hsl(" + hue + ", 85%, 78%)");

      rr(x + 2, y + 2, S - 4, S - 4, 5, cellGrad);

      ctx.strokeStyle = "hsl(" + hue + ", 70%, 58%)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Recent cell ripple
      if (cnt - ord[i] === 0) {
        ctx.strokeStyle = "hsl(" + hue + ", 90%, 55%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + S / 2, y + S / 2, S / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 3. ELEGANT THIN ROUNDED WALLS (WITH SOFT DEPTH & OCCLUSION SHADOWS)
  // Instead of chunky heavy blocks, walls are sleek, rounded labyrinth partitions
  for (let i = 0; i < C * R; i++) {
    if (wall[i]) {
      const x = X(i) * S;
      const y = Y(i) * S;
      const hasFloorBelow = Y(i) < R - 1 && !wall[i + C];

      // Soft ambient floor shadow
      if (hasFloorBelow) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.09)";
        rr(x + 3, y + S - 3, S - 6, 5, 2.5, "rgba(15, 23, 42, 0.09)");
      }

      // Elegant partition wall block (inset by 3px with smooth 7px radius)
      // 3D Extrusion face
      rr(x + 3, y + 4, S - 6, S - 6, 7, "#4a5a7a");

      // Elevated top surface
      const wallGrad = ctx.createLinearGradient(x + 3, y + 2, x + 3, y + S - 5);
      wallGrad.addColorStop(0, "#8191b0");
      wallGrad.addColorStop(1, "#63749a");
      rr(x + 3, y + 2, S - 6, S - 7, 6.5, wallGrad);

      // Specular rim light
      rr(x + 5, y + 3.5, S - 10, 2.5, 1.2, "rgba(255, 255, 255, 0.32)");
    }
  }

  // 4. GLOWING FRONTIER CELLS (IN ALGORITHM'S OWN THEME COLOR)
  const currentTheme = ALG_THEMES[alg] || ALG_THEMES.astar;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const e of fr) {
    if (closed[e.i]) continue;
    const x = X(e.i) * S;
    const y = Y(e.i) * S;
    const pulse = 0.5 + 0.5 * Math.sin(tNow / 220 + e.i * 0.7);

    // Glowing aura in algorithm color
    ctx.save();
    ctx.shadowColor = currentTheme.glow;
    ctx.shadowBlur = 9 + 6 * pulse;
    rr(x + 2, y + 2, S - 4, S - 4, 6, currentTheme.bg);
    ctx.restore();

    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Priority score badge or order rank
    if (alg === "greedy" || alg === "astar") {
      rr(x + S / 2 - 11, y + S / 2 - 8.5, 22, 17, 5, "#ffffff");
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = currentTheme.text;
      ctx.font = "800 12px JetBrains Mono, monospace, sans-serif";
      ctx.fillText(e.pr, x + S / 2, y + S / 2 + 0.5);
    } else if (mode === "play" && $("hint").checked) {
      const v = fr.filter((z) => !closed[z.i]);
      const rank = alg === "bfs" ? v.indexOf(e) + 1 : v.length - v.indexOf(e);
      rr(x + S / 2 - 11, y + S / 2 - 8.5, 22, 17, 5, "#ffffff");
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = currentTheme.text;
      ctx.font = "800 12px JetBrains Mono, monospace, sans-serif";
      ctx.fillText(rank, x + S / 2, y + S / 2 + 0.5);
    }
  }

  // 5. COMET-STYLE FADING TRAIL + RED BACKTRACKING TRAIL
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (hist && hist.length > 1) {
    const totalSteps = hist.length;

    for (let k = 1; k < totalSteps; k++) {
      const a = ctr(hist[k - 1].i);
      const b = ctr(hist[k].i);
      const isBacktrack = hist[k].b;

      const ageRatio = (totalSteps - k) / totalSteps;
      const fadeAlpha = Math.max(0.15, 1 - ageRatio * 0.85);

      if (isBacktrack) {
        // Highly visible coral-red backtracking trail
        ctx.strokeStyle = "rgba(239, 68, 68, " + (0.5 * fadeAlpha + 0.2) + ")";
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(b[0], b[1], 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Comet-style fading luminous forward trail
        const cometWidth = Math.max(2, 4.5 * (1 - ageRatio * 0.5));
        ctx.strokeStyle = "rgba(79, 70, 229, " + (0.5 * fadeAlpha + 0.1) + ")";
        ctx.lineWidth = cometWidth;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();

        // Delicate comet spark
        ctx.fillStyle = "rgba(99, 102, 241, " + (0.6 * fadeAlpha) + ")";
        ctx.beginPath();
        ctx.arc(b[0], b[1], 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 6. FINAL SHORTEST PATH (Neon Ribbon)
  if (pshow > 1 && path && path.length > 0) {
    const activePath = path.slice(0, pshow);

    // Glow pass
    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    activePath.forEach((c, k) => {
      const p = ctr(c);
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    });
    ctx.stroke();

    // Solid core
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.beginPath();
    activePath.forEach((c, k) => {
      const p = ctr(c);
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    });
    ctx.stroke();

    // Highlight line
    ctx.strokeStyle = "#d1fae5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    activePath.forEach((c, k) => {
      const p = ctr(c);
      k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    });
    ctx.stroke();
  }

  // 7. START CELL (S) WITH ANIMATED CONCENTRIC RIPPLE
  const [sx, sy] = ctr(start);
  const rippleTime = (tNow / 1200) % 1;
  const rippleRadius = 11 + 10 * rippleTime;
  const rippleAlpha = Math.max(0, 1 - rippleTime) * 0.45;

  ctx.strokeStyle = "rgba(16, 185, 129, " + rippleAlpha + ")";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, rippleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Emerald launchpad badge
  rr(sx - 11, sy - 11, 22, 22, 7, "#10b981");
  rr(sx - 9, sy - 9, 18, 5, 3, "rgba(255, 255, 255, 0.4)");

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 13px 'Plus Jakarta Sans', Nunito, sans-serif";
  ctx.fillText("S", sx, sy + 1);

  // 8. GOAL CELL WITH ANIMATED WAVING FLAG
  const [gx, gy] = ctr(goal);
  const goalPulse = Math.sin(tNow / 260);

  // Pulsing target aura
  ctx.beginPath();
  ctx.arc(gx, gy, 15 + 3.5 * goalPulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(239, 68, 68, " + (0.16 + 0.08 * goalPulse) + ")";
  ctx.fill();

  rr(gx - 11, gy - 11, 22, 22, 7, "#fee2e2");
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Flagpole
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx - 4, gy + 8);
  ctx.lineTo(gx - 4, gy - 9);
  ctx.stroke();

  // Gold topper ball
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(gx - 4, gy - 9.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Waving cloth pennant banner
  const waveTime = tNow / 180;
  const waveTip = Math.sin(waveTime) * 2.8;
  const waveMid = Math.sin(waveTime - 1.2) * 1.8;

  ctx.beginPath();
  ctx.moveTo(gx - 4, gy - 8);
  ctx.quadraticCurveTo(gx + 3, gy - 8 + waveMid, gx + 11, gy - 4 + waveTip);
  ctx.quadraticCurveTo(gx + 3, gy + 1 + waveMid, gx - 4, gy + 1);
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();

  ctx.strokeStyle = "#fca5a5";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(gx + 1.5, gy - 3.5 + waveMid * 0.5, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // 9. SCANNING TARGET RETICLE IN SEARCH MODE
  if (tgt && st === "search") {
    const [tx, ty] = ctr(tgt.i);
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -tNow / 60;
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(tx, ty, S / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 10. RACE MODE PLAYER AVATAR (YOU)
  if (race && race()) {
    ctx.beginPath();
    ctx.arc(px, py + 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#78350f";
    ctx.font = "900 8.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("YOU", px, py + 0.5);
  }

  // 11. CUTER ANIMATED ROBOT (WALKING BOB, EYES, BLINK & SHADOW)
  const [targX, targY] = ctr(cur);
  const isMoving = Math.hypot(targX - ax, targY - ay) > 0.8;

  // Step bobbing bounce
  const bob = isMoving ? Math.sin(tNow / 75) * 2.2 : Math.sin(tNow / 320) * 0.9;
  const rx = ax;
  const ry = ay + bob;

  // Dynamic ground shadow
  ctx.beginPath();
  ctx.ellipse(
    ax,
    ay + 9,
    Math.max(4, 9 - bob * 0.5),
    Math.max(2, 4.5 - bob * 0.3),
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "rgba(15, 23, 42, " + (isMoving ? 0.22 : 0.16) + ")";
  ctx.fill();

  // Rounded capsule chassis
  const botGrad = ctx.createLinearGradient(rx, ry - 10, rx, ry + 8);
  botGrad.addColorStop(0, "#6366f1");
  botGrad.addColorStop(1, "#4338ca");
  rr(rx - 9.5, ry - 9.5, 19, 18, 7, botGrad);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Headphone ear caps
  ctx.fillStyle = "#818cf8";
  rr(rx - 11.5, ry - 4, 3, 7, 1.5, "#818cf8");
  rr(rx + 8.5, ry - 4, 3, 7, 1.5, "#818cf8");

  // Visor face
  rr(rx - 7, ry - 6.5, 14, 11, 4.5, "#0f172a");

  // Expressive glowing anime eyes
  const isBlinking = Math.sin(tNow / 2200) > 0.96;
  const lookX = Math.sign(targX - ax) * 1.1;
  const lookY = Math.sign(targY - ay) * 0.8;

  if (isBlinking) {
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(rx - 3.5, ry - 1, 2, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rx + 3.5, ry - 1, 2, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(rx - 3.5 + lookX, ry - 1.5 + lookY, 2.5, 0, Math.PI * 2);
    ctx.arc(rx + 3.5 + lookX, ry - 1.5 + lookY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(rx - 4 + lookX, ry - 2.2 + lookY, 0.9, 0, Math.PI * 2);
    ctx.arc(rx + 3 + lookX, ry - 2.2 + lookY, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Antenna with sway and pulsating light
  const sway = isMoving ? Math.sin(tNow / 75) * 1.8 : 0;
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(rx, ry - 9.5);
  ctx.lineTo(rx + sway, ry - 15);
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(rx + sway, ry - 16, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(253, 230, 138, 0.55)";
  ctx.beginPath();
  ctx.arc(rx + sway, ry - 16, 5 + Math.sin(tNow / 200), 0, Math.PI * 2);
  ctx.fill();

  // 12. CONFETTI BURST & FLOATING "GOAL REACHED!" BANNER ON SUCCESS
  if (st === "done" && !won) {
    won = 1;
    bannerStart = tNow;
    const colors = [
      "#4f46e5",
      "#10b981",
      "#f59e0b",
      "#ec4899",
      "#06b6d4",
      "#8b5cf6",
      "#f43f5e",
      "#fbbf24"
    ];
    for (let k = 0; k < 140; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5 + 3.5;
      parts.push({
        x: gx,
        y: gy,
        vx: Math.cos(angle) * speed,
        vy: -Math.abs(Math.sin(angle)) * speed - 2.5,
        c: colors[k % colors.length],
        l: 120,
        maxL: 120,
        shape: k % 3,
        size: Math.random() * 5 + 4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.25
      });
    }
  }

  // Draw celebration particles
  for (const p of parts) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.vx *= 0.985;
    p.rot += p.vrot;
    p.l--;

    const alpha = Math.max(0, p.l / p.maxL);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.scale(Math.cos(p.rot), 1);

    if (p.shape === 0) {
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
    } else if (p.shape === 1) {
      drawStar(0, 0, 5, p.size * 0.8, p.size * 0.4, p.c);
    } else {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Floating Arcade Victory Banner when done
  // The banner shows for ~3.6 s and then fades, so it never hides the maze
  const bannerAge = tNow - bannerStart;
  if (st === "done" && bannerAge < 3600) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, (3600 - bannerAge) / 800));
    const bannerW = 380;
    const bannerH = 66;
    const bannerX = W / 2 - bannerW / 2;
    const bannerY = H - bannerH - 14;

    // Glowing drop shadow
    ctx.shadowColor = "rgba(16, 185, 129, 0.35)";
    ctx.shadowBlur = 16;
    rr(bannerX, bannerY, bannerW, bannerH, 14, "rgba(255, 255, 255, 0.96)");
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#065f46";
    ctx.font = "800 22px 'Plus Jakarta Sans', Nunito, sans-serif";
    ctx.fillText("🎉 GOAL REACHED! 🏁", W / 2, bannerY + 27);

    ctx.fillStyle = "#047857";
    ctx.font = "700 15px 'Plus Jakarta Sans', Nunito, sans-serif";
    ctx.fillText(
      cnt + " Cells Explored • Route Length: " + (path ? path.length - 1 : 0),
      W / 2,
      bannerY + 49
    );
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  parts = parts.filter((p) => p.l > 0);
}
