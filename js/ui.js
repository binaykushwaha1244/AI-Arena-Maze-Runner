/* Buttons, mouse/keyboard input, live stats, waiting-list strip and the Compare table. */

/**
 * Updates the stats panel and the waiting-list strip.
 */
function ui() {
  $("sE").textContent = cnt;
  $("sW").textContent = stats.fwd + stats.back;
  $("sB").textContent = stats.back;
  $("sF").textContent = fr.filter((e) => !closed[e.i]).length;
  $("sD").textContent = stats.dead;
  $("sS").textContent = score;
  $("sK").textContent = streak;
  $("sA").textContent = tries ? Math.round((100 * right) / tries) + "%" : "-";
  const v = fr.filter((e) => !closed[e.i]);
  let o = v.slice();
  if (alg === "dfs") o.reverse();
  else if (alg !== "bfs")
    o.sort((a, b) => a.pr - b.pr || (alg === "astar" ? b.g - a.g : a.k - b.k));
  let h =
    '<b class="dsl">' +
    {
      bfs: "Queue",
      dfs: "Stack",
      greedy: "Priority by h",
      astar: "Priority by f",
    }[alg] +
    " (next to last):</b>" +
    o
      .slice(0, 14)
      .map(
        (e, k) =>
          '<span class="chip' +
          (k ? "" : " nx") +
          '">' +
          xy(e.i) +
          (alg === "greedy" || alg === "astar" ? "<em>" + e.pr + "</em>" : "") +
          "</span>",
      )
      .join("") +
    (o.length > 14
      ? '<span class="chip">+' + (o.length - 14) + " more</span>"
      : "");
  if (mode === "play" && !$("hint").checked)
    h =
      '<b class="dsl">Hints are off. Use the algorithm rule from the info card.</b>';
  if (h !== dsH) {
    dsH = h;
    $("ds").innerHTML = h;
  }
  $("sP").textContent = st === "done" ? path.length - 1 : "-";
  go();
}
/**
 * Selects an algorithm and shows its description card.
 */
function setAlg(a) {
  alg = a;
  document
    .querySelectorAll("#algs button")
    .forEach((b) => b.classList.toggle("on", b.dataset.a === a));
  const f = INFO[a];
  $("info").innerHTML =
    "<h2>" +
    f.n +
    "</h2><p><b>Waiting list:</b> " +
    f.s +
    "</p><p>" +
    f.d +
    '</p><span class="tag">' +
    f.c +
    '</span><span class="tag' +
    (f.o[0] === "N" ? " n" : "") +
    '">' +
    f.o +
    '</span><span class="tag n">' +
    f.t +
    "</span>";
  resetSearch();
}
ALGS.forEach(([a, n, s]) => {
  const b = document.createElement("button");
  b.dataset.a = a;
  b.innerHTML = n + "<small>" + s + "</small>";
  b.onclick = () => setAlg(a);
  $("algs").append(b);
});
/**
 * Converts a mouse position to a maze cell index.
 */
function cell(e) {
  const r = cv.getBoundingClientRect();
  return (
    Math.min(
      C - 1,
      Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * C)),
    ) +
    Math.min(
      R - 1,
      Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * R)),
    ) *
      C
  );
}
/**
 * Wall editing and moving of the start/goal with the mouse.
 */
function edit(e) {
  const i = cell(e);
  if (tool === "wall" && i !== start && i !== goal) wall[i] = 1;
  else if (tool === "erase") wall[i] = 0;
  else if (tool === "start" && !wall[i] && i !== goal) start = i;
  else if (tool === "goal" && !wall[i] && i !== start) goal = i;
  resetSearch();
}
cv.onpointerdown = (e) => {
  if (mode === "play" && cnt > 0 && st === "search") {
    choose(cell(e));
    return;
  }
  drag = true;
  cv.setPointerCapture(e.pointerId);
  edit(e);
};
cv.onpointermove = (e) => {
  if (drag) edit(e);
};
cv.onpointerup = () => (drag = false);
[
  ["tWall", "wall"],
  ["tErase", "erase"],
  ["tStart", "start"],
  ["tGoal", "goal"],
].forEach(
  ([id, t]) =>
    ($(id).onclick = () => {
      tool = t;
      ["tWall", "tErase", "tStart", "tGoal"].forEach((x) =>
        $(x).classList.toggle("on", x === id),
      );
    }),
);
$("bMaze").onclick = genMaze;
$("bOpen").onclick = () => {
  wall.fill(0);
  for (let i = 0; i < C * R; i++)
    if (X(i) === 0 || Y(i) === 0 || X(i) === C - 1 || Y(i) === R - 1)
      wall[i] = 1;
  resetSearch();
};
$("bReset").onclick = resetSearch;
$("bStep").onclick = () => {
  playing = false;
  step();
};
$("bGo").onclick = () => {
  if (st === "done" || st === "fail") resetSearch();
  playing = !playing;
  if (playing && msg && msg.startsWith("Ready")) say("Exploring...");
  go();
};
addEventListener("keydown", (e) => {
  const m = {
    ArrowUp: [0, -1],
    w: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
  }[e.key];
  if (!m || !race()) return;
  e.preventDefault();
  if (!playing || winner === "You") return;
  const x = X(player) + m[0],
    y = Y(player) + m[1];
  if (x < 0 || y < 0 || x >= C || y >= R || wall[x + y * C]) return;
  player = x + y * C;
  if (player === goal && !winner) {
    winner = "You";
    score += 50;
    say("You win! You beat the AI to the flag. +50 points.", "win");
  }
});
$("race").onchange = () => {
  resetSearch();
  if (race())
    say(
      "Race mode: press Start, then steer the yellow dot with arrow keys or WASD.",
    );
};
$("bCmp").onclick = () => {
  const rows = ALGS.map(([a, n]) => ({ a, n, r: sim(a) })),
    ok = rows.filter((x) => x.r);
  if (!ok.length) {
    $("cmp").innerHTML = '<p class="p2">No path exists in this maze.</p>';
    return;
  }
  const mx = Math.max(...ok.map((x) => x.r.exp)),
    mn = Math.min(...ok.map((x) => x.r.exp)),
    opt = Math.min(...ok.map((x) => x.r.len)),
    col = {
      bfs: "#0ea5e9",
      dfs: "#f59e0b",
      greedy: "#d946ef",
      astar: "#2bb39a",
    };
  $("cmp").innerHTML =
    "<table><tr><th>Algorithm</th><th>Explored</th><th>Walked</th><th>Path</th></tr>" +
    rows
      .map((x) =>
        x.r
          ? "<tr><td><b>" +
            x.n +
            '</b></td><td class="' +
            (x.r.exp === mn ? "best" : "") +
            '">' +
            x.r.exp +
            "</td><td>" +
            x.r.walk +
            '</td><td class="' +
            (x.r.len === opt ? "best" : "") +
            '">' +
            x.r.len +
            '</td></tr><tr><td colspan="4"><div class="bar"><i style="width:' +
            (100 * x.r.exp) / mx +
            "%;background:" +
            col[x.a] +
            '"></i></div></td></tr>'
          : "",
      )
      .join("") +
    '</table><p class="p2">Green numbers are the best in each column. Explored = cells expanded, Walked = every step the robot takes including backtracking, Path = length of the route found. Only BFS and A* guarantee the shortest path.</p>';
};
