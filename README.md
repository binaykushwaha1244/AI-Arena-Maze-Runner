# AI Arena - Maze Runner
Course: 23CSE401 Fundamentals of Artificial Intelligence Laboratory

An interactive game that teaches four search algorithms: **BFS, DFS, Greedy Best-First and A\***.
The robot really walks the maze cell by cell and turns back at dead ends. Nothing is drawn in advance.

## How to run
No install needed. Double-click `index.html` (Chrome or Edge). In VS Code you can also use the Live Server extension.

## Project structure
```
index.html          page layout
css/style.css       light, colourful theme
js/config.js        constants, algorithm descriptions, shared state
js/maze.js          maze generation
js/algorithms.js    BFS / DFS / Greedy / A* search + robot walking  (core of the project)
js/game.js          game logic: "Be the algorithm", scoring, modes
js/render.js        canvas drawing
js/ui.js            buttons, input, stats, Compare table
js/features.js      live pseudocode panel, per-algorithm colour theme, sound, how-to popup
js/main.js          animation loop and start-up
```

## How the algorithms work here
All four share one search loop. The only difference is `pick()`, which chooses the next cell from the frontier:

| Algorithm | Frontier | Picks | Shortest path? |
|---|---|---|---|
| BFS | Queue | oldest cell | Yes |
| DFS | Stack | newest cell | No |
| Greedy | Priority queue by h(n) | lowest distance-to-goal guess | No |
| A* | Priority queue by f(n) = g(n) + h(n) | lowest g + h | Yes (h is Manhattan distance, which never overestimates) |

**Walking and backtracking:** after a cell is chosen, `buildRoute()` finds the path through already explored cells:
go up the search tree to the common ancestor (these are the backtracking steps, shown in red), then down to the chosen cell.

## Game features
- **Watch the AI:** pick an algorithm and watch the robot explore. Draw walls, move start and goal, speed slider up to 300 steps per second.
- **Be the algorithm:** you click the cell the algorithm should explore next. Correct = points and streak, wrong = -5 and an explanation.
- **Race me:** tick the box and steer the yellow dot with the arrow keys or WASD against the robot.
- **Compare all 4:** runs every algorithm on the same maze and shows cells explored, steps walked and path length.
- Live waiting-list strip shows the queue / stack / priority list in order.

## Likely viva questions
- *Why does BFS walk so much more than it explores?* After each expansion the robot walks back to the oldest waiting cell, so it keeps crossing the maze. The "Walked" column in Compare shows this.
- *Why is A\* better than BFS here?* Same shortest path, but the heuristic pulls the search toward the goal, so far fewer cells are explored.
- *Why can Greedy give a longer path?* It ignores the distance already walked (g), so a wall can lead it into a dead end.
- *Is A\* optimal here?* Yes: Manhattan distance on a 4-direction grid is admissible and consistent.
- *Where do the algorithms differ in code?* Only `pick()` and the priority set in `push()` (js/algorithms.js).
