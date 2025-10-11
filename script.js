const gameBoard = document.querySelector('#gameBoard');
const context = gameBoard.getContext('2d');

const gameScore = document.querySelector('#gameScore');

const resetBtn = document.querySelector('#resetBtn');
const pauseBtn = document.querySelector('#pauseBtn');
const clearScoreBtn = document.querySelector('#clearScoreBtn');

const changeSkinSelect = document.querySelector('#changeSkinSelect');

const leftBtn = document.querySelector('#leftBtn');
const rightBtn = document.querySelector('#rightBtn');
const shootBtn = document.querySelector('#shootBtn');

const unitSize = 25;

const BACKGROUNDS = [
    "Assets/Images/Backgrounds/space-background.png",
    "Assets/Images/Backgrounds/space-background-1.png",
    "Assets/Images/Backgrounds/space-background-2.png",
    "Assets/Images/Backgrounds/space-background-3.mp4",
    "Assets/Images/Backgrounds/space-background-4.png",
    "Assets/Images/Backgrounds/space-background-5.png",
    "Assets/Images/Backgrounds/space-background-7.gif",
    "Assets/Images/Backgrounds/special-background.png",
];

const backGroundVideo = document.createElement("video");
backGroundVideo.src = BACKGROUNDS[3];

backGroundVideo.playsInline = true;
backGroundVideo.loop = true;
backGroundVideo.muted = true;

const backGroundImage = new Image();
backGroundImage.src = BACKGROUNDS[1];

const LEVEL_SETTINGS = [
    {
        scoreThreshold: 0,
        backgroundSrc: BACKGROUNDS[1],
        alienSpeed: 4.5,
        shootCooldown: 300,
    },
    {
        scoreThreshold: 500,
        backgroundSrc: BACKGROUNDS[5], 
        alienSpeed: 6.0,               
        shootCooldown: 300,
    },
    {
        scoreThreshold: 1000,
        backgroundSrc: BACKGROUNDS[7], 
        alienSpeed: 7.5,               
        shootCooldown: 300,
    },
    {
        scoreThreshold: 1500,
        backgroundSrc: BACKGROUNDS[2], 
        alienSpeed: 9,               
        shootCooldown: 250,
    },
    {
        scoreThreshold: 2000,
        backgroundSrc: BACKGROUNDS[6],
        alienSpeed: 10.5,              
        shootCooldown: 250,
    },
    {
        scoreThreshold: 2500,
        backgroundSrc: BACKGROUNDS[3],
        alienSpeed: 12,              
        shootCooldown: 250,
    },
];

const SHIP_SKINS = [
    "Assets/Images/Ships/spaceship.png",
    "Assets/Images/Ships/spaceship-1.png",
    "Assets/Images/Ships/spaceship-2.png"
];

const IMAGES = {
    ship: SHIP_SKINS[0],
    enemyShip: "Assets/Images/Ships/enemy-spaceship.png",
    explosion: "Assets/Images/explosion.png",
    shoot: "Assets/Images/shoot.png",
    planet: "Assets/Images/planet.png",
    pumpkin: "Assets/Images/pumpkin.png"
};

const loadedImages = {};

const ship = new Image();
ship.src = SHIP_SKINS[0];

const enemyShip = new Image();
enemyShip.src = "Assets/Images/Ships/enemy-spaceship.png";

const SOUNDS = {
    shooting: "Assets/Sounds/shoot.mp3",
    explosion: "Assets/Sounds/explosion.mp3",
    gameOver: "Assets/Sounds/game-over.mp3",
    special: "Assets/Sounds/special-sound.mp3"
};

const loadedSounds = {};

let running = false;
let paused = false;

let redrawFrame = true;

let buttonPressed = {
    left: false,
    right: false,
    shoot: false
};

let currentLevel = 1;

let levelUpMessage = null;
let levelUpTimer = null;

let score = 0;

let xVelocity = 0;
let touchXVelocity = 0;

let shipWidth = unitSize * 3;
let shipHeight = unitSize * 3;

let shipX = 0;
let shipY = 0;

let bulletArray = [];

let bulletVelocityY = -20;

let shootFlash = null;

let canShoot = true;
let shootCooldown = 300;

let alienArray = [];

let alienVelocityY = 4.5;

let alienWidth = unitSize * 3;
let alienHeight = unitSize * 3;

let explosionArray = [];

let animationFrameId;

let enemyInterval;
let speedInterval;

let lastTime = 0;

function resizeCanvas() {
    gameBoard.width = Math.min(window.innerWidth * 0.95, 500); 
    gameBoard.height = Math.min(window.innerHeight * 0.7, 550); 
}

function resizeShipPosition() {
    shipX = gameBoard.width / 2 - shipWidth / 2;
    shipY = gameBoard.height - shipHeight * 1.5;
}

function loadAssets(callBack) {
    let totalAssets = Object.keys(IMAGES).length + 1;
    let loadedCount = 0;

    function checkLoaded() {
        loadedCount++;
        if(loadedCount === totalAssets) callBack();
    }

    for(const key in IMAGES) {
        loadedImages[key] = new Image();
        loadedImages[key].src = IMAGES[key];
        loadedImages[key].onload = checkLoaded;
        loadedImages[key].onerror = checkLoaded;
    }

    backGroundImage.onload = checkLoaded;
    backGroundImage.onerror = checkLoaded;

    for(const key in SOUNDS){
        loadedSounds[key] = new Audio(SOUNDS[key]);
    }
}

window.addEventListener("resize", () => {
    resizeCanvas();
    resizeShipPosition();
});

window.addEventListener("load", () => {
    resizeCanvas();
    resizeShipPosition();
    applyLevelSettings(0);
    displayScores();

    const savedSkin = Number(localStorage.getItem("selectedSkin"));
    if(!isNaN(savedSkin)){
        changeSkinSelect.value = savedSkin;
        ship.src = SHIP_SKINS[savedSkin];
    }

    loadAssets(() => {
        gameStart();
    })
});

window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault(); 
    }
    changeDirection(event);
});

window.addEventListener("keyup", stopShip);

window.addEventListener("keyup", shootBullet);

window.addEventListener("keydown", (event) => {
    if(event.code === "KeyP") {
        togglePause();
    }
});

function updateVelocity() {
    touchXVelocity = 0;
    if(buttonPressed.left) touchXVelocity -= unitSize;
    if(buttonPressed.right) touchXVelocity += unitSize;
    if(buttonPressed.shoot && canShoot) shootBullet({ code: 'Space' });
}

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    buttonPressed.left = true;
    updateVelocity();
});
leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    buttonPressed.left = false;
    updateVelocity();
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    buttonPressed.right = true;
    updateVelocity();
});
rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    buttonPressed.right = false;
    updateVelocity();
});

shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    buttonPressed.shoot = true;
    updateVelocity();
});
shootBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    buttonPressed.shoot = false;
    updateVelocity();
});

function changeSkin(index) {
    const newShip = new Image();
    newShip.src = SHIP_SKINS[index];

    newShip.onload = () => {
        ship.src = SHIP_SKINS[index];
        localStorage.setItem("selectedSkin", index);
    }
}

changeSkinSelect.addEventListener("change", function() {
    changeSkin(this.value);
});

resetBtn.addEventListener("click", resetGame);

pauseBtn.addEventListener("click", togglePause);

clearScoreBtn.addEventListener("click", clearScore);

function gameStart(){
    running = true;
    gameScore.textContent = score;

    resizeShipPosition();

    startIntervals();

    document.querySelector('#loadingScreen').style.display = 'none';

    animationFrameId = requestAnimationFrame(nextTick); 
}
function startIntervals() {
    if(!enemyInterval) {
        enemyInterval = setInterval(generateEnemy, 1000);
    }
    if(!speedInterval){
        speedInterval = setInterval(() => {
            alienVelocityY += 0.5;
        }, 5000);
    }
}
function nextTick(timeStamp){
    if(!lastTime) lastTime = timeStamp;
    const deltaTime = (timeStamp - lastTime) / 1000;
    lastTime = timeStamp;

    if(running && !paused){
        moveShip(deltaTime);
        moveEnemies(deltaTime);
        checkCollisions();
        checkUpgrades();

        if(redrawFrame) {
            drawBackGround();
            drawShip();
            drawBullet(deltaTime);
            drawShootFlash();
            drawEnemies();
            drawExplosion();
            drawLevelUpMessage();
            drawHud();

            redrawFrame = false;
        }
        
        animationFrameId = requestAnimationFrame(nextTick);
    }
    else {
        drawBackGround();
        drawShip();
        drawBullet();
        drawEnemies();
        drawHud();

        if(!running) {
            drawGameOverScreen();
        } else if (paused) {
            drawPauseScreen();
        }
    }
}
function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({ value: score, date: new Date().toLocaleString() });
    localStorage.setItem('scores', JSON.stringify(scores));
}
function getMaxScore() {
    let scores = JSON.parse(localStorage.getItem('scores')) || [];
    if(scores.length === 0) return 0;
    return Math.max(...scores.map(s => s.value));
}
function displayScores() {
    const scoreTableBody = document.querySelector('#scoreTable tbody');
    scoreTableBody.innerHTML = '';

    const scores = JSON.parse(localStorage.getItem('scores')) || [];

    scores.sort((a, b) => b.value - a.value);

    scores.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${s.value}</td><td>${s.date}</td>`;
        scoreTableBody.appendChild(row);
    });
}
function resumeGame() {
    if(paused) {
        paused = false;

        lastTime = 0;

        startIntervals();

        animationFrameId = requestAnimationFrame(nextTick);
    }
}
function togglePause() {
    if(!running) return;

    if(paused){
        pauseBtn.textContent = "Pause";
        resumeGame();
    } else {
        paused = true;
        pauseBtn.textContent = "Resume";

        clearInterval(enemyInterval);
        enemyInterval = null; 
        
        clearInterval(speedInterval);
        speedInterval = null;
    }
}
function clearScore() {
    localStorage.removeItem('scores');
    displayScores();
}
function moveShip(deltaTime){
    if (isNaN(shipX)) {
        shipX = gameBoard.width / 2 - shipWidth / 2;
    }

    const prevX = shipX;

    shipX += (xVelocity + touchXVelocity) * deltaTime * 15;

    if(shipX < 0){
        shipX = 0;
    }else if(shipX + (shipWidth) > gameBoard.width){
        shipX = gameBoard.width - (shipWidth);
    }

    if(shipX !== prevX) redrawFrame = true;
}
function drawGameOverScreen() {
    console.log("Game over!");

    if(score > 0) {
        saveScore(score);
        displayScores();
    }
        
    context.fillStyle = "white";
    context.font = "48px Arial"
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Game over!", gameBoard.width / 2, gameBoard.height / 2);

    const clonedGameOverSound = loadedSounds['gameOver'].cloneNode();
    clonedGameOverSound.play();
}
function drawPauseScreen(){
    context.fillStyle = "white";
    context.font = "48px Arial"
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillText("Game paused!", gameBoard.width / 2, gameBoard.height / 2);
}
function drawHud() {
    context.fillStyle = "white";
    context.font = "20px Arial";
    context.textAlign = "left";
    context.textBaseline = "top";

    context.fillText("Level " + currentLevel, 10, 10);

    context.textAlign = "right";
    
    context.fillText("Best score: " + getMaxScore(), gameBoard.width - 10, 10);

    if(score >= getMaxScore()) {
        context.fillStyle = "gold";
    } else {
        context.fillStyle = "white";
    }

    context.fillText("Score: " + score, gameBoard.width - 10, 35);
}
function showLevelUpMessage(level) {
    levelUpMessage = "LEVEL " + level + "!";
    clearTimeout(levelUpTimer);
    levelUpTimer = setTimeout(() => {
        levelUpMessage = null;
    }, 1000)
}
function drawLevelUpMessage() {
    if(levelUpMessage) {
        context.fillStyle = "white";
        context.font = "48px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillText(levelUpMessage, gameBoard.width / 2, gameBoard.height / 2);
    }
}
function drawShip(){
    context.drawImage(loadedImages['ship'], shipX, shipY, shipWidth, shipHeight); 
}
function drawBackGround(){
    if(currentLevel === 5 && backGroundVideo.readyState >= 2){
        if(backGroundVideo.paused) backGroundVideo.play();
        context.drawImage(backGroundVideo, 0, 0, gameBoard.width, gameBoard.height);
    } else {
        context.drawImage(backGroundImage, 0, 0, gameBoard.width, gameBoard.height);
    }
}
function drawEnemies(){
    for(let i = 0; i < alienArray.length; i++){
        let alien = alienArray[i];
        if(alien.alive){
            switch(alien.type) {
                case 'alien':
                    context.drawImage(loadedImages['enemyShip'], alien.x, alien.y, alien.width, alien.height);
                    break;
                case 'pumpkin':
                    context.drawImage(loadedImages['pumpkin'], alien.x, alien.y, alien.width, alien.height);
                    break;
                case 'planet': 
                    context.drawImage(loadedImages['planet'], alien.x, alien.y, alien.width, alien.height);
                    break;
            }
        }
    }
}
function drawExplosion(){
    for(let i = explosionArray.length - 1; i >= 0; i--) {
        const exp = explosionArray[i];

        context.drawImage(loadedImages['explosion'], exp.x, exp.y, exp.width, exp.height);

        exp.timer--;

        if(exp.timer <= 0){
            explosionArray.splice(i, 1);
        }
    }
}
function drawShootFlash() {
    if(shootFlash) {
        context.drawImage(loadedImages['shoot'], shootFlash.x, shootFlash.y, unitSize * 2, unitSize * 2);
        shootFlash.timer--;

        if(shootFlash.timer <= 0) {
            shootFlash = null;
        }
    }
}
function moveEnemies(deltaTime) {
    for(let i = 0; i < alienArray.length; i++){
        let alien = alienArray[i];
        if(alien.alive){
            const prevY = alien.y;
            alien.y += alienVelocityY * deltaTime * 15;

            if (alien.y !== prevY) redrawFrame = true;

            if(alien.y + alien.height >= gameBoard.height){
                running = false;
            }

            if(
                alien.x < shipX + shipWidth &&
                alien.x + alien.width > shipX &&
                alien.y < shipY + shipHeight &&
                alien.y + alien.height > shipY
            ){
                running = false;
            }
        }
    }

    alienArray = alienArray.filter(a => a.alive && a.y < gameBoard.height);
}
function changeDirection(event){
    const keyPressed = event.keyCode;

    const LEFT = 37;
    const RIGHT = 39;

    switch(true){
        case(keyPressed === LEFT):
        xVelocity = -unitSize;
        break;
        case(keyPressed === RIGHT):
        xVelocity = unitSize;
        break;
    }
}
function stopShip(event){
    const keyPressed = event.keyCode;

    const LEFT = 37;
    const RIGHT = 39;

    switch(true){
        case(keyPressed === LEFT):
        xVelocity = 0;
        break;
        case(keyPressed === RIGHT):
        xVelocity = 0;
        break;
    }
}
function shootBullet(event){
    if(event.code == "Space" && canShoot){
        canShoot = false;

        let bullet = {
            x: shipX + unitSize + 12,
            y: shipY,
            width: unitSize / 8,
            height: unitSize / 2,
            used: false
        }

        const clonedShootingSound = loadedSounds['shooting'].cloneNode();
        clonedShootingSound.play();

        shootFlash = {
            x: shipX + unitSize / 2,
            y: shipY - 50,
            timer: 2
        }

        bulletArray.push(bullet);

        redrawFrame = true;

        setTimeout(() => {
            canShoot = true;
        }, shootCooldown);
    }
}
function drawBullet(deltaTime){
    for(let i = 0; i < bulletArray.length; i++){
        let bullet = bulletArray[i];


        bullet.y += bulletVelocityY * deltaTime * 15;

        context.fillStyle = "white";

        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    bulletArray = bulletArray.filter(b => b.y + b.height > 0);
}
function generateEnemy(){
    let randomX = Math.floor(Math.random() * (gameBoard.width - alienWidth));

    const typeChance = Math.random();
    let enemy;

    if(typeChance < 0.05){
        enemy = {
            x: randomX,
            y: 0,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            type: 'planet',
            points: 100
        }
        alienArray.push(enemy);
    } else if (typeChance < 0.2) {
        enemy = {
            x: randomX,
            y: 0,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            type: 'pumpkin',
            points: 50,
        };
        alienArray.push(enemy);
    } else {
        enemy = {
            x: randomX,
            y: 0,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            type: 'alien',
            points: 10
        }
        alienArray.push(enemy);
    }
}
function checkCollisions() {
    for(let i = 0; i < alienArray.length; i++){
        let alien = alienArray[i];
        for(let j = 0; j < bulletArray.length; j++){
            let bullet = bulletArray[j];

            if(alien.alive &&
                bullet.y < alien.y + alien.height && 
                bullet.y + bullet.height > alien.y &&
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x
            ){
                alien.alive = false;
                bulletArray.splice(j, 1);

                if(alien.type === 'alien'){
                    const clonedExplosionSound = loadedSounds['explosion'].cloneNode();
                    clonedExplosionSound.play();
                } else {
                    const clonedSpecialSound = loadedSounds['special'].cloneNode();
                    clonedSpecialSound.play();
                }

                explosionArray.push({
                    x: alien.x + alien.width / 2 - alien.width / 2,
                    y: alien.y + alien.height / 2 - alien.width / 2,
                    width: alien.width,
                    height: alien.height,
                    timer: 2
                });

                score += alien.points;
                gameScore.textContent = score;
                break;
            }
        }
    }

    alienArray = alienArray.filter(a => a.alive && a.y < gameBoard.height);
}
function checkUpgrades() {
    const nextLevelIndex = currentLevel;

    if(nextLevelIndex < LEVEL_SETTINGS.length){
        const nextLevelSettings = LEVEL_SETTINGS[nextLevelIndex];

        if(score >= nextLevelSettings.scoreThreshold) {
            applyLevelSettings(nextLevelIndex)
        }
    }
}
function applyLevelSettings(levelIndex) {
    const settings = LEVEL_SETTINGS[levelIndex];

    currentLevel = levelIndex + 1;

    showLevelUpMessage(currentLevel);

    alienVelocityY = settings.alienSpeed;
    shootCooldown = settings.shootCooldown;

    if(settings.backgroundSrc.endsWith('.mp4')){
        backGroundVideo.src = settings.backgroundSrc; 
        backGroundVideo.load();
    } else {
        backGroundImage.src = settings.backgroundSrc;

        if(!backGroundVideo.paused) {
            backGroundVideo.pause();
            backGroundVideo.currentTime = 0;
        }
    }
}
function resetGame(){
    document.querySelector('#loadingScreen').style.display = 'flex';

    setTimeout(() => {
        running = false;
        paused = false;
        redrawFrame = true;

        bulletArray = [];
        alienArray = [];

        score = 0;
        gameScore.textContent = score;

        if(!backGroundVideo.paused){
            backGroundVideo.pause();
            backGroundVideo.currentTime = 0;
        }

        clearInterval(enemyInterval);
        enemyInterval = null;
        clearInterval(speedInterval);
        speedInterval = null;
        cancelAnimationFrame(animationFrameId);
        lastTime = 0;

        applyLevelSettings(0);
        running = true;
        gameStart();
    }, 300);
}
