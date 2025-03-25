/**
 * UI class for managing game interface elements
 */
class UI {
    constructor(game) {
        this.game = game;
        
        // DOM elements
        this.scoreElement = document.getElementById('score');
        this.fpsElement = document.getElementById('fps');
        this.leaderboardElement = document.getElementById('leaderboard-list');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.querySelector('#final-score span');
        this.maxSizeElement = document.querySelector('#max-size span');
        this.playTimeElement = document.querySelector('#play-time span');
        this.killedNpcsElement = document.querySelector('#killed-npcs span');
        this.highScoreElement = document.querySelector('#high-score span');
        this.restartButton = document.getElementById('restart-button');
        this.startMenuElement = document.getElementById('start-menu');
        this.difficultyButtons = document.querySelectorAll('.difficulty-buttons button');
        
        // FPS calculation
        this.fpsUpdateInterval = 500; // Update FPS display every 500ms
        this.lastFpsUpdate = 0;
        this.frameCount = 0;
        this.currentFps = 0;
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Restart button
        this.restartButton.addEventListener('click', () => {
            this.hideGameOver();
            this.showStartMenu();
        });
        
        // Difficulty selection
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.getAttribute('data-difficulty').toUpperCase();
                this.hideStartMenu();
                this.game.startGame(difficulty);
            });
        });
    }
    
    /**
     * Update UI elements
     */
    update(deltaTime) {
        // Update FPS counter
        this.updateFPS(deltaTime);
        
        // Update score display
        if (this.game.player && !this.game.player.isDead) {
            this.scoreElement.textContent = Math.floor(this.game.player.score);
        }
        
        // Update leaderboard
        this.updateLeaderboard();
    }
    
    /**
     * Update FPS counter
     */
    updateFPS(deltaTime) {
        this.frameCount++;
        this.lastFpsUpdate += deltaTime;
        
        if (this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.currentFps = Math.round((this.frameCount * 1000) / this.lastFpsUpdate);
            this.fpsElement.textContent = this.currentFps;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
        }
    }
    
    /**
     * Update leaderboard with top 10 snakes
     */
    updateLeaderboard() {
        // Get all active snakes
        const snakes = [...this.game.npcs, this.game.player].filter(snake => !snake.isDead);
        
        // Sort by score (descending)
        snakes.sort((a, b) => b.score - a.score);
        
        // Take top 10
        const topSnakes = snakes.slice(0, 10);
        
        // Clear current leaderboard
        this.leaderboardElement.innerHTML = '';
        
        // Add each snake to leaderboard
        topSnakes.forEach((snake, index) => {
            const listItem = document.createElement('li');
            
            // Highlight player's entry
            if (snake === this.game.player) {
                listItem.classList.add('player');
            }
            
            // Set content
            listItem.innerHTML = `
                <span>${index + 1}. ${snake.name}</span>
                <span>${Math.floor(snake.score)}</span>
            `;
            
            this.leaderboardElement.appendChild(listItem);
        });
    }
    
    /**
     * Show game over screen with stats
     */
    showGameOver() {
        // Get player stats
        const stats = this.game.player.getStats();
        
        // Update stats display
        this.finalScoreElement.textContent = Math.floor(stats.score);
        this.maxSizeElement.textContent = Math.floor(stats.maxSize);
        this.playTimeElement.textContent = Utils.formatTime(stats.playTime);
        this.killedNpcsElement.textContent = stats.killedNPCs;
        
        // Check for high score
        const highScore = this.getHighScore();
        if (stats.score > highScore) {
            this.setHighScore(stats.score);
        }
        this.highScoreElement.textContent = Math.floor(Math.max(highScore, stats.score));
        
        // Show game over element
        this.gameOverElement.classList.remove('hidden');
    }
    
    /**
     * Hide game over screen
     */
    hideGameOver() {
        this.gameOverElement.classList.add('hidden');
    }
    
    /**
     * Show start menu
     */
    showStartMenu() {
        this.startMenuElement.style.display = 'flex';
    }
    
    /**
     * Hide start menu
     */
    hideStartMenu() {
        this.startMenuElement.style.display = 'none';
    }
    
    /**
     * Get high score from localStorage
     */
    getHighScore() {
        return parseInt(localStorage.getItem('slither_high_score') || '0');
    }
    
    /**
     * Set high score in localStorage
     */
    setHighScore(score) {
        localStorage.setItem('slither_high_score', Math.floor(score).toString());
    }
    
    /**
     * Show a temporary message on screen
     */
    showMessage(message, duration = 2000) {
        // Create message element if it doesn't exist
        if (!this.messageElement) {
            this.messageElement = document.createElement('div');
            this.messageElement.style.position = 'absolute';
            this.messageElement.style.top = '100px';
            this.messageElement.style.left = '50%';
            this.messageElement.style.transform = 'translateX(-50%)';
            this.messageElement.style.padding = '10px 20px';
            this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.messageElement.style.color = 'white';
            this.messageElement.style.borderRadius = '5px';
            this.messageElement.style.fontSize = '18px';
            this.messageElement.style.fontWeight = 'bold';
            this.messageElement.style.zIndex = '100';
            this.messageElement.style.pointerEvents = 'none';
            document.body.appendChild(this.messageElement);
        }
        
        // Set message text
        this.messageElement.textContent = message;
        
        // Show message
        this.messageElement.style.display = 'block';
        
        // Hide message after duration
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.messageElement.style.display = 'none';
        }, duration);
    }
}