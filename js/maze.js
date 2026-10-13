/* Maze generation (recursive backtracker + extra openings so several routes exist). */

/**
 * Generates a new maze and resets the search.
 */
function genMaze() {
  wall.fill(1);
  const stk = [[1, 1]];
  wall[1 + C] = 0;
  while (stk.length) {
    const [x, y] = stk[stk.length - 1];
    const d = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ]
      .sort(() => Math.random() - 0.5)
      .filter(([dx, dy]) => {
        const a = x + dx,
          b = y + dy;
        return a > 0 && b > 0 && a < C - 1 && b < R - 1 && wall[a + b * C];
      });
    if (!d.length) {
      stk.pop();
      continue;
    }
    const [dx, dy] = d[0];
    wall[x + dx / 2 + (y + dy / 2) * C] = 0;
    wall[x + dx + (y + dy) * C] = 0;
    stk.push([x + dx, y + dy]);
  }
  for (let k = 0; k < 40; k++) {
    wall[
      ((1 + Math.random() * (C - 2)) | 0) +
        ((1 + Math.random() * (R - 2)) | 0) * C
    ] = 0;
  }
  start = 1 + C;
  goal = C - 2 + (R - 2) * C;
  wall[start] = wall[goal] = 0;
  resetSearch();
}
