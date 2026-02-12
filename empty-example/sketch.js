let ball;
let obstacles = [];
let colors = ['#FF0055', '#00FBFF', '#FFD700', '#32CD32'];
let score = 0;
let highScore = 0;
let stars = 0; // Currency
let level = 1;

// Shop Variables
let shopOpen = false;
let shopAnim = 0; // 0 to 1
let currentShape = 'circle';
let unlockedShapes = { 'circle': true, 'box': false, 'triangle': false, 'star': false };

let gameState = "START";
let levelUpTimer = 0; // For showing the "Level Up" message
let menuAlpha = 255;
let isTransitioning = false;
let gameOverAnim = 0;

function setup() {
  createCanvas(400, 725);
  resetGame();
}
 
function draw() {
  background(20);

  if (gameState === "START") {
    if (isTransitioning) {
      runGameInternal(false);
      menuAlpha -= 5;
      if (menuAlpha <= 0) {
        menuAlpha = 0;
        isTransitioning = false;
        gameState = "PLAY";
        ball.jump();
      }
    } else {
      runPreview();
    }
    displayMenu("COLOR BOUNCE", "SPACE to Jump | ARROWS to Move\n5 Obstacles = Level Up!");
    
    // Draw Shop Button and Panel
    drawShopButton();
    drawShopPanel();

  } else if (gameState === "PLAY") {
    runGame();
  } else if (gameState === "DYING") {
    runDying();
  } else if (gameState === "GAMEOVER") {
    runGameInternal(false);
    displayGameOverMenu();
  }
}

function runPreview() {
  // Update obstacles for background effect
  let spawnRate = max(60, 150 - (level * 10)); 
  if (frameCount % spawnRate === 0) {
    obstacles.push(new Barrier(0, level));
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update(); // Move normally
    obstacles[i].display();

    // Despawn obstacles before they reach the player start area
    // to ensure a clean start
    if (obstacles[i].y > height - 250) {
      obstacles.splice(i, 1);
      continue;
    }

    if (obstacles[i].y > height) obstacles.splice(i, 1);
  }

  // Hovering Ball Animation
  ball.y = (height - 150) + sin(frameCount * 0.05) * 5;
  ball.display();

  drawHUD();
}

function runDying() {
  ball.update();
  ball.display();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].display();
  }
  
  if (ball.y > height + ball.radius) {
    goToGameOver();
  }

  drawHUD();
}

function goToGameOver() {
  if (score > highScore) {
    highScore = score;
  }
  gameState = "GAMEOVER";
  gameOverAnim = 0;
}

function runGame() {
  runGameInternal(true);
}

function runGameInternal(doUpdate) {
  if (doUpdate) {
    ball.update();
    ball.handleInput(); 
    ball.handleColorDelay();
    
    if (ball.y > height + ball.radius) {
       goToGameOver();
    }
  }
  ball.display();

  if (doUpdate) {
    // Spawn obstacles based on level speed
    let spawnRate = max(60, 150 - (level * 10)); 
    if (frameCount % spawnRate === 0) {
      obstacles.push(new Barrier(0, level));
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (doUpdate) obstacles[i].update();
    obstacles[i].display();

    if (doUpdate) {
      let hitColor = obstacles[i].checkCollision(ball);
      if (hitColor && hitColor !== ball.color) {
        gameState = "DYING";
      }

      // Scoring and Leveling Logic
      if (!obstacles[i].passed && obstacles[i].y > ball.y) {
        score++;
        stars++; // Earn stars
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
  }

  drawHUD();
}

// --- UTILS ---
function resetGame() {
  resetGameplay();
  menuAlpha = 255;
  isTransitioning = false;
}

function resetGameplay() {
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
// --- SHOP FUNCTIONS ---

function drawShopButton() {
  if (shopOpen) return; // Don't draw button if shop is open (visual preference)
  
  let btnX = 20;
  let btnY = height - 60;
  let btnW = 100;
  let btnH = 40;

  // Simple Hover Effect
  if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
    fill(50, 200, 50);
  } else {
    fill(30, 150, 30);
  }
  rect(btnX, btnY, btnW, btnH, 10);
  
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("SHOP", btnX + btnW / 2, btnY + btnH / 2);

  // Show star count near button if needed, or stick to HUD
  textAlign(LEFT, CENTER);
  textSize(14);
  text("Stars: " + stars, btnX + btnW + 10, btnY + btnH / 2);
}

function drawShopPanel() {
  // Animation Logic
  if (shopOpen) {
    shopAnim = lerp(shopAnim, 1, 0.1);
  } else {
    shopAnim = lerp(shopAnim, 0, 0.1);
  }

  if (shopAnim < 0.01) return; // Hide completely

  let panelH = 300;
  let currentY = height - (panelH * shopAnim);

  // Panel Background
  fill(40, 40, 50, 240);
  noStroke();
  rect(0, currentY, width, panelH, 20, 20, 0, 0);

  // Header
  fill(255);
  textAlign(CENTER);
  textSize(24);
  text("SHAPE SHOP", width / 2, currentY + 40);
  textSize(16);
  text("Stars: " + stars, width / 2, currentY + 65);

  // Close Info
  textSize(12);
  fill(150);
  text("Click outside to close", width/2, currentY + 15);

  // Items
  let startX = 60;
  let gap = (width - 120) / 2; // Spacing for 3 items
  let itemY = currentY + 130;

  drawShopItem(startX, itemY, 'box', 10, "Box");
  drawShopItem(startX + gap, itemY, 'triangle', 30, "Tri");
  drawShopItem(startX + gap * 2, itemY, 'star', 50, "Star");
}
function mousePressed() {
  // Only handle clicks in START menu
  if (gameState !== "START") return;

  if (shopOpen) {
    // Check click on Items
    // Panel area is bottom 300
    // But we need exact coordinates reused from drawShopPanel
    let panelH = 300;
    // If click is outside panel, close shop
    if (mouseY < height - panelH) {
      shopOpen = false;
      return;
    }

    let startX = 60;
    let gap = (width - 120) / 2;
    let itemY = height - panelH + 130;
    
    // Check Items (approx 80x80 boxes centered)
    let size = 40; // half size
    
    // Box
    if (dist(mouseX, mouseY, startX, itemY) < size + 10) handleShopClick('box', 10);
    // Triangle
    else if (dist(mouseX, mouseY, startX + gap, itemY) < size + 10) handleShopClick('triangle', 30);
    // Star
    else if (dist(mouseX, mouseY, startX + gap * 2, itemY) < size + 10) handleShopClick('star', 50);

  } else {
    // Check Shop Button
    let btnX = 20, btnY = height - 60, btnW = 100, btnH = 40;
    if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnH) {
      shopOpen = true;
    }
  }
}

function handleShopClick(shape, cost) {
  if (unlockedShapes[shape]) {
    currentShape = shape;
  } else {
    if (stars >= cost) {
      stars -= cost;
      unlockedShapes[shape] = true;
      currentShape = shape;
    }
  }
}


function drawShopItem(x, y, shapeType, cost, label) {
  let isUnlocked = unlockedShapes[shapeType];
  let isSelected = (currentShape === shapeType);

  // Item Box Area (for clicking referencing)
  // Just drawing visuals here
  
  push();
  translate(x, y);

  // Background for Item
  if (isSelected) {
    stroke(0, 255, 0);
    strokeWeight(3);
    fill(60);
  } else if (isUnlocked) {
    stroke(100);
    strokeWeight(1);
    fill(50);
  } else {
    stroke(50);
    strokeWeight(1);
    fill(30);
  }
  rectMode(CENTER);
  rect(0, 0, 80, 80, 10);

  // Icon
  noStroke();
  fill(255);
  if (!isUnlocked) fill(100); // Dim if locked

  if (shapeType === 'box') {
    rect(0, 0, 30, 30);
  } else if (shapeType === 'triangle') {
    triangle(0, -15, -15, 15, 15, 15);
  } else if (shapeType === 'star') {
    drawStarShape(0, 0, 15, 7, 5);
  }

  // Label / Cost
  fill(255);
  noStroke();
  textSize(14);
  textAlign(CENTER);
  text(label, 0, 55);

  if (isUnlocked) {
     if (isSelected) {
       fill(0, 255, 0);
       text("Active", 0, 75);
     } else {
       fill(200);
       text("Select", 0, 75);
     }
  } else {
    if (stars >= cost) fill(255, 255, 0);
    else fill(255, 100, 100);
    text(cost + " Stars", 0, 75);
  }

  pop();
}

function drawStarShape(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = -PI/2; a < TWO_PI - PI/2; a += angle) {
    let sx = x + cos(a) * radius1;
    let sy = y + sin(a) * radius1;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius2;
    sy = y + sin(a + halfAngle) * radius2;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}


function displayMenu(t, s) {
  // Background Overlay
  let bgAlpha = map(menuAlpha, 0, 255, 0, 230);
  fill(0, 0, 0, bgAlpha);
  rect(0, 0, width, height);

  // Text
  fill(255, 255, 255, menuAlpha);
  textAlign(CENTER);
  textSize(40); text(t, width/2, height/2 - 20);
  textSize(18); text(s, width/2, height/2 + 40);
}

function displayGameOverMenu() {
  // Animate background overlay
  let maxAlpha = 230;
  let currentAlpha = map(gameOverAnim, 0, 60, 0, maxAlpha);
  currentAlpha = constrain(currentAlpha, 0, maxAlpha);
  
  fill(0, 0, 0, currentAlpha);
  rect(0, 0, width, height);
  
  // Animate Text (Score and "Game Over")
  // Slide up effect: target Y is height/2. Start Y is height/2 + 50.
  let startY = height/2 + 50;
  let targetY = height/2;
  let progress = map(gameOverAnim, 0, 60, 0, 1);
  progress = constrain(progress, 0, 1);
  
  // Ease out cubic
  let ease = 1 - pow(1 - progress, 3);
  
  let currentY = lerp(startY, targetY, ease);
  let textAlpha = progress * 255;
  
  fill(255, 255, 255, textAlpha);
  textAlign(CENTER);
  textSize(40); 
  text("GAME OVER", width/2, currentY - 20);
  
  textSize(18); 
  text("Final Score: " + score + "\nHigh Score: " + highScore + "\nPress SPACE to Restart\nPress ESC to Home", width/2, currentY + 40);
  
  gameOverAnim++;
}

function keyPressed() {
  if (gameState === "GAMEOVER" && keyCode === ESCAPE) {
    resetGame();
    gameState = "START";
  }

  if (key === ' ') {
    if (gameState === "PLAY") {
      ball.jump();
    } else if (gameState === "START") {
      if (!isTransitioning) {
        resetGameplay();
        isTransitioning = true;
      }
    } else if (gameState === "GAMEOVER") {
      resetGame(); 
      gameState = "PLAY";
      ball.jump();
    }
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
    this.changeTimer = 30;
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
  }

  startColorChange() {
    this.changeTimer = 30; 
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
    
    push();
    translate(this.x, this.y);

    if (currentShape === 'box') {
      rectMode(CENTER);
      rect(0, 0, this.radius * 2, this.radius * 2);
    } 
    else if (currentShape === 'triangle') {
      let r = this.radius * 1.3;
      // Triangle pointing up
      triangle(0, -r, -r, r, r, r);
    } 
    else if (currentShape === 'star') {
      drawStarShape(0, 0, this.radius * 1.3, this.radius * 0.6, 5);
    } 
    else {
      // Default Circle
      ellipse(0, 0, this.radius * 2);
    }
    pop();
  }

  jump() { this.v = -7; }
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