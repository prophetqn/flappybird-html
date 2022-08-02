class Game {
    constructor() {
        this.self = this;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.boardWidth = 288;
        this.boardHeight = 512;
        this.baseHeight = 112;
        this.frameNo = 0;
        this.lowerObstacles = [];
        this.upperObstacles = [];
        this.holeHeight = 100;
        this.obstacleHeightMin = 50;
        this.obstacleHeightMax = this.boardHeight - this.obstacleHeightMin - this.holeHeight - this.baseHeight;
        this.obstacleDistance = 200;
        this.scorePoint = 0;
        this.gameFPS = 1000/60;
        this.gameSpeed = 1;
        this.gameStarted = false;
    }

    init() {
        this.bird = new Component(34, 24, yellowbirdmidflap, 90, 290);
        this.background = new Component(this.boardWidth, this.boardHeight, backgroundday, 0, 0);
        this.nextBackground = new Component(this.boardWidth, this.boardHeight, backgroundday, this.boardWidth, 0);
        this.base = new Component(this.boardWidth, this.baseHeight, base, 0, this.boardHeight - this.baseHeight);
        this.nextBase = new Component(this.boardWidth, this.baseHeight, base, this.boardWidth, this.boardHeight - this.baseHeight);
        this.background.speedX = -this.gameSpeed;
        this.nextBackground.speedX = -this.gameSpeed;
        this.base.speedX = -this.gameSpeed;
        this.nextBase.speedX = -this.gameSpeed;
        this.canvas.addEventListener('mousedown', () => {
            this.gameStarted = true;
            this.bird.gravitySpeed = 0.1;
        }, {once: true});
        this.bird.controller = new AbortController();
        this.bird.flyRegister();
        this.gameInterval = setInterval(() => {
            this.loop();
        }, this.gameFPS);
    }

    loop() {
        this.clearCanvas();
        this.drawBackgroundAndBase();
        this.birdWingFlap();
        this.drawBird();
        if (!this.gameStarted) {
            this.drawMessage();
        } else {
            this.obstacleGenerator();
            this.drawObstables();
        }
        this.calculateScore();
        this.drawScore();
        if (this.birdHitObstacles()){
            this.gameOver();
        }
        if (this.birdHitBase()) {
            hit.play();
            clearInterval(this.gameInterval);
            this.drawGameOver();
            this.newGame();
        };
        this.frameNo++;
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(component) {
        this.ctx.drawImage(
            component.image, 
            component.x, 
            component.y, 
            component.width, 
            component.height
        );
    }

    drawBackgroundAndBase() {
        this.draw(this.background);
        this.draw(this.nextBackground);
        this.draw(this.base);
        this.draw(this.nextBase);
        this.background.newPos();
        this.nextBackground.newPos();
        this.base.newPos();
        this.nextBase.newPos();
        if (this.background.x <= -this.boardWidth) {
            this.background.x += this.boardWidth;
            this.nextBackground.x += this.boardWidth;
            this.base.x += this.boardWidth;
            this.nextBase.x += this.boardWidth;
        }
    }

    drawMessage() {
        this.ctx.drawImage(
            message, 
            (this.boardWidth - 184)/2, 
            (this.boardHeight - 267)/2, 
            184, 
            267
        );
    }

    drawGameOver() {
        this.ctx.drawImage(
            gameover, 
            (this.boardWidth - 192)/2, 
            180, 
            192, 
            42
        );
    }

    birdWingFlap() {
        switch (this.frameNo % 20) {
            case 0:
                this.bird.image = yellowbirdmidflap;
                break;
            case 5:
                this.bird.image = yellowbirdupflap;
                break;
            case 10:
                this.bird.image = yellowbirdmidflap;
                break;
            case 15:
                this.bird.image = yellowbirddownflap;
                break;
        }
    }

    drawBird() {
        switch (true) {
            case this.bird.speedY === 0:
                this.ctx.drawImage(
                    this.bird.image,
                    this.bird.x,
                    this.bird.y,
                    this.bird.width,
                    this.bird.height
                );
                break;
            case this.bird.speedY < 1:
                this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
                this.ctx.rotate(-30 * Math.PI/180);
                this.ctx.drawImage(
                    this.bird.image,
                    -this.bird.width/2,
                    -this.bird.height/2,
                    this.bird.width,
                    this.bird.height
                );
                break;
            case this.bird.speedY >= 1 && this.bird.speedY < 3:
                this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
                this.ctx.rotate(30 * Math.PI/180);
                this.ctx.drawImage(
                    this.bird.image,
                    -this.bird.width/2,
                    -this.bird.height/2,
                    this.bird.width,
                    this.bird.height
                );
                break;
            case this.bird.speedY >= 3:
                this.ctx.translate(this.bird.x + this.bird.width/2, this.bird.y + this.bird.height/2);
                this.ctx.rotate(90 * Math.PI/180);
                this.ctx.drawImage(
                    this.bird.image,
                    -this.bird.width/2,
                    -this.bird.width/2,
                    this.bird.width,
                    this.bird.height
                );
                break;
        }
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.bird.newPos();
    }

    drawObstables() {
        for (let i = 0; i < this.lowerObstacles.length; i++) {
            this.drawLowerObstacle(this.lowerObstacles[i]);
            this.drawUpperObstacle(this.upperObstacles[i]);
            this.lowerObstacles[i].newPos();
            this.upperObstacles[i].newPos();
        }
    }

    obstacleGenerator() {
        if (this.frameNo % Math.floor(this.obstacleDistance/this.gameSpeed) === 0) {
            const obstacleWidth = 52;
            const obstacleHeight = Math.floor(Math.random()*(this.obstacleHeightMax - this.obstacleHeightMin) + this.obstacleHeightMin);
            this.upperObstacles = this.upperObstacles.filter((obstacle) => {
                return (obstacle.x + obstacle.width > 0);
            });
            this.lowerObstacles = this.lowerObstacles.filter((obstacle) => {
                return (obstacle.x + obstacle.width > 0);
            });
            this.upperObstacles.push(new Component(obstacleWidth, obstacleHeight, pipegreen, this.boardWidth, 0));
            this.upperObstacles[this.upperObstacles.length - 1].speedX = -this.gameSpeed;
            this.lowerObstacles.push(new Component(obstacleWidth, this.boardHeight - obstacleHeight - this.holeHeight - this.baseHeight, pipegreen, this.boardWidth, obstacleHeight + this.holeHeight));
            this.lowerObstacles[this.lowerObstacles.length - 1].speedX = -this.gameSpeed;
        }
    }
    
    drawLowerObstacle(component) {
        let heightGap = component.image.naturalHeight - component.height;
        this.ctx.drawImage(
            component.image, 
            0, 
            -heightGap, 
            component.image.naturalWidth, 
            component.image.naturalHeight, 
            component.x, 
            component.y - heightGap, 
            component.width, 
            component.image.naturalHeight
        )
    }

    drawUpperObstacle(component) {
        let heightGap = component.image.naturalHeight - component.height;
        this.ctx.translate(component.x + component.image.naturalWidth, component.image.naturalHeight - heightGap);
        this.ctx.rotate(180 * Math.PI/180);
        this.ctx.drawImage(
            component.image, 
            0,
            -heightGap,
            component.image.naturalWidth,
            component.image.naturalHeight,
            0,
            component.y - heightGap,
            component.width,
            component.image.naturalHeight
        );
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    calculateScore() {
        for (let i = 0; i < this.lowerObstacles.length; i++) {
            if (this.bird.x + this.bird.width/2 === this.lowerObstacles[i].x + this.lowerObstacles[i].width/2) {
                this.scorePoint++;
                point.play();
            };
        }
    }
    
    drawScore() {
        const scores = this.scorePoint.toString().split("");
        const scoreWidth = 24;
        const scoreHeight = 36;
        let scoresLength = scores.length;
        let scoreDrawPosX = (this.boardWidth - scoreWidth*scoresLength)/2
        let scoreDrawPosY = 50;
        for (let i = 0; i < scoresLength; i++) {
            let imageName = eval('num' + scores[i]);
            this.ctx.drawImage(
                imageName,
                scoreDrawPosX,
                scoreDrawPosY,
                scoreWidth,
                scoreHeight
            );
            scoreDrawPosX += scoreWidth;
        }
    }

    birdHitObstacles() {
        for (let i = 0; i < this.lowerObstacles.length; i++) {
            if (this.bird.x <= this.lowerObstacles[i].x + this.lowerObstacles[i].width &&
                this.bird.x + this.bird.width >= this.lowerObstacles[i].x &&
                this.bird.y + this.bird.height >= this.lowerObstacles[i].y) {
                return true;
            }
            if (this.bird.x <= this.upperObstacles[i].x + this.upperObstacles[i].width &&
                this.bird.x + this.bird.width >= this.upperObstacles[i].x &&
                this.bird.y <= this.upperObstacles[i].y + this.upperObstacles[i].height) {
                return true;
            }
        }
        return false;
    }

    stopAnimation() {
        this.bird.speedX = 0;
        this.bird.gravitySpeed = 0.2;
        for (let i = 0; i < this.lowerObstacles.length; i++) {
            this.lowerObstacles[i].speedX = 0;
            this.upperObstacles[i].speedX = 0;
        }
        this.background.speedX = 0;
        this.nextBackground.speedX = 0;
        this.base.speedX = 0;
        this.nextBase.speedX = 0;
    }

    birdHitBase() {
        if (this.bird.y + this.bird.height >= this.boardHeight - this.baseHeight) {
            return true;
        }
        return false;
    }

    newGame() {
        this.canvas.addEventListener('mousedown', () => {
            setTimeout(() => {
                const newGame = new Game();
            newGame.init();
            }, 100)
        }, {once: true});
    }

    gameOver() {
        hit.play();
        die.play();
        this.bird.controller.abort();
        clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => {
            this.clearCanvas();
            this.stopAnimation();
            this.drawBackgroundAndBase();
            this.drawObstables();
            this.drawScore();
            this.drawBird();
            if (this.birdHitBase()) {
                clearInterval(this.gameInterval);
                this.drawGameOver();
                this.newGame();
            };
        }, this.gameFPS)
    }
}

class Component {
    constructor(width, height, image, x, y) {
        this.width = width;
        this.height = height;
        this.image = image;
        this.x = x;
        this.y = y;
        this.speedX = 0;
        this.speedY = 0;
        this.gravitySpeed = 0;
    }
    newPos() {
        this.speedY += this.gravitySpeed;
        this.x += this.speedX;
        if (this.y < -100) {
            this.y = -100;
        } else {
            this.y += this.speedY;
        }
    }
    flyRegister() {
        const that = this;
        window.addEventListener("mousedown", () => {that.fly();}, {signal: this.controller.signal});
    }
    fly() {
        this.speedY = -3;
        wing.play();
    }
    stopFlying() {
        this.speedX = 0;
        this.speedY = 0.5;
    }
}

let yellowbirdmidflap = new Image();
let yellowbirdupflap = new Image();
let yellowbirddownflap = new Image();
let backgroundday = new Image();
let base = new Image();
let pipegreen = new Image();
let num0 = new Image();
let num1 = new Image();
let num2 = new Image();
let num3 = new Image();
let num4 = new Image();
let num5 = new Image();
let num6 = new Image();
let num7 = new Image();
let num8 = new Image();
let num9 = new Image();
let message = new Image();
let gameover = new Image();
let images = [
    yellowbirdmidflap, 
    yellowbirdupflap, 
    yellowbirddownflap, 
    backgroundday, 
    base,
    pipegreen,
    num0,
    num1,
    num2,
    num3,
    num4,
    num5,
    num6,
    num7,
    num8,
    num9,
    message,
    gameover,
];

let imageSources = [
    './sprites/yellowbird-midflap.png',
    './sprites/yellowbird-upflap.png',
    './sprites/yellowbird-downflap.png', 
    './sprites/background-day.png', 
    './sprites/base.png',
    './sprites/pipe-green.png',
    './sprites/0.png',
    './sprites/1.png',
    './sprites/2.png',
    './sprites/3.png',
    './sprites/4.png',
    './sprites/5.png',
    './sprites/6.png',
    './sprites/7.png',
    './sprites/8.png',
    './sprites/9.png',
    './sprites/message.png',
    './sprites/gameover.png',
];

let wing = new Audio();
let point = new Audio();
let hit = new Audio();
let die = new Audio();

let audio = [
    wing,
    point,
    hit,
    die
]

let audioSources = [
    './audio/wing.wav',
    './audio/point.wav',
    './audio/hit.wav',
    './audio/die.wav'
]

function loadContent() {
    const contentPromises = [];
    let errAlert = '';

    for(let i = 0; i < images.length; i++) {
        contentPromises.push(new Promise((resolve, reject) => {
            images[i].src = imageSources[i];
            images[i].addEventListener('load', () => {
                resolve();
            });
            images[i].addEventListener('error', () => {
                errAlert += `Image file at url "${imageSources[i]}" loaded failed.\n`;
                reject();
            });
        }))
    }

    for(let i = 0; i < audio.length; i++) {
        contentPromises.push(new Promise((resolve, reject) => {
            audio[i].src = audioSources[i];
            audio[i].addEventListener('canplaythrough', () => {
                resolve();
            });
            audio[i].addEventListener('error', () => {
                errAlert += `Audio file at url "${audioSources[i]}" loaded failed.\n`;
                reject();
            });
        }))
    }

    Promise.allSettled(contentPromises).then(results => {
        if (results.every(element => element.status === 'fulfilled')) {
            let game = new Game();
            game.init();
        } else {
            alert(errAlert);
        }
    })
}

loadContent();