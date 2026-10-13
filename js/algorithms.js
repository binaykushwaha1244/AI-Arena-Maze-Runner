/* THE CORE: BFS, DFS, Greedy and A* search, plus the physical walking logic.
   All four algorithms share one loop; only pick() (which cell next) differs. */

/**
 * Adds a cell to the frontier (waiting list). Priority: Greedy h(n), A* f(n) = g(n) + h(n).
 */
function push(i, g, p) {
  seen[i] = 1;
  fr.push({
    i,
    g,
    p,
    k: seq++,
    pr: alg === "greedy" ? man(i, goal) : g + man(i, goal),
  });
}
/**
 * Chooses the next frontier cell: BFS = front of queue, DFS = top of stack,
 * Greedy/A* = lowest priority value. This one function is the difference between the algorithms.
 */
function pick() {
  while (fr.length) {
    let k = 0;
    if (alg === "dfs") k = fr.length - 1;
    else if (alg !== "bfs")
      for (let j = 1; j < fr.length; j++) {
        const a = fr[j],
          b = fr[k];
        if (
          a.pr < b.pr ||
          (a.pr === b.pr && (alg === "astar" ? a.g > b.g : a.k < b.k))
        )
          k = j;
      }
    const e = fr.splice(k, 1)[0];
    if (!closed[e.i]) return e;
  }
  return null;
}
/**
 * Builds the robot's walking route to the chosen cell using only explored cells:
 * climb to the common ancestor (backtracking), then walk down to the target.
 */
function buildRoute(e) {
  par[e.i] = e.p;
  G[e.i] = e.g;
  const anc = new Map();
  let a = cur,
    n = 0;
  while (a !== -1) {
    anc.set(a, n++);
    a = par[a];
  }
  const down = [];
  let t = e.i;
  while (!anc.has(t)) {
    down.push(t);
    t = par[t];
  }
  const up = [];
  a = cur;
  while (a !== t) {
    a = par[a];
    up.push(a);
  }
  route = [
    ...up.map((i) => ({ i, b: 1 })),
    ...down.reverse().map((i) => ({ i, b: 0 })),
  ];
}
/**
 * Robot reached the chosen cell: mark it explored, stop if it is the goal,
 * otherwise discover its neighbours and put them in the frontier.
 */
function arrive() {
  const i = cur;
  closed[i] = 1;
  ord[i] = ++cnt;
  window.arenaHook && window.arenaHook('arrive', i);
  if (i === goal) {
    window.arenaHook && window.arenaHook('goal', i);
    st = "fin";
    path = [];
    let a = goal;
    while (a !== -1) {
      path.unshift(a);
      a = par[a];
    }
    pshow = 0;
    if (!winner) {
      winner = "AI";
      say(
        mode === "play"
          ? "You found the goal! " +
              cnt +
              " cells explored. Score: " +
              (score + 20)
          : "AI robot reached the flag after exploring " +
              cnt +
              " cells. Drawing its final path...",
        mode === "play" ? "win" : race() ? "lose" : "",
      );
      if (mode === "play") score += 20;
    }
    return;
  }
  const L = [];
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]) {
    const x = X(i) + dx,
      y = Y(i) + dy;
    if (x < 0 || y < 0 || x >= C || y >= R) continue;
    const n = x + y * C;
    if (!wall[n] && !closed[n]) L.push(n);
  }
  if (alg === "dfs") L.reverse();
  let add = 0;
  for (const n of L) {
    if (alg === "astar") {
      if (G[i] + 1 < best[n]) {
        best[n] = G[i] + 1;
        push(n, G[i] + 1, i);
        add++;
      }
    } else if (alg === "dfs") {
      push(n, G[i] + 1, i);
      add++;
    } else if (!seen[n]) {
      push(n, G[i] + 1, i);
      add++;
    }
  }
  if (!add) {
    stats.dead++;
    say(
      "Dead end at " +
        xy(i) +
        "! Nothing new to discover here. Time to turn back.",
    );
  } else
    say(
      "Reached " +
        xy(i) +
        ": found " +
        add +
        " new cell" +
        (add > 1 ? "s" : "") +
        " to explore later.",
    );
}
/**
 * One simulation tick: pick the next cell if needed, then move the robot one cell.
 */
function step() {
  if (st === "done" || st === "fail") return;
  if (st === "fin") {
    pshow += 2;
    if (pshow >= path.length) {
      pshow = path.length;
      st = "done";
      playing = false;
      go();
    }
    return;
  }
  if (!route.length && !tgt) {
    if (mode === "play" && cnt > 0) {
      playing = false;
      go();
      say(
        "Your turn! Click the purple cell this algorithm would explore next.",
      );
      return;
    }
    const e = pick();
    if (!e) {
      st = "fail";
      playing = false;
      say("No path exists. Every reachable cell was explored.", "lose");
      go();
      return;
    }
    tgt = e;
    window.arenaHook && window.arenaHook('pick', e);
    buildRoute(e);
    if (!route.length) {
      arrive();
      tgt = null;
      return;
    }
  }
  if (route.length) {
    const m = route.shift();
    cur = m.i;
    hist.push(m);
    if (m.b) {
      window.arenaHook && window.arenaHook('backtrack', m);
      stats.back++;
      say(
        "Backtracking to " +
          xy(m.i) +
          " to reach the next cell chosen from the " +
          (alg === "bfs"
            ? "queue"
            : alg === "dfs"
              ? "stack"
              : "priority list") +
          ".",
      );
    } else {
      window.arenaHook && window.arenaHook('move', m);
      stats.fwd++;
      if (!(msg || "").startsWith("Walking"))
        say("Walking forward to " + xy(m.i) + ".");
    }
    if (!route.length) {
      tgt = null;
      arrive();
    }
  }
}
/**
 * Headless (no animation) run of one algorithm. Used by "Compare all 4".
 * Returns cells explored, steps walked (with backtracking) and path length.
 */
function sim(a) {
  const cl = new Uint8Array(C * R),
    sn = new Uint8Array(C * R),
    bs = new Float32Array(C * R).fill(1e9),
    P = new Int32Array(C * R).fill(-1),
    g = new Int32Array(C * R),
    dp = new Int32Array(C * R),
    f = [];
  let k = 0,
    cu = start,
    exp = 0,
    walk = 0;
  const mk = (i, gg, p) => {
    sn[i] = 1;
    f.push({
      i,
      g: gg,
      p,
      k: k++,
      pr: a === "greedy" ? man(i, goal) : gg + man(i, goal),
    });
  };
  bs[start] = 0;
  mk(start, 0, -1);
  while (f.length) {
    let q = 0;
    if (a === "dfs") q = f.length - 1;
    else if (a !== "bfs")
      for (let j = 1; j < f.length; j++) {
        const x = f[j],
          y = f[q];
        if (
          x.pr < y.pr ||
          (x.pr === y.pr && (a === "astar" ? x.g > y.g : x.k < y.k))
        )
          q = j;
      }
    const e = f.splice(q, 1)[0];
    if (cl[e.i]) continue;
    P[e.i] = e.p;
    g[e.i] = e.g;
    dp[e.i] = e.p < 0 ? 0 : dp[e.p] + 1;
    let x = cu,
      y = e.i;
    while (x !== y) {
      if (dp[x] >= dp[y]) x = P[x];
      else y = P[y];
      walk++;
    }
    cu = e.i;
    cl[cu] = 1;
    exp++;
    if (cu === goal) return { exp, walk, len: dp[goal] };
    const L = [];
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const nx = X(cu) + dx,
        ny = Y(cu) + dy;
      if (nx < 0 || ny < 0 || nx >= C || ny >= R) continue;
      const n = nx + ny * C;
      if (!wall[n] && !cl[n]) L.push(n);
    }
    if (a === "dfs") L.reverse();
    for (const n of L) {
      if (a === "astar") {
        if (g[cu] + 1 < bs[n]) {
          bs[n] = g[cu] + 1;
          mk(n, g[cu] + 1, cu);
        }
      } else if (a === "dfs") mk(n, g[cu] + 1, cu);
      else if (!sn[n]) mk(n, g[cu] + 1, cu);
    }
  }
  return null;
}
