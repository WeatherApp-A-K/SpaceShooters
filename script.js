const gameBoard = document.querySelector('#gameBoard');
const context = gameBoard.getContext('2d');

const gameScore = document.querySelector('#gameScore');
const resetBtn = document.querySelector('#resetBtn');

const changeSkinSelect = document.querySelector('#changeSkinSelect');

const leftBtn = document.querySelector('#leftBtn');
const rightBtn = document.querySelector('#rightBtn');
const shootBtn = document.querySelector('#shootBtn');

const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const unitSize = 25;

const backGroundImage = new Image();
backGroundImage.src = "Assets/Images/space-background.png";

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

let score = 0;

let xVelocity = 0;
let touchXVelocity = 0;

let shipWidth = unitSize * 3;
let shipHeight = unitSize * 3;

let shipX = (gameWidth / 2) - (unitSize * 2);
let shipY = gameHeight - (unitSize * 4);

let bulletArray = [];

let bulletVelocityY = -20;

let canShoot = true;
let shootCooldown = 300;

let alienArray = [];

let alienVelocityY = 4.5;

let alienWidth = unitSize * 3;
let alienHeight = unitSize * 3;

let enemyInterval;
let speedInterval;

window.addEventListener("keydown", changeDirection);
window.addEventListener("keyup", stopShip);
window.addEventListener("keyup", shootBullet);

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchXVelocity -= unitSize;
});
leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchXVelocity = 0
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchXVelocity = unitSize
});
rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchXVelocity = 0
});

shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if(canShoot) shootBullet({ code: 'Space' });
})

window.addEventListener("load", function() {
    const savedSkin = Number(this.localStorage.getItem("selectedSkin"));
    if(!isNaN(savedSkin)){
        changeSkinSelect.value = savedSkin;
        ship.src = skins[savedSkin]
    }
});
changeSkinSelect.addEventListener("change", function() {
    const selectedIndex = changeSkinSelect.value;

    const newShip = new Image();
    newShip.src = skins[selectedIndex];

    newShip.onload = () => {
        ship.src = skins[selectedIndex];
        localStorage.setItem("selectedSkin", selectedIndex);
    }
});

resetBtn.addEventListener("click", resetGame);

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
function nextTick(){
    if(running){
        setTimeout(() => {
            drawBackGround();
            drawShip();
            moveShip();
            drawBullet();
            drawEnemies();
            moveEnemies();
            checkCollisions();
            nextTick();
        }, 75)
    }
    else{
        console.log("Game over!");
        
        context.fillStyle = "white";
        context.font = "48px Arial"
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("Game over!", gameWidth / 2, gameHeight / 2);

        const clonedGameOverSound = gameOverSound.cloneNode();
        clonedGameOverSound.play();
    }
}
function moveShip(){
    shipX += xVelocity + touchXVelocity;

    if(shipX < 0){
        shipX = 0;
    }else if(shipX + (shipWidth) > gameWidth){
        shipX = gameWidth - (shipWidth);
    }
}
function drawShip(){
   context.drawImage(ship, shipX, shipY, shipWidth, shipHeight); 
}
function drawBackGround(){
    context.drawImage(backGroundImage, 0, 0, gameWidth, gameHeight);
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
function moveEnemies() {
    for(let i = 0; i < alienArray.length; i++){
        let alien = alienArray[i];
        if(alien.alive){
            alien.y += alienVelocityY;
            if(alien.y + alien.height == gameHeight - 5){
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
function drawBullet(){
    for(let i = 0; i < bulletArray.length; i++){
        let bullet = bulletArray[i];
        bullet.y += bulletVelocityY;
        context.fillStyle = "white";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}
function generateEnemy(){
    let randomX = Math.floor(Math.random() * (gameWidth - alienWidth));

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
function resetGame(){
    running = false;

    bulletArray = [];
    alienArray = [];

    score = 0;
    gameScore.textContent = score;

    shipX = (gameWidth / 2) - (unitSize * 2);
    shipY = gameHeight - (unitSize * 4);

    alienVelocityY = 4.5;

    clearInterval(enemyInterval);
    enemyInterval = null;

    clearInterval(speedInterval);
    speedInterval = null;

    running = true;
    gameStart();
}
