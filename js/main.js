"use script";

{
  const ctx = document.getElementById("canvas").getContext("2d");

  ctx.beginPath();
  ctx.moveTo(50, 0);
  ctx.lineTo(50, 50);
  ctx.lineTo(0, 50);
  ctx.stroke();

  class Vec2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(b) {
      let a = this;
      return new Vec2(a.x + b.x, a.y + b.y);
    }
    sub(b) {
      let a = this;
      return new Vec2(a.x - b.x, a.y - b.y);
    }
    copy() {
      return new Vec2(this.x, this.y);
    }
    mult(s) {
      return new Vec2(s * this.x, s * this.y);
    }
    mag() {
      return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
  }

  class Ray2 {
    constructor(pos, way) {
      this.pos = pos;
      this.way = way;
    }
    static with2p(begin, end) {
      return new Ray2(begin, end.sub(begin));
    }
    get begin() {
      return this.pos;
    }
    get end() {
      return this.pos.add(this.way);
    }
    intersection(r2) {
      let r1 = this;
      if (Math.abs(r1.way.x) < 0.01) r1.way.x = 0.01;
      if (Math.abs(r2.way.x) < 0.01) r2.way.x = 0.01;
      let t1 = r1.way.y / r1.way.x;
      let t2 = r2.way.y / r2.way.x;
      let x1 = r1.pos.x;
      let x2 = r2.pos.x;
      let y1 = r1.pos.y;
      let y2 = r2.pos.y;
      let sx = (t1 * x1 - t2 * x2 - y1 + y2) / (t1 - t2);
      let sy = t1 * (sx - x1) + y1;
      if (
        sx > Math.min(r1.begin.x, r1.end.x) &&
        sx < Math.max(r1.begin.x, r1.end.x) &&
        sx > Math.min(r2.begin.x, r2.end.x) &&
        sx < Math.max(r2.begin.x, r2.end.x)
      ) {
        return new Vec2(sx, sy);
      } else {
        return null;
      }
    }
  }

  class Player {
    constructor() {
      this.pos = new Vec2(0, 0);
      this.angle = 0;
    }
  }

  class Level {
    constructor() {
      this.walls = [];
      this.tilemap = "";
      this.tileSize = 35;
      this.mapWidth = 0;
      this.mapHeight = 0;
    }
    tileAt(x, y) {
      return this.tilemap[this.mapWidth * y + x];
    }
    addWorldEdges() {
      let s = this.tileSize;
      let w = this.mapWidth;
      let h = this.mapHeight;
      this.walls.push(new Ray2(new Vec2(0, 0), new Vec2(s * w, 0)));
      this.walls.push(new Ray2(new Vec2(0, 0), new Vec2(0, s * h)));
      this.walls.push(new Ray2(new Vec2(s * w, s * h), new Vec2(-s * w, 0)));
      this.walls.push(new Ray2(new Vec2(s * w, s * h), new Vec2(0, -s * h)));
    }
    /**
     * @param {string} tilemap
     * @param {number} width
     * @param {number} height
     * @param {number} size
     */
    addTilemap(tilemap, width, height, size) {
      this.tilemap = tilemap;
      this.mapWidth = width;
      this.mapHeight = height;
      this.tileSize = size;
      let s = size;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let tile = this.tileAt(x, y);
          if (tile === "O" || tile === "X") {
            this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(s, 0)));
            this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(0, s)));
            if (this.tileAt(x, y + 1) === ".") {
              this.walls.push(
                new Ray2(new Vec2(s * x, s * y + s), new Vec2(s, 0))
              );
            }
            if (this.tileAt(x + 1, y) === ".") {
              this.walls.push(
                new Ray2(new Vec2(s * x + s, s * y), new Vec2(0, s))
              );
            }
            if (tile === "X") {
              this.walls.push(new Ray2(new Vec2(s * x, s * y), new Vec2(s, s)));
              this.walls.push(
                new Ray2(new Vec2(s * x + s, s * y), new Vec2(-s, s))
              );
            }
          }
        }
      }
    }
  }

  class Game {
    constructor() {
      this.player = new Player();
      this.level = new Level();
    }
    reset() {
      this.player.pos = new Vec2(118, 201);
      this.player.angle = -Math.PI / 2;
    }
  }

  // グローバル変数 Global variables
  let game;

  function setup() {
    game = new Game();
    game.reset();

    game.level.addTilemap(
      "........" +
        "........" +
        "..OOO..." +
        "..O....." +
        "........" +
        "........" +
        "........" +
        "......O." +
        "OO...OO." +
        "OO...O..",
      8,
      10,
      35
    );
    game.level.addWorldEdges();
  }
  setup();

  let player;

  player = new Player();
  player.pos = new Vec2(100, 200);
  player.angle = Math.PI / 1;

  function line(a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function point(a) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, 5, 0, Math.PI * 2, false);
    ctx.fill();
  }

  function onClick(e) {
    var rect = e.target.getBoundingClientRect();
    player.pos.x = e.clientX - rect.left;
    player.pos.y = e.clientY - rect.top;
    draw();
  }
  canvas.addEventListener("click", onClick, false);

  let walls = game.level.walls;

  let beams = [];

  function playerView() {
    beams = [];
    let index = 0;
    let angle = player.angle - Math.PI / 4;
    for (angle; angle < player.angle + Math.PI / 4; angle += Math.PI / 200) {
      beams.push(
        new Ray2(
          player.pos.copy(),
          new Vec2(Math.cos(angle), Math.sin(angle)).mult(300)
        )
      );
    }
    angle = player.angle - Math.PI / 4;
    for (let beam of beams) {
      // 交点を求める

      let allHitBeamWays = walls
        .map((wall) => beam.intersection(wall))
        .filter((pos) => pos !== null)
        .map((pos) => pos.sub(beam.begin));
      if (allHitBeamWays.length === 0) continue;
      let hitBeam = allHitBeamWays.reduce((a, b) =>
        a.mag() < b.mag() ? a : b
      );
      let hitPos = hitBeam.add(beam.begin);
      point(hitPos.x, hitPos.y);

      let wallDist = hitBeam.mag();
      let wallPerpDist =
        wallDist * Math.cos(angle + (Math.PI / 205) * index - player.angle);
      let lineHeight = 15000 / wallPerpDist;
      let viewRoot = new Vec2(1.5, 250);
      let lineBegin = viewRoot.add(new Vec2(3 * index, -lineHeight / 2));
      let lineEnd = lineBegin.add(new Vec2(0, lineHeight));
      ctx.fillRect(lineBegin.x - 1.5, lineBegin.y, 3, lineHeight);
      index++;
    }
  }
  function drawMap() {
    ctx.clearRect(0, 0, 85, 105);
    for (let wall of walls) {
      line(wall.begin.mult(0.3), wall.end.mult(0.3));
    }
    point(player.pos.mult(0.3));
    for (let beam of beams) {
      ctx.strokeStyle = "rgba(255,255,0,0.6)";
      line(beam.begin.mult(0.3), beam.end.mult(0.3));
      ctx.strokeStyle = "rgba(0,0,0,1)";
    }
  }

  function clearRect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(142, 76, 13)";
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    ctx.fillStyle = "rgb(161, 145, 98)";
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    ctx.fillStyle = "rgba(0,0,0,1)";
  }

  function draw() {
    clearRect();
    playerView();
    drawMap();
  }

  addEventListener("keydown", (event) => {
    console.log(event.keyCode);
    key_code = event.keyCode;
    if (key_code === 67) {
      player.angle += Math.PI / 16;
      draw();
    }
    if (key_code === 90) {
      player.angle -= Math.PI / 16;
      draw();
    }
    if (key_code === 38) {
      player.pos = player.pos.add(
        new Vec2(Math.cos(player.angle), Math.sin(player.angle)).mult(5)
      );
      draw();
    }
    if (key_code === 40) {
      player.pos = player.pos.sub(
        new Vec2(Math.cos(player.angle), Math.sin(player.angle)).mult(5)
      );
      draw();
    }
    if (key_code === 39) {
      player.pos = player.pos.add(
        new Vec2(
          Math.cos(player.angle + Math.PI / 2),
          Math.sin(player.angle + Math.PI / 2)
        ).mult(5)
      );
      draw();
    }
    if (key_code === 37) {
      player.pos = player.pos.add(
        new Vec2(
          Math.cos(player.angle - Math.PI / 2),
          Math.sin(player.angle - Math.PI / 2)
        ).mult(5)
      );
      draw();
    }
  });

  draw();
}
