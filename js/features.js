/* AI Arena: Interactive Extensions (Pseudocode Live Highlighting, Web Audio Synthesizer,
   Dynamic Algorithm Theming, and First-Visit Guide).
   Vanilla JS, offline-ready, no external dependencies. */

(function () {
  // 1. PSEUDOCODE DEFINITIONS
  const PSEUDOCODE = {
    bfs: [
      { id: "init", text: "queue = [start], visited = {start}" },
      { id: "pick", text: "current = queue.dequeue()  // FIFO: oldest" },
      { id: "route", text: "walk / backtrack to current" },
      { id: "goal", text: "if current == Goal: return reconstruct_path()" },
      { id: "arrive", text: "for each unvisited neighbor: queue.enqueue(neighbor)" }
    ],
    dfs: [
      { id: "init", text: "stack = [start], visited = {start}" },
      { id: "pick", text: "current = stack.pop()  // LIFO: newest" },
      { id: "route", text: "walk / backtrack along corridor" },
      { id: "goal", text: "if current == Goal: return reconstruct_path()" },
      { id: "arrive", text: "for each unvisited neighbor: stack.push(neighbor)" }
    ],
    greedy: [
      { id: "init", text: "priority_queue = [start]  // sorted by h(n)" },
      { id: "pick", text: "current = pq.pop_min_h()  // lowest distance to goal" },
      { id: "route", text: "walk / backtrack to current" },
      { id: "goal", text: "if current == Goal: return reconstruct_path()" },
      { id: "arrive", text: "for each neighbor: pq.insert(neighbor, h=dist(neighbor, Goal))" }
    ],
    astar: [
      { id: "init", text: "priority_queue = [start]  // sorted by f = g + h" },
      { id: "pick", text: "current = pq.pop_min_f()  // lowest estimated total cost" },
      { id: "route", text: "walk / backtrack to current" },
      { id: "goal", text: "if current == Goal: return reconstruct_path()" },
      { id: "arrive", text: "for each neighbor: if cost g improved, relax and update f(n)" }
    ]
  };

  const PSEUDO_TITLES = {
    bfs: "BFS Execution Logic",
    dfs: "DFS Execution Logic",
    greedy: "Greedy Best-First Logic",
    astar: "A* Search Execution Logic"
  };

  let activeLineId = "";
  let lineResetTimer = null;

  function getCurrentAlg(forced) {
    if (forced) return forced;
    if (typeof window.alg === "string" && window.alg) return window.alg;
    if (typeof alg === "string" && alg) return alg;
    return "astar";
  }

  function renderPseudocode(forcedAlg) {
    const list = document.getElementById("pseudoList");
    const title = document.getElementById("pseudoTitle");
    if (!list) return;

    const currentAlg = getCurrentAlg(forcedAlg);
    if (title) title.textContent = PSEUDO_TITLES[currentAlg] || "Algorithm Logic";

    const lines = PSEUDOCODE[currentAlg] || PSEUDOCODE.astar;
    list.innerHTML = lines
      .map(
        (line, idx) => `
        <div class="pseudo-line ${line.id === activeLineId ? "active" : ""}" id="psLine_${line.id}" data-id="${line.id}">
          <span class="ps-num">${idx + 1}</span>
          <span class="ps-arrow">▶</span>
          <span class="ps-code">${escapeHtml(line.text)}</span>
        </div>`
      )
      .join("");
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlightLine(lineId) {
    activeLineId = lineId;
    const lines = document.querySelectorAll(".pseudo-line");
    lines.forEach((l) => {
      l.classList.toggle("active", l.dataset.id === lineId);
    });

    clearTimeout(lineResetTimer);
    if (lineId === "arrive" || lineId === "goal") {
      lineResetTimer = setTimeout(() => {
        // Keep active or reset gently
      }, 500);
    }
  }

  // 2. DYNAMIC ALGORITHM THEME ACCENTS & COMPARE WINNER BADGES
  function syncAlgTheme(forcedAlg) {
    const currentAlg = getCurrentAlg(forcedAlg);
    document.body.dataset.alg = currentAlg;
    renderPseudocode(currentAlg);
  }

  function setupAlgThemeListener() {
    const algsContainer = document.getElementById("algs");
    if (algsContainer) {
      algsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-a]");
        if (btn && btn.dataset.a) {
          syncAlgTheme(btn.dataset.a);
        }
      });
    }

    // Wrap setAlg if available globally
    if (typeof window.setAlg === "function") {
      const prevSetAlg = window.setAlg;
      window.setAlg = function (a) {
        prevSetAlg(a);
        syncAlgTheme(a);
      };
    }
  }

  // Animated Stat Counters
  const lastStatValues = {};
  function monitorStatCounters() {
    ["sE", "sW", "sB", "sF", "sP", "sD", "sS", "sK"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new MutationObserver(() => {
        const val = el.textContent;
        if (lastStatValues[id] !== val) {
          lastStatValues[id] = val;
          el.classList.remove("stat-bump");
          void el.offsetWidth; // trigger reflow
          el.classList.add("stat-bump");
        }
      });
      obs.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // Enhanced Compare Table with Animated Bars & Winner Badge
  function enhanceCompareTable(cmpContainer) {
    const table = cmpContainer.querySelector("table");
    if (!table || table.dataset.enhanced) return;
    table.dataset.enhanced = "true";

    // Animate progress bars from 0 to full width
    const bars = table.querySelectorAll(".bar i");
    bars.forEach((bar) => {
      const targetW = bar.style.width;
      bar.style.width = "0%";
      setTimeout(() => {
        bar.style.transition = "width 0.65s cubic-bezier(0.16, 1, 0.3, 1)";
        bar.style.width = targetW;
      }, 50);
    });

    // Find overall best row (shortest path + optimal explored)
    const rows = Array.from(table.querySelectorAll("tr")).filter((r) => r.querySelector("td"));
    let bestRow = null;
    let minExplored = Infinity;

    rows.forEach((r) => {
      const cells = r.querySelectorAll("td");
      if (cells.length >= 4) {
        const expVal = parseInt(cells[1].textContent, 10);
        const isBestPath = cells[3].classList.contains("best");
        if (isBestPath && expVal < minExplored) {
          minExplored = expVal;
          bestRow = r;
        }
      }
    });

    if (!bestRow && rows.length > 0) {
      bestRow = rows[0];
    }

    if (bestRow) {
      const nameCell = bestRow.querySelector("td b");
      if (nameCell && !nameCell.querySelector(".winner-badge")) {
        const badge = document.createElement("span");
        badge.className = "winner-badge";
        badge.innerHTML = "🏆 Best here";
        nameCell.appendChild(badge);
      }
    }
  }

  function setupCompareObserver() {
    const cmpContainer = document.getElementById("cmp");
    if (!cmpContainer) return;

    const cmpObs = new MutationObserver(() => {
      enhanceCompareTable(cmpContainer);
    });
    cmpObs.observe(cmpContainer, { childList: true, subtree: true });

    const btnCmp = document.getElementById("bCmp");
    if (btnCmp) {
      const prevCmpClick = btnCmp.onclick;
      btnCmp.onclick = function (e) {
        if (prevCmpClick) prevCmpClick.call(this, e);
        enhanceCompareTable(cmpContainer);
      };
    }
  }

  // 3. SOUND EFFECTS SYNTHESIZER (Native Web Audio API, OFF by default)
  let audioCtx = null;
  let soundEnabled = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = "sine", gainLevel = 0.04) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(gainLevel, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // Audio context silently handled
    }
  }

  function playChime(freqs, stepDelay = 0.08) {
    if (!soundEnabled) return;
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 0.22, "triangle", 0.06);
      }, idx * stepDelay * 1000);
    });
  }

  function handleSound(event) {
    if (!soundEnabled) return;
    switch (event) {
      case "pick":
        playTone(720, 0.04, "sine", 0.03);
        break;
      case "move":
        playTone(520, 0.035, "sine", 0.025);
        break;
      case "backtrack":
        playTone(340, 0.045, "triangle", 0.03);
        break;
      case "arrive":
        playTone(600, 0.04, "sine", 0.03);
        break;
      case "goal":
        // Celebratory major arpeggio
        playChime([523.25, 659.25, 783.99, 1046.5], 0.09);
        break;
    }
  }

  // 4. GLOBAL ARENA HOOK HANDLER
  window.arenaHook = function (event, data) {
    switch (event) {
      case "pick":
        highlightLine("pick");
        handleSound("pick");
        break;
      case "move":
        highlightLine("route");
        handleSound("move");
        break;
      case "backtrack":
        highlightLine("route");
        handleSound("backtrack");
        break;
      case "arrive":
        highlightLine("arrive");
        handleSound("arrive");
        break;
      case "goal":
        highlightLine("goal");
        handleSound("goal");
        break;
    }
  };

  // 5. SOUND TOGGLE BUTTON
  function setupSoundToggle() {
    const btn = document.getElementById("btnSound");
    if (!btn) return;

    btn.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        getAudioContext();
        btn.classList.add("sound-on");
        btn.innerHTML = `<span class="icon">🔊</span><span>Sound On</span>`;
        playTone(660, 0.1, "sine", 0.05);
      } else {
        btn.classList.remove("sound-on");
        btn.innerHTML = `<span class="icon">🔇</span><span>Sound Off</span>`;
      }
    });
  }

  // 6. HOW TO USE GUIDE MODAL
  function setupGuideModal() {
    const modal = document.getElementById("guideModal");
    const btnOpen = document.getElementById("btnGuide");
    const btnClose = document.getElementById("guideClose");
    const btnDismiss = document.getElementById("guideDismiss");
    if (!modal) return;

    function openModal() {
      modal.classList.add("show");
    }

    function closeModal() {
      modal.classList.remove("show");
    }

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnDismiss) btnDismiss.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Check first visit
    try {
      if (!localStorage.getItem("ai_arena_visited")) {
        localStorage.setItem("ai_arena_visited", "true");
        // Open modal on first launch after a brief delay
        setTimeout(openModal, 400);
      }
    } catch (e) {
      // Local storage fallback for restricted file:// sessions
    }
  }

  // Initialize features
  function initAll() {
    syncAlgTheme();
    setupAlgThemeListener();
    monitorStatCounters();
    setupCompareObserver();
    setupSoundToggle();
    setupGuideModal();
    renderPseudocode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
