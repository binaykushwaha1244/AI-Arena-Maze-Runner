/* Animation loop and start-up. */

let last = performance.now(),
  acc = 0;
/**
 * Main animation loop: runs simulation steps at the chosen speed, then draws.
 */
function loop(t) {
  const dt = Math.min(t - last, 100);
  last = t;
  const spd = +$("spd").value,
    iv = 1000 / spd;
  if (playing) {
    acc += dt;
    let n = 0;
    while (acc >= iv && n < 30 && playing) {
      acc -= iv;
      step();
      n++;
    }
    if (n >= 30) acc = 0;
  }
  const [tx, ty] = ctr(cur),
    k = Math.min(1, (dt / iv) * 1.7);
  ax += (tx - ax) * k;
  ay += (ty - ay) * k;
  const [qx, qy] = ctr(player);
  px += (qx - px) * 0.4;
  py += (qy - py) * 0.4;
  ui();
  draw();
  requestAnimationFrame(loop);
}
genMaze();
setAlg("astar");
requestAnimationFrame(loop);
