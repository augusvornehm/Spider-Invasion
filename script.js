$(document).ready(function () {
    // Alien class 
    class Alien {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 50;
            this.height = 40;
            this.speed = 2; // Alien movement speed
            this.direction = 1; // 1 = right, -1 = left
            this.image = new Image();
            this.image.src = 'images/spider.png';
            this.alternateImage = new Image();
            this.alternateImage.src = 'images/spider2.png';
            this.toggleImage(); // spider image changing effect
            this.canShoot = true; // Flag to track whether alien can shoot again
        }

        toggleImage() {
            // chenge between two images for spiders
            setInterval(() => {
                if (this.image.src.endsWith('spider.png')) {
                    this.image = this.alternateImage;
                } else {
                    this.image = new Image();
                    this.image.src = 'images/spider.png';
                }
            }, 500);
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        move() {
            this.x += this.speed * this.direction;
        }

        moveDown() {
            this.y += this.height;
            this.direction *= -1; // Change direction after moving down
        }

        shoot() {
            if (this.canShoot && Math.random() < 0.01) {
                const alienMissile = new AlienMissile(this.x + this.width / 2, this.y + this.height);
                this.canShoot = false; // Set to false after shooting til can shoot again
                return alienMissile;
            }
            return null; // No missile is shot
        }
    }

    class AlienMissile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 20;
            this.height = 40;
            this.speed = 5; // alien missile speed
            this.isPlayerMissile = false; // property to identify player missile
            this.image = new Image();
            this.image.src = 'images/net.png';
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        move() {
            this.y += this.speed;
        }

    }

    // Player class
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 40;
            this.height = 50;
            this.image = new Image();
            this.image.src = 'images/player-img.png';
            this.canShoot = true; // Flag to track whether the player can shoot again

            //  properties for fading effect when hit
            this.maxOpacity = 1;
            this.fadeInterval = null;

        }

        draw(context) {
            // Draw the player with opacity (for fading effect)
            context.globalAlpha = this.maxOpacity;
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.globalAlpha = 1; // Reset globalAlpha to default
        }

        // method to trigger fading effect when hit
        startFadingEffect() {
            let fadeCount = 0;
            const fadeDuration = 66; // duration for fade

            this.fadeInterval = setInterval(() => {
                fadeCount++;

                // switch between max and min opacity
                this.maxOpacity = (fadeCount % 2 === 0) ? 1 : 0;

                if (fadeCount === 6) { // Repeat fading 3 times (6 in+out)
                    clearInterval(this.fadeInterval);
                    this.maxOpacity = 1; // Reset to full opacity after fading 
                }
            }, fadeDuration);
        }

        

        shoot() {  
            if (this.canShoot) {
                const missile = new Missile(this.x + this.width / 2, this.y);
                missile.isPlayerMissile = true;
                this.canShoot = false; // Set to false after shooting --> unable player to shoot as often as he wants
                
                return missile;
            }
            
            return null; // No missile is shot
        }
    }

    // Missile class
    class Missile {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 50;
            this.height = 30;
            this.speed = 8 ; // Player missile speed
            this.image = new Image();
            this.image.src = 'images/shoe.png';
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        move() {
            this.y -= this.speed;
        }
    }

    // Game class
    class Game {
        constructor() {
            this.canvas = $("#gameCanvas")[0];
            this.context = this.canvas.getContext("2d");

            this.playerMissile = null;
            this.playerLives = 3;
            this.livesElement = $("#playerLives")[0]; // Use jQuery to select the element

            this.playerScore = 0;
            this.scoreElement = $("#playerScore")[0]; // Use jQuery to select the element

            this.highScore = parseInt(localStorage.getItem("highScore")) || 0;
            this.highScoreElement = $("#highScoreValue");
            this.updateHighScore();

            this.level = 1;
            this.levelElement = $("#currentLevel")[0]; // Use jQuery to select the element

            this.lastShootingAlien = null;
            this.alienMissileHit = true;
            this.lastShootingAlienIndex = null;

            this.player = new Player(this.canvas.width / 2 - 25, this.canvas.height - 40);
            this.aliens = [];

            // Initialize aliens
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 8; col++) {
                    const alien = new Alien(col * 50, row * 50);
                    this.aliens.push(alien);
                }
            }

            this.missiles = [];
            // flag to track game over state
            this.gameOverFlag = false;
        }

        updateHighScore() {
            this.highScoreElement.text(this.highScore);
        }

        restartGame() {
            this.player.stopFadingEffect(); // Stop the fading effect if it's still running
            location.reload(); // Reload the page to restart the game
        }


        increaseLevel() {
            // Increase the level
            this.level++;
            this.levelElement.textContent = this.level;

            // Double the speed of each alien
            for (const alien of this.aliens) {
                alien.speed *= 1.2;
            }
        }

        // Draw alien, missile in game
        draw() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.player.draw(this.context);

            for (const alien of this.aliens) {
                alien.draw(this.context);
            }

            for (const missile of this.missiles) {
                missile.draw(this.context);
            }
        }

        update() {
            if (this.gameOverFlag) {
            return; // Stop updating when the game is over
            }

            // Move and filter missiles --> for player shooting only once logic
            for (const missile of this.missiles) {
                missile.move();
            } 

            this.missiles = this.missiles.filter(missile => missile.y > 0);

            // Check if the player's missile has reached the top edge
            if (this.playerMissile && this.playerMissile.y <= 0) {
                this.playerMissile = null;
                this.player.canShoot = true;
            }

            // Check if the player can shoot again
            if (this.missiles.length === 0) {
                this.player.canShoot = true;
            }

            let hitEdge = false;

            // Move aliens and check for edge hit
            for (const alien of this.aliens) {
                alien.move();

                if (
                    (alien.direction === 1 && alien.x + alien.width > this.canvas.width) ||
                    (alien.direction === -1 && alien.x < 0)
                ) {
                    hitEdge = true;
                }
            }
            if (hitEdge) {
                // Move aliens down and change direction
                for (const alien of this.aliens) {
                    alien.moveDown();
                }
            }

            // Allow only one random alien to shoot at a time
            if (this.lastShootingAlienIndex !== null && this.missiles.every(missile => missile.y > this.aliens[this.lastShootingAlienIndex].y + this.aliens[this.lastShootingAlienIndex].height)) {
                this.aliens[this.lastShootingAlienIndex].canShoot = true;
                this.lastShootingAlienIndex = null;
            }

            // Aliens shoot randomly
            for (let i = 0; i < this.aliens.length; i++) {
                const alien = this.aliens[i];

                if (i !== this.lastShootingAlienIndex && !this.currentShootingAlien && alien.canShoot && this.alienMissileHit) {
                    const alienMissile = alien.shoot();
                    if (alienMissile) {
                        this.missiles.push(alienMissile);
                        this.currentShootingAlien = alien;
                        this.lastShootingAlienIndex = i;
                        this.alienMissileHit = false;
                    }
                }
            }

            // Alien missile and Aliens killing player:

                // Check if an alien missile hits the edge
            if (this.currentShootingAlien && this.missiles.every(missile => missile.y > this.canvas.height)) {
                this.alienMissileHit = true;
                this.currentShootingAlien.canShoot = true;
                this.lastShootingAlienIndex = null;
                this.currentShootingAlien = null;
            }

                // Check for collisions with player for alien missiles
            for (let i = this.missiles.length - 1; i >= 0; i--) {
                const missile = this.missiles[i];

                if (
                    missile.x < this.player.x + this.player.width &&
                    missile.x + missile.width > this.player.x &&
                    missile.y < this.player.y + this.player.height &&
                    missile.y + missile.height > this.player.y &&
                    !missile.isPlayerMissile  // Check if the missile is from an alien
                ) {
                     // Collision detected: player loses 1 life
                    this.missiles.splice(i, 1); // Remove the missile
                    this.playerLives--;

                    // Play the player hit by missile sound
                    $("#playerHitSound")[0].play();

                    // Update the lives display
                    this.livesElement.textContent = this.playerLives;

                    // Check if the player has run out of lives
                    if (this.playerLives <= 0) {
                        this.gameOver();
                        return; // Stop updating after game over
                    }

                    // Change player image to 'player-hit.png' immediately
                    this.player.image.src = 'images/player-hit.png';

                    // Set a flag to track that the player has been hit
                    this.player.hitByMissile = true;

                    // After 1 second, reset the player's image and reset the flag
                    setTimeout(() => {
                        this.player.image.src = 'images/player-img.png';
                        this.player.hitByMissile = false;
                    }, 1000);

                    // Reset player to shoot
                    this.player.canShoot = true;

                    // Start the fading effect when the player gets hit
                    this.player.startFadingEffect();
                }
            }


                // Check for collision of aliens with player
            for (const alien of this.aliens) {
                if (
                    this.player.x < alien.x + alien.width &&
                    this.player.x + this.player.width > alien.x &&
                    this.player.y < alien.y + alien.height &&
                    this.player.y + this.player.height > alien.y
                ) {
                    // Collision detected: player loses immediately
                    this.gameOver();
                    // Play the player hit sound
                    $("#playerDiesSound")[0].play();
                    return; // Stop updating after game over
                }
            }

            //Player missile and player killing aliens

                // Check for collisions of player missile and alien
            for (let i = this.aliens.length - 1; i >= 0; i--) {
                const alien = this.aliens[i];

                for (const missile of this.missiles) {
                    if (
                        missile.x < alien.x + alien.width &&
                        missile.x + missile.width > alien.x &&
                        missile.y < alien.y + alien.height &&
                        missile.y + missile.height > alien.y &&
                        missile.isPlayerMissile
                    ) {
                        // Collision detected: remove missile
                        this.missiles = this.missiles.filter((m) => m !== missile);

                        // Play the alien hit sound
                        $("#alienHitSound")[0].play();
                        this.missiles = this.missiles.filter((m) => m !== missile);

                        // Change alien image to 'smashed.png' immediately
                        alien.image.src = 'images/smashed.png';

                        // Set a flag to track that this alien has been hit
                        alien.hitByMissile = true;

                        // remove the alien and reset the flag
                        setTimeout(() => {
                            this.aliens.splice(i, 1);
                            alien.hitByMissile = false;

                            // Update the score display
                            this.playerScore += 10;
                            this.scoreElement.textContent = this.playerScore;

                            // Reset player's ability to shoot
                            this.player.canShoot = true;
                        }, 200); //animation time 200 milliseconds

                    }
                }
            }

                // Check if there are no more aliens left
            if (this.aliens.length === 0) {
                    // Spawn a new grid of aliens if none are left
                this.spawnNewAliens();
                    // Increase the level when new grid spawns
                this.increaseLevel();
            }
        }

        spawnNewAliens() {
            this.aliens = [];

            // Initialize new aliens
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 8; col++) {
                    const alien = new Alien(col * 50, row * 50);
                    this.aliens.push(alien);
                }
            }
        }

        handleInput() {
            document.addEventListener("keydown", (event) => {
                // Check if the game is not over
                if (!this.gameOverFlag) {
                    if (event.key === "ArrowLeft" && this.player.x > 0) {
                        this.player.x -= 10;
                    } else if (event.key === "ArrowRight" && this.player.x < this.canvas.width - this.player.width) {
                        this.player.x += 10;
                    } else if (event.key === " ") {
                        // Space key pressed, player shoots a missile if allowed (if no other missile on screen)
                        if (this.player.canShoot) {
                            this.playerMissile = this.player.shoot();

                            // Play Player Shoot Sound
                            $("#playerShootSound")[0].play();
                            if (this.playerMissile) {
                                this.missiles.push(this.playerMissile);
                            }
                        }
                    }
                }
            });
        }

        start() {
            this.handleInput();

            // Display high score in the lower right corner during the game (bc after game in the middle under start button)
            const highScoreDisplay = document.createElement("div");
            highScoreDisplay.id = "currentHighScore";
            highScoreDisplay.style.position = "absolute";
            highScoreDisplay.style.bottom = "20px";
            highScoreDisplay.style.right = "20px";
            highScoreDisplay.style.fontSize = "18px";
            highScoreDisplay.style.fontWeight = "bold";
            document.body.appendChild(highScoreDisplay);

            setInterval(() => {
                this.update();
                this.draw();
                this.updateHighScoreDisplay(); // Update the high score display during the game if player surpasses it
                
            }, 1000 / 30); // Update and draw at 30 frames per second (on canvas)
        }

        updateHighScoreDisplay() {
            // Update the high score display (lower right corner) --> jQuery
            $("#currentHighScore").text("High Score: " + this.highScore);
        }

        gameOver() {
            
                this.gameOverFlag = true;
                $("#restartButton").show(); // jQuery to show restart button
                // Change player image to 'player-hit.png' when the game is over
                this.player.image.src = 'images/player-hit.png';

                // Check if the current score is higher than the last high score
                if (this.playerScore > this.highScore) {
                    this.highScore = this.playerScore;

                    // Save new high score to local storage if surpassed old
                    localStorage.setItem("highScore", this.highScore);

                    // Update high score display using jQuery
                    this.updateHighScore();
                }
        }

        restartGame() {
            location.reload(); // Reload the page to restart the game
        }

    }

    const game = new Game();

    setInterval(() => {
        game.update();
        game.draw();
        game.updateHighScoreDisplay();
    }, 1000 / 30);

    // Event listeners using jQuery
    $("#startButton").on("click", () => {
        $("#startButton").hide();
        $("#gameCanvas").show();
        game.start();
    });

    $("#restartButton").on("click", () => {
        game.restartGame();
    });
    });