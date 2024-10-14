const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const pausedOverlay = document.getElementById('pausedOverlay');
const pauseButton = document.getElementById('pauseButton'); // Reference to Pause Button

const grid = 20; // Size of each grid cell
let count = 0; // Frame count
let fps = 10; // Frames per second

let snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
};

let apple = {
    x: 320,
    y: 320
};

let score = 0;

// Touch controls variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Animation variables
let eatAnimation = false;
let animationScale = 1;

// Pause state variable
let isPaused = false;

// Gradient for the snake
const gradient = ctx.createLinearGradient(0, 0, grid, grid);
gradient.addColorStop(0, 'lime');
gradient.addColorStop(1, 'green');

// Game loop
function loop() {
    requestAnimationFrame(loop);

    // If the game is paused, skip updating the game state
    if (isPaused) {
        return;
    }

    // Throttle the game loop to the desired FPS
    if (++count < 60 / fps) {
        return;
    }
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move the snake by its velocity
    snake.x += snake.dx;
    snake.y += snake.dy;

    // Wrap the snake position horizontally on edge of screen
    if (snake.x < 0) {
        snake.x = canvas.width - grid;
    } else if (snake.x >= canvas.width) {
        snake.x = 0;
    }

    // Wrap the snake position vertically on edge of screen
    if (snake.y < 0) {
        snake.y = canvas.height - grid;
    } else if (snake.y >= canvas.height) {
        snake.y = 0;
    }

    // Keep track of where snake has been
    snake.cells.unshift({x: snake.x, y: snake.y});

    // Remove cells as we move away from them
    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    // Draw the apple
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    // Draw the snake with gradient and shadow
    ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = gradient;

    snake.cells.forEach((cell, index) => {
        // Handle eating animation for the head
        if (eatAnimation && index === 0) {
            ctx.save();
            ctx.translate(cell.x + grid / 2, cell.y + grid / 2);
            ctx.scale(animationScale, animationScale);
            ctx.translate(- (cell.x + grid / 2), - (cell.y + grid / 2));
        }

        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (eatAnimation && index === 0) {
            ctx.restore();
        }

        // Snake collides with itself
        for (let i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                // Reset game
                snake.x = 160;
                snake.y = 160;
                snake.cells = [];
                snake.maxCells = 4;
                snake.dx = grid;
                snake.dy = 0;

                apple.x = getRandomInt(0, Math.floor(canvas.width / grid)) * grid;
                apple.y = getRandomInt(0, Math.floor(canvas.height / grid)) * grid;

                score = 0;
                scoreElement.textContent = 'Score: ' + score;
            }
        }

        // Snake eats apple
        if (cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            score++;
            scoreElement.textContent = 'Score: ' + score;

            // Trigger eating animation
            eatAnimation = true;
            animationScale = 1;

            // Place apple in random position
            apple.x = getRandomInt(0, Math.floor(canvas.width / grid)) * grid;
            apple.y = getRandomInt(0, Math.floor(canvas.height / grid)) * grid;

            // Ensure apple doesn't appear on the snake
            snake.cells.forEach(cell => {
                if (cell.x === apple.x && cell.y === apple.y) {
                    apple.x = getRandomInt(0, Math.floor(canvas.width / grid)) * grid;
                    apple.y = getRandomInt(0, Math.floor(canvas.height / grid)) * grid;
                }
            });
        }
    });

    // Handle eating animation
    if (eatAnimation) {
        animationScale += 0.1;
        if (animationScale >= 1.5) {
            eatAnimation = false;
            animationScale = 1;
        }
    }

    // Reset shadow settings after drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Start the game loop
requestAnimationFrame(loop);

// Handle keyboard controls
document.addEventListener('keydown', function(e) {
    // Prevent default arrow key and space bar behavior (scrolling)
    if([37, 38, 39, 40, 32].indexOf(e.keyCode) > -1){
        e.preventDefault();
    }

    switch(e.keyCode) {
        case 37: // Left
            if (snake.dx === 0) {
                snake.dx = -grid;
                snake.dy = 0;
            }
            break;
        case 38: // Up
            if (snake.dy === 0) {
                snake.dy = -grid;
                snake.dx = 0;
            }
            break;
        case 39: // Right
            if (snake.dx === 0) {
                snake.dx = grid;
                snake.dy = 0;
            }
            break;
        case 40: // Down
            if (snake.dy === 0) {
                snake.dy = grid;
                snake.dx = 0;
            }
            break;
        case 32: // Space Bar
            togglePause();
            break;
    }
});

// Handle touch controls for mobile
// Add this new touchstart event listener
canvas.addEventListener('touchstart', function(e) {
    if (isPaused) {
        // Optionally, allow tapping to resume the game
        return;
    }

    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();

    // Calculate touch position relative to the canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal tap
        if (deltaX > 0 && snake.dx === 0) { // Right
            snake.dx = speed;
            snake.dy = 0;
        } else if (deltaX < 0 && snake.dx === 0) { // Left
            snake.dx = -speed;
            snake.dy = 0;
        }
    } else {
        // Vertical tap
        if (deltaY > 0 && snake.dy === 0) { // Down
            snake.dy = speed;
            snake.dx = 0;
        } else if (deltaY < 0 && snake.dy === 0) { // Up
            snake.dy = -speed;
            snake.dx = 0;
        }
    }

    e.preventDefault(); // Prevent default behavior like scrolling
}, false);


// Utility function to get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Function to toggle the paused state
function togglePause() {
    isPaused = !isPaused;
    togglePauseOverlay();
    updatePauseButton();
}

// Function to toggle the paused overlay visibility
function togglePauseOverlay() {
    if (isPaused) {
        pausedOverlay.style.display = 'block';
    } else {
        pausedOverlay.style.display = 'none';
    }
}

// Function to update the pause button label and style
function updatePauseButton() {
    if (isPaused) {
        pauseButton.textContent = 'Resume';
        pauseButton.style.backgroundColor = '#8BC462'; // Change color to indicate resume
    } else {
        pauseButton.textContent = 'Pause';
        pauseButton.style.backgroundColor = '#8BC462'; // Change back to green
    }
}

// Add event listener to the pause button
pauseButton.addEventListener('click', function() {
    togglePause();
});

// Initialize the pause button label
updatePauseButton();