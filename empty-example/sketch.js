let ball;
let obstacles = [];
let colors = ['#FF0055', '#00FBFF', '#FFD700', '#32CD32'];
let score = 0;
let level = 1;
let gameState = "START";
let levelUpTimer = 0; // For showing the "Level Up" message

function setup() {
  createCanvas(800, 600);
  resetGame()
}

function draw() {
  background(20);

  if (gameState === "START") {
    displayMenu("COLOR BOUNCE", "SPACE to Jump | ARROWS to Move\n5 Obstacles = Level Up!");
  } else if (gameState === "PLAY") {
    runGame();
  } else if (gameState === "GAMEOVER") {
    displayMenu("GAME OVER", "Final Score: " + score + "\nPress SPACE to Restart");
  }
}

function runGame() {
  ball.update();
  ball.handleInput(); 
  ball.display();

  // Handle color change delay
  ball.handleColorDelay();

  // Spawn obstacles based on level speed
  let spawnRate = max(60, 150 - (level * 10)); 
  if (frameCount % spawnRate === 0) {
    obstacles.push(new Barrier(0, level));
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].display();

    let hitColor = obstacles[i].checkCollision(ball);
    if (hitColor && hitColor !== ball.color) {
      gameState = "GAMEOVER"; 
    }

    // Scoring and Leveling Logic
    if (!obstacles[i].passed && obstacles[i].y > ball.y) {
      score++;
      obstacles[i].passed = true;
      
      // Trigger Delayed Color Change
      ball.startColorChange();

      // Check for Level Up (Every 5 obstacles)
      if (score % 5 === 0 && level < 10) {
        level++;
        levelUpTimer = 90; // Show message for 90 frames
      }
    }

    if (obstacles[i].y > height) obstacles.splice(i, 1);
  }

  drawHUD();
}

// --- UTILS ---
function resetGame() {
  score = 0;
  level = 1;
  obstacles = [];
  ball = new Ball();
}

function drawHUD() {
  fill(255);
  noStroke();
  textSize(22);
  textAlign(LEFT);
  text("Score: " + score, 20, 40);
  textAlign(RIGHT);
  text("Level: " + level, width - 20, 40);

  if (levelUpTimer > 0) {
    textAlign(CENTER);
    textSize(40);
    fill(255, 255, 0, levelUpTimer * 3);
    text("LEVEL " + level + "!", width/2, height/2);
    levelUpTimer--;
  }
}

function displayMenu(t, s) {
  fill(255);
  textAlign(CENTER);
  textSize(40); text(t, width/2, height/2 - 20);
  textSize(18); text(s, width/2, height/2 + 40);
}

function keyPressed() {
  if (key === ' ') {
    if (gameState === "PLAY") ball.jump();
    else { resetGame(); gameState = "PLAY"; }
  }
}

// --- CLASSES ---

class Ball {
  constructor() {
    this.x = width / 2;
    this.y = height - 150;
    this.v = 0;
    this.radius = 12;
    this.color = colors[0];
    this.changeTimer = 30; // -1 means no pending change
  }

  handleInput() {
    if (keyIsDown(LEFT_ARROW)) this.x -= 8;
    if (keyIsDown(RIGHT_ARROW)) this.x += 8;
    this.x = constrain(this.x, this.radius, width - this.radius);
  }

  update() {
    // Gravity gets stronger as level increases
    let currentGravity = 0.5 + (level * 0.05);
    this.v += currentGravity;
    this.y += this.v;
    if (this.y > height) gameState = "GAMEOVER";
  }

  startColorChange() {
    this.changeTimer = 30; // 30 frame delay
  }

  handleColorDelay() {
    if (this.changeTimer > 0) {
      this.changeTimer--;
    } else if (this.changeTimer === 0) {
      let nextC;
      do { nextC = random(colors); } while (nextC === this.color);
      this.color = nextC;
      this.changeTimer = -1;
    }
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
  }

  jump() { this.v = -10; }
}

class Barrier {
  constructor(y, lvl) {
    this.y = y;
    this.h = 35;
    this.speed = 2.5 + (lvl * 0.8); // Speed up per level
    this.passed = false;
    this.rowColors = shuffle([...colors]);
    
    // Horizontal movement for harder levels
    this.offsetX = 0;
    this.moveDir = random([-1, 1]);
    this.moveSpeed = lvl > 2 ? (lvl * 0.5) : 0; 
  }

  update() {
    this.y += this.speed;
    
    // Barriers move left/right starting at Level 3
    if (level >= 3) {
      this.offsetX += this.moveDir * this.moveSpeed;
      if (abs(this.offsetX) > 50) this.moveDir *= -1;
    }
  }

  display() {
    let segmentWidth = width / 4;
    for (let i = 0; i < 4; i++) {
      fill(this.rowColors[i]);
      // Apply the horizontal offset to drawing
      rect((i * segmentWidth) + this.offsetX, this.y, segmentWidth, this.h);
    }
  }

  checkCollision(ball) {
    if (ball.y - ball.radius < this.y + this.h && ball.y + ball.radius > this.y) {
      let segmentWidth = width / 4;
      // Adjust collision check for horizontal movement
      let relativeX = ball.x - this.offsetX;
      let index = floor(relativeX / segmentWidth);
      index = constrain(index, 0, 3);
      return this.rowColors[index];
    }
    return null;
  }
}