/* Constants, algorithm descriptions (INFO) and the shared game state. */

const C = 31,
  R = 19,
  S = 28,
  cv = document.getElementById("cv"),
  ctx = cv.getContext("2d"),
  dpr = (window.devicePixelRatio || 1) * 1.5; // render at higher resolution so text/lines stay sharp when the board is enlarged
cv.width = C * S * dpr;
cv.height = R * S * dpr;
ctx.scale(dpr, dpr);
const $ = (id) => document.getElementById(id);
const X = (i) => i % C,
  Y = (i) => (i / C) | 0,
  ctr = (i) => [X(i) * S + S / 2, Y(i) * S + S / 2],
  man = (a, b) => Math.abs(X(a) - X(b)) + Math.abs(Y(a) - Y(b)),
  xy = (i) => "(" + X(i) + "," + Y(i) + ")";
const INFO = {
  bfs: {
    n: "Breadth-First Search",
    s: "Queue, first in first out",
    d: "Spreads like a ripple, finishing every step-distance before going deeper. The robot keeps walking back to pick up the oldest waiting cell, so expect lots of backtracking.",
    c: "Complete",
    o: "Shortest path guaranteed",
    t: "Explores a lot",
  },
  dfs: {
    n: "Depth-First Search",
    s: "Stack, last in first out",
    d: "Dives down one corridor until it hits a dead end, then backs up to the last junction and tries the next turn. Often lucky, but the path it finds is rarely the shortest.",
    c: "Complete (finite maze)",
    o: "Not optimal",
    t: "Wanders deep",
  },
  greedy: {
    n: "Greedy Best-First",
    s: "Priority queue by h = distance to goal",
    d: "Always goes for the waiting cell that looks closest to the goal and ignores how far it already walked. Very fast in open space, but walls can trap it in dead ends.",
    c: "Complete (with visited set)",
    o: "Not optimal",
    t: "Fast, can be fooled",
  },
  astar: {
    n: "A* Search",
    s: "Priority queue by f = g + h",
    d: "Scores each cell by steps walked so far (g) plus straight-line guess to the goal (h). The numbers on the purple cells are these scores. It heads for the goal but still avoids long detours.",
    c: "Complete",
    o: "Shortest path guaranteed",
    t: "Explores least",
  },
};
const ALGS = [
  ["bfs", "BFS", "Queue"],
  ["dfs", "DFS", "Stack"],
  ["greedy", "Greedy", "h(n)"],
  ["astar", "A*", "g(n) + h(n)"],
];
let wall = new Uint8Array(C * R),
  start,
  goal,
  alg = "astar",
  tool = "wall",
  playing = false,
  drag = false;
let fr,
  closed,
  seen,
  best,
  par,
  G,
  ord,
  cur,
  route,
  tgt,
  hist,
  cnt,
  seq,
  st,
  stats,
  path,
  pshow,
  player,
  winner,
  ax,
  ay,
  px,
  py,
  msg;
let mode = "watch",
  score = 0,
  streak = 0,
  tries = 0,
  right = 0,
  parts = [],
  won = 0,
  dsH = "";
