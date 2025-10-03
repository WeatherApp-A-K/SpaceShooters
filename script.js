const gameBoard = document.querySelector('#gameBoard');
const context = gameBoard.getContext('2d');

const gameScore = document.querySelector('#gameScore');

const resetBtn = document.querySelector('#resetBtn');
const pauseBtn = document.querySelector('#pauseBtn');

const changeSkinSelect = document.querySelector('#changeSkinSelect');

const leftBtn = document.querySelector('#leftBtn');
const rightBtn = document.querySelector('#rightBtn');
const shootBtn = document.querySelector('#shootBtn');

const unitSize = 25;

const backGrounds = [
    "Assets/Images/Backgrounds/space-background.png",
    "Assets/Images/Backgrounds/space-background-1.png",
    "Assets/Images/Backgrounds/space-background-2.png",
    "Assets/Images/Backgrounds/space-background-3.mp4",
    "Assets/Images/Backgrounds/space-background-4.png",
    "Assets/Images/Backgrounds/space-background-5.png"
];

const backGroundVideo = document.createElement("video");
backGroundVideo.src = backGrounds[3];
backGroundVideo.playsInline = true;
backGroundVideo.loop = true;
backGroundVideo.muted = true;

const backGroundImage = new Image();
backGroundImage.src = backGrounds[1];

const skins = [
    "Assets/Images/Ships/spaceship.png",
    "Assets/Images/Ships/spaceship-1.png",
    "Assets/Images/Ships/spaceship-2.png"
]

const ship = new Image();
ship.src = skins[0];

const enemyShip = new Image();
enemyShip.src = "Assets/Images/Ships/enemy-spaceship.png";

const explosion = new Image();
explosion.src = "Assets/Images/explosion.png";

const shoot = new Image();
shoot.src = "Assets/Images/shoot.png";

const planetImage = new Image();
planetImage.src = "Assets/Images/planet.png";

const shootingSound = new Audio("Assets/Sounds/shoot.mp3");
const explosionSound = new Audio("Assets/Sounds/explosion.mp3");
const gameOverSound = new Audio("Assets/Sounds/game-over.mp3");
const specialSound = new Audio("Assets/Sounds/special-sound.mp3");

let running = false;
let paused = false;

let buttonPressed = {
    left: false,
    right: false,
    shoot: false
};

let currentLevel = 1;

let score = 0;

let xVelocity = 0;
let touchXVelocity = 0;

let shipWidth = unitSize * 3;
let shipHeight = unitSize * 3;

let shipX = gameBoard.width / 2 - shipWidth / 2;
let shipY = gameBoard.height - shipHeight * 1.5;

let bulletArray = [];

let bulletVelocityY = -20;

let canShoot = true;
let shootCooldown = 300;

let alienArray = [];

let alienVelocityY = 4.5;

let alienWidth = unitSize * 3;
let alienHeight = unitSize * 3;

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

window.addEventListener("resize", () => {
    resizeCanvas();
    resizeShipPosition();
});
window.addEventListener("load", () => {
    resizeCanvas();
    resizeShipPosition();
});

window.addEventListener("keydown", changeDirection);

window.addEventListener("keyup", stopShip);

window.addEventListener("keyup", shootBullet);

window.addEventListener("keydown", (event) => {
    if(event.code === "KeyP") {
        togglePause();
    }
})

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

window.addEventListener("load", function() {
    const savedSkin = Number(this.localStorage.getItem("selectedSkin"));
    if(!isNaN(savedSkin)){
        changeSkinSelect.value = savedSkin;
        ship.src = skins[savedSkin]
    }
});

function changeSkin(index) {
    const newShip = new Image();
    newShip.src = skins[index];

    newShip.onload = () => {
        ship.src = skins[index];
        localStorage.setItem("selectedSkin", index);
    }
}

changeSkinSelect.addEventListener("change", function() {
    changeSkin(this.value);
});

resetBtn.addEventListener("click", resetGame);

pauseBtn.addEventListener("click", togglePause);

let imagesLoaded = 0;

backGroundImage.onload = ship.onload = enemyShip.onload = function(){
    imagesLoaded++;
    if(imagesLoaded === 3){
        gameStart();
    }
}

function gameStart(){
    running = true;
    gameScore.textContent = score;

    if(!enemyInterval){
        enemyInterval = setInterval(generateEnemy, 1000);
    }

    if(!speedInterval){
        speedInterval = setInterval(() => {
            alienVelocityY += 0.5;
        }, 5000);
    }

    nextTick();
}
function nextTick(timeStamp){
    if(!lastTime) lastTime = timeStamp;
    const deltaTime = (timeStamp - lastTime) / 1000;
    lastTime = timeStamp;

    if(running && !paused){
        drawBackGround();
        drawShip();
        moveShip(deltaTime);
        drawBullet(deltaTime);
        drawEnemies();
        moveEnemies(deltaTime);
        checkCollisions();
        checkUpgrades();
        
        animationFrameId = requestAnimationFrame(nextTick);
    }
    else {
        drawBackGround();
        drawShip();
        drawBullet();
        drawEnemies();

        if(!running) {
            drawGameOverScreen();
        } else if (paused) {
            drawPauseScreen();
        }
    }
}
function resumeGame() {
    if(paused) {
        paused = false;
        nextTick();
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
        nextTick();
    }
}
function moveShip(deltaTime){
    shipX += (xVelocity + touchXVelocity) * deltaTime * 15;

    if(shipX < 0){
        shipX = 0;
    }else if(shipX + (shipWidth) > gameBoard.width){
        shipX = gameBoard.width - (shipWidth);
    }
}
function drawGameOverScreen() {
    console.log("Game over!");
        
    context.fillStyle = "white";
    context.font = "48px Arial"
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Game over!", gameBoard.width / 2, gameBoard.height / 2);

    const clonedGameOverSound = gameOverSound.cloneNode();
    clonedGameOverSound.play();
}
function drawPauseScreen(){
    context.fillStyle = "white";
    context.font = "48px Arial"
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Game paused!", gameBoard.width / 2, gameBoard.height / 2);
}
function drawShip(){
    context.drawImage(ship, shipX, shipY, shipWidth, shipHeight); 
}
function drawBackGround(){
    if(currentLevel === 3 && backGroundVideo.readyState >= 2){
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
            if(alien.special){
                context.drawImage(planetImage, alien.x, alien.y, alien.width, alien.height);
            }else{
                context.drawImage(enemyShip, alien.x, alien.y, alien.width, alien.height);
            }
        }
    }
}
function drawExplosion(x, y){
    context.drawImage(explosion, x, y, unitSize * 2, unitSize * 2);
}
function drawShoot(x, y){
    context.drawImage(shoot, x, y, unitSize * 2, unitSize * 2);
}
function moveEnemies(deltaTime) {
    for(let i = 0; i < alienArray.length; i++){
        let alien = alienArray[i];
        if(alien.alive){
            alien.y += alienVelocityY * deltaTime * 15;
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

        const clonedShootingSound = shootingSound.cloneNode();
        clonedShootingSound.play();

        drawShoot(shipX + unitSize / 2, shipY - 50);

        bulletArray.push(bullet);

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
}
function generateEnemy(){
    let randomX = Math.floor(Math.random() * (gameBoard.width - alienWidth));

    const isPlanet = Math.random() < 0.05;

    if(isPlanet){
        let moon = {
            x: randomX,
            y: 0,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            special: true,
            points: 100,
        };
        alienArray.push(moon);
    } else {
        let alien = {
            x: randomX,
            y: 0,
            width: alienWidth,
            height: alienHeight,
            alive: true,
            special: false,
            points: 10
        }
        alienArray.push(alien);
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

                if(!alien.special){
                    const clonedExplosionSound = explosionSound.cloneNode();
                    clonedExplosionSound.play();
                } else {
                    const clonedSpecialSound = specialSound.cloneNode();
                    clonedSpecialSound.play();
                }

                drawExplosion(alien.x + unitSize / 2, alien.y);

                score += alien.points;
                gameScore.textContent = score;
                break;
            }
        }
    }
}
function checkUpgrades() {
    if (score >= 500 && currentLevel === 1) {
        currentLevel = 2;
        backGroundImage.src = backGrounds[5];
    } 
    else if (score >= 1000 && currentLevel === 2) {
        currentLevel = 3;
        shootCooldown = 150;
        backGroundVideo.play();
    }
}
function resetGame(){
    running = false;
    paused = false;

    bulletArray = [];
    alienArray = [];

    currentLevel = 1;

    score = 0;
    gameScore.textContent = score;

    shipX = (gameBoard.width / 2) - (unitSize * 2);
    shipY = gameBoard.height - (unitSize * 4);

    alienVelocityY = 4.5;

    backGroundImage.src = backGrounds[1];

    if(!backGroundVideo.paused){
        backGroundVideo.pause();
        backGroundVideo.currentTime = 0;
    }

    clearInterval(enemyInterval);
    enemyInterval = null;

    clearInterval(speedInterval);
    speedInterval = null;

    cancelAnimationFrame(animationFrameId);

    running = true;
    gameStart();
}
