/* Game logic: reset, the "Be the algorithm" challenge, scoring and mode switching. */

/**
 * Shows a message in the status bar under the maze.
 */
function say(t, k) {
  msg = t;
  const e = $("say");
  e.textContent = t;
  e.className = "say " + (k || "");
}
/**
 * Resets all search data structures and puts the robot back on the start cell.
 */
function resetSearch() {
  closed = new Uint8Array(C * R);
  seen = new Uint8Array(C * R);
  best = new Float32Array(C * R).fill(1e9);
  par = new Int32Array(C * R).fill(-1);
  G = new Int32Array(C * R);
  ord = new Int32Array(C * R);
  parts = [];
  won = 0;
  fr = [];
  cur = start;
  route = [];
  tgt = null;
  hist = [{ i: start, b: 0 }];
  cnt = 0;
  seq = 0;
  st = "search";
  stats = { dead: 0, fwd: 0, back: 0 };
  path = [];
  pshow = 0;
  player = start;
  winner = "";
  playing = false;
  [ax, ay] = ctr(start);
  [px, py] = ctr(start);
  best[start] = 0;
  push(start, 0, -1);
  ui();
  say(
    mode === "play"
      ? "Game mode: press Start, then YOU decide which purple cell to explore next."
      : "Ready. The robot starts at the green S and must reach the flag.",
  );
}
const race = () => $("race").checked;
function go() {
  const b = $("bGo");
  b.textContent =
    st === "done" || st === "fail" ? "Run again" : playing ? "Pause" : "Start";
  b.className = "go" + (playing ? " p" : "");
}
/**
 * "Be the algorithm" mode: checks the cell the player clicked against the rule of the current algorithm.
 */
function choose(i) {
  if (route.length || tgt || playing) {
    say("Wait for the robot to arrive first.");
    return;
  }
  const v = fr.filter((e) => !closed[e.i]);
  if (!v.length) return;
  // A cell can be in the frontier more than once (duplicates), so use the right copy:
  // DFS -> newest copy, A* -> best (lowest) score.
  const copies = v.filter((x) => x.i === i);
  const e = !copies.length
    ? null
    : alg === "dfs"
      ? copies[copies.length - 1]
      : copies.reduce((m, x) => (x.pr < m.pr ? x : m));
  if (!e) {
    say("Click one of the purple frontier cells.");
    return;
  }
  let ok, why;
  const bp = Math.min(...v.map((x) => x.pr));
  if (alg === "bfs") {
    ok = e === v[0];
    why = "BFS uses a queue: always take the OLDEST waiting cell.";
  } else if (alg === "dfs") {
    ok = e === v[v.length - 1];
    why = "DFS uses a stack: always take the NEWEST waiting cell.";
  } else {
    ok = e.pr === bp;
    why =
      (alg === "greedy"
        ? "Greedy takes the lowest h (distance left)."
        : "A* takes the lowest f = g + h.") +
      " The lowest score on the board is " +
      bp +
      ".";
  }
  tries++;
  if (ok) {
    right++;
    streak++;
    const p = 10 + Math.min(streak, 10);
    score += p;
    say("Correct! +" + p + " points. " + why);
    fr.splice(fr.indexOf(e), 1);
    tgt = e;
    window.arenaHook && window.arenaHook('pick', e);
    buildRoute(e);
    if (route.length) playing = true;
    else {
      tgt = null;
      arrive();
    }
  } else {
    streak = 0;
    score = Math.max(0, score - 5);
    say("Not quite, -5 points. " + why, "lose");
  }
}
/**
 * Switches between Watch mode and Game mode.
 */
function setM(m) {
  mode = m;
  score = streak = tries = right = 0;
  $("mWatch").classList.toggle("on", m === "watch");
  $("mPlay").classList.toggle("on", m === "play");
  resetSearch();
}
$("mWatch").onclick = () => setM("watch");
$("mPlay").onclick = () => setM("play");
