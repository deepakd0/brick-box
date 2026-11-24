# Brick Box 12-in-1: build spec

An original LCD brick-game handheld with 12 games, in the style of the 1990s "Brick Game" units.
Two web versions share one engine: `laptop.html` (keyboard) and `phone.html` (touch).
Plain HTML/CSS/JS, no dependencies, no network, no external fonts or images; it must work from file:// and from GitHub Pages.
Never use any real game title, console name or brand.

## Files

```
brick-box/
  index.html          chooser: two big links (Laptop / Phone); auto-suggests phone on touch screens
  laptop.html         console + keyboard card (reuse the look of mockup/laptop layout)
  phone.html          full-screen portrait console, touch buttons (mockup/phone layout)
  manifest.webmanifest, sw.js   phone: add to home screen + offline (cache all files)
  css/console.css     the console look, from mockup/console.js styles
  js/core.js          DONE (lead). The game contract. Read it first. Do not change it.
  js/console.js       DOM rendering of LCD, panel, buttons (from mockup/console.js)
  js/sound.js         WebAudio square-wave beeps; sfx names in core.js; mute toggle
  js/shell.js         power-on, menu, game loop, input, game over, hi-scores
  js/games/_blocks.js shared falling-block engine used by A, B, C, L
  js/games/a-block-drop.js ... l-drop-shoot.js   one file per game, each calls BB.register
  tests/smoke.mjs     DONE (lead). `node tests/smoke.mjs [A,B]` must print RESULT: all pass
  mockup/             leave as is
```

Script order in the html: core.js, sound.js, console.js, games/_blocks.js, games/*.js, shell.js.

## Shell behaviour (js/shell.js)

- Power on: a short intro (about 2 s): the playfield fills bottom-to-top row by row, then empties top-to-bottom, with a jingle. Any button skips it.
- Menu: the playfield shows the selected game's letter as a big 5x7-dot letter, with a looping 2-frame demo strip under it (2 small hand-made frames per game). The bezel label shows the game name, the panel shows SPEED, LEVEL and that game's HI-SCORE.
  - Left/Right: previous/next game (A..L, loops). Up: speed +1 (1..10, loops). Down: level +1 (1..10, loops). Fire or Start: start the game.
- Playing: requestAnimationFrame loop calls game.tick(dt) with dt capped at 50 ms, then renders game.view(). Start pauses and resumes (pause icon blinks). Sound toggles mute (speaker icon). Reset goes back to the menu. On/Off blanks the LCD and stops everything; pressing it again shows the intro.
- Auto-repeat: on press send input(action) once; for left/right/down, after holding 170 ms repeat every 55 ms (down every 35 ms). up and fire do not repeat. held(action) reports the current state.
- Game over (game.over becomes true): a wipe (rows fill bottom-to-top, then clear), then the score blinks 3 times, then back to the menu on that game. Save hi-score per game in localStorage key `brickbox.hi.<id>`, plus the last game/speed/level in `brickbox.last`.
- Seed: `BB.rng(Date.now() & 0xffffffff)` per game start.
- Keyboard (laptop): arrows, Space or X = fire (and rotate), Enter = start/pause, M = sound, R = reset, O = on/off. preventDefault on these keys only.
- Touch (phone): pointerdown/pointerup on each button (support multi-touch: hold left and fire together). Haptic `navigator.vibrate(8)` on press if available. No double-tap zoom, no text selection, no pull-to-refresh (`touch-action: none`, `overscroll-behavior: none`). The mouse also works on the on-screen buttons on laptop.html.

## Common rules for all games

- Speed s gives step time BB.stepMs(s). Speed rises by 1 during play at the moment stated per game (max 10); view().speed shows the current speed.
- The level is chosen in the menu, where it sets the starting difficulty. view().level shows the current level.
- Lives, where a game has them: 4 lives, shown as `lives`. On losing a life, the screen flashes (rendered blinking) for 600 ms, then play restarts from a clean screen. The game is over when lives reach 0.
- Score is an integer. Cap it at 999999.
- Use opts.rng only. Call opts.sfx on events.
- view() must not change state. Coordinates: row 0 is the top, col 0 is the left.

## Falling-block family (_blocks.js; games A, B, C, L)

Engine: a 10x20 board. A piece spawns at the top centre (cols 3-6, the rows above the board are allowed). Gravity step = stepMs(speed). Down = soft drop, scoring +1 per row. Fire/up = rotate clockwise, with a simple wall kick (try 0, -1, +1, -2, +2 cols). Left/right move. A piece locks when it cannot fall: it gets one more step of lock delay. Full rows: blink 3 times over 300 ms, then they are removed. Points for 1/2/3/4 rows at once: 100/300/600/1000 x speed. Speed +1 every 10 rows cleared. Game over when a new piece overlaps on spawn. `next` shows the next piece in a 4x4 grid. Randomiser: a 7-bag of the family's piece set.
Start junk: level n adds (n-1) junk rows at the bottom (max 9). Each junk row has 6-8 random filled cells and at least one gap.

- **A Block Drop:** the 7 classic 4-cell shapes (I O T S Z J L).
- **B Odd Blocks:** the 7 classic shapes plus 5 odd ones: single dot, 2-cell bar, 3-cell corner, 5-cell plus, 5-cell U. The bag has 12 pieces.
- **C Rising Floor:** classic shapes. Every 12 pieces locked (8 at speed 6 and above), a new junk row rises from the bottom (one random gap) and pushes everything up. Game over if this pushes cells above row 0.
- **L Drop & Shoot:** classic shapes. Every 6th piece is a "gun": a single cell that can move left/right. Fire shoots up from it: in the column above, it fills the first empty cell under a filled cell, or removes the top block if the column is full to the gun. The gun lasts 20 shots or until down is held for 1 s, then it locks. Full rows clear as usual.

## Action games (D, E, F, G)

- **D Lane Racer:** a road with walls on cols 0 and 9 (dashes of 3 on, 1 off) scrolling down one row per step. Two lanes, as on the classic handhelds: left cols 2-4 and right cols 5-7. The player car is the 4-row car shape `.#.` `###` `.#.` `#.#` at the bottom; left/right switch lanes. Holding up or fire makes the road scroll 2x faster (double points). Enemy cars (same shape) come down in random lanes. Between one car's bottom and the next car's top (in any lane) there are always at least N free rows, N = 10 at level 1 down to 4 at level 10, so there is always a way through. Each car passed scores 10 x speed. Speed +1 every 30 cars. Crash = lose a life.
- **E Tank Duel:** the player tank is a 3x3 tank (the barrel shows the facing direction: a plus shape with the barrel cell sticking out). Arrows move one cell or turn to face that way (the first press turns, then moves). Fire shoots a 1-cell shell, one at a time, moving 1 cell every 40 ms. Enemy tanks (up to 4 at once) enter from the top corners, move and turn at random and fire at a random interval of 1.5-4 s, faster at higher speed. A shell kills an enemy (+100 x speed) or the player (lose a life). Shells cancel each other. Tanks cannot overlap. Level n: enemies to destroy per stage = 10 + 2n. Clearing a stage gives speed +1 and a new stage. Enemy move step = stepMs(speed).
- **F Snake:** the snake starts with length 3 in the middle, heading up, and moves one cell per step (stepMs(speed) x 0.6). Arrows turn (no reversal). One food cell blinks. Eating gives +10 x speed and grows by 1. Hitting a wall or itself = lose a life. Every 10 foods, speed +1. Level n: (n-1) x 2 wall blocks placed in a fixed pattern per level (design 10 patterns: borders, centre bars, corners...). Food never spawns on the snake or a wall.
- **G Frog Hop:** rows from the bottom: 1 start row, 4 road lanes (cars: 2-4 cells long, with lanes alternating direction), 1 safe middle row, 4 river lanes (logs: 3-5 cells long, the frog rides them, falling in the water = death), and the goal row at the top with 5 home slots (cols 1, 3, 5, 7, 9 empty, the rest solid). Lanes move at stepMs(speed) x (1.0..2.0, a different multiplier per lane). The frog is a blinking dot. Arrows hop one cell. A home slot filled = +200 x speed, and the frog returns to the start; all 5 filled = next round, speed +1. Being pushed off screen on a log = death. Level sets the lanes (count, length, min gap): road 1 car of 2-3 (levels 1-3), 2 of 2-3 (4-7), 2 of 3 (8-10); river 2 logs of 3-4 with gap 1 (1-3), 2 of 2-3 (4-6), 1 of 4-5 (7-8), 1 of 3 (9-10), so logs cover about 70% of a lane at level 1 and 30% at level 10. Lives 4.

## Shooter and puzzle games (H, I, J, K)

- **H Brick Breaker:** the bricks fill the top rows: level n gives a layout of 3 + floor(n/2) rows, with a different pattern per level (10 hand-made patterns). The paddle is 3 cells on the bottom row; left/right move it. The ball moves diagonally one cell per step (stepMs(speed) x 0.7). Bounces: walls and ceiling reflect it. Off the paddle: hitting the left cell sends it left, the right cell sends it right, the centre cell reverses dx. A brick hit removes it (+10 x speed) and reflects the ball. Fire launches the ball from the paddle at the start and after a life is lost. A miss = lose a life. All bricks cleared = next pattern, speed +1.
- **I Row Blaster:** a wall of rows comes down from the top: every 6 steps (stepMs(speed) x 6) the wall moves down 1 row and a new random top row appears (5-8 filled cells). The gun is at the bottom (`.#.` / `###`, the top cell is the barrel); left/right move it. Fire shoots a bullet up (up to 2 in flight, 1 cell per 25 ms): it removes the first block it hits (+10). A row that becomes completely empty is removed (+50 x speed). Every 40 blocks shot, speed +1. Game over when the wall reaches the gun row. Level n: the wall starts (n+2) rows deep.
- **J Gap Filler:** the reverse: rows rise from the bottom every (stepMs(speed) x 8) ms, each with 2-4 gaps. The gun is at the top (shape upside down) and fires down. A bullet stops at the first filled cell and fills the empty cell just above it; a bullet fired into an empty column fills the bottom. A row made full is cleared (+100 x speed). Every 15 rows cleared, speed +1. Game over when the stack reaches the gun row. Level n: start with (n+1) rows.
- **K Copy Cat:** the target pattern shows in rows 1-3: a random 3x3..3x5 shape centred. The player builds it in the bottom area: a cursor dot moves left/right/up/down within a 3x5 input box at rows 14-16 and fire toggles a cell. Down while on the bottom row of the box submits. A correct copy scores +50 x speed. Every 5 correct, speed +1. You get stepMs(speed) x 40 ms per pattern; a bar on row 18 shrinks from 10 to 0 cells as time runs out. A timeout or a wrong submit = lose a life. Level n: more cells in the target (3 + n cells, max 12) and the box widens from 3 to 5 columns at level 4 and up.

## Visual rules

LCD: the background is about #9ead86; on cells are #1b1f15 with the classic border plus inner square; off cells are faint (0.12). Reuse the mockup's look exactly. Blinking is done by the game toggling cells in view() based on its own timer, or by the shell for the intro and wipe.
