/**
 * Player class for the user-controlled snake
 */
class Player extends Snake {
    constructor(x, y) {
        super(x, y, GAME_CONSTANTS.PLAYER_INITIAL_SIZE, '#FFF000', 'Player');
        
        // Player-specific properties
        this.mouseX = 0;
        this.mouseY = 0;
        this.boostKeyPressed = false;
        this.turnSpeedModifier = 1.2; // Player turns faster than NPCs
        this.killedNPCs = 0;
        this.startTime = Date.now();
        this.maxSize = this.size;
    }
    
    /**
     * Set the mouse position (from event handler)
     */
    setMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
    
    /**
     * Set boost state (from event handler)
     */
    setBoost(boosting) {
        this.boostKeyPressed = boosting;
    }
    
    /**
     * Update player state
     */
    update(deltaTime, viewport) {
        if (this.isDead) return;
        
        // Calculate the target angle based on mouse position
        // We need to convert mouse screen coordinates to world coordinates
        const targetWorldX = this.mouseX + viewport.x;
        const targetWorldY = this.mouseY + viewport.y;
        
        this.targetAngle = Utils.angle(this.x, this.y, targetWorldX, targetWorldY);
        
        // Apply boost if requested and possible
        this.boosting = this.boostKeyPressed && this.size > GAME_CONSTANTS.PLAYER_INITIAL_SIZE;
        
        // Update player state
        super.update(deltaTime);
        
        // Track maximum size
        if (this.size > this.maxSize) {
            this.maxSize = this.size;
        }
    }
    
    /**
     * Render player (adding visual indicators)
     */
    render(ctx, viewport) {
        super.render(ctx, viewport);
        
        // The player's snake is always visible, so we don't need the visibility check here
        
        // Add boost effect if boosting
        if (this.boosting) {
            const screenX = this.x - viewport.x;
            const screenY = this.y - viewport.y;
            
            // Draw boost trail
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#FFA500';
            
            for (let i = 0; i < 3; i++) {
                const distance = (i + 1) * 15;
                const trailX = screenX - Math.cos(this.angle) * distance;
                const trailY = screenY - Math.sin(this.angle) * distance;
                const trailSize = this.radius * (1 - i * 0.2);
                
                ctx.beginPath();
                ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1.0;
        }
    }
    
    /**
     * Handle eating food with visual and audio feedback
     */
    eat(food) {
        const value = super.eat(food);
        
        // Add visual feedback (implemented in Game class)
        
        return value;
    }
    
    /**
     * Handle player death
     */
    die() {
        if (this.isDead) return [];
        
        // Get play time in seconds
        const playTime = (Date.now() - this.startTime) / 1000;
        
        // Save stats for game over screen
        this.finalStats = {
            score: this.score,
            maxSize: this.maxSize,
            playTime: playTime,
            killedNPCs: this.killedNPCs
        };
        
        // Create food from dead player
        return super.die();
    }
    
    /**
     * Increment killed NPCs counter
     */
    registerKill() {
        this.killedNPCs++;
    }
    
    /**
     * Get the time played in seconds
     */
    getPlayTime() {
        if (this.isDead) {
            return this.finalStats.playTime;
        }
        return (Date.now() - this.startTime) / 1000;
    }
    
    /**
     * Get player stats for game over screen
     */
    getStats() {
        if (this.isDead && this.finalStats) {
            return this.finalStats;
        }
        
        return {
            score: this.score,
            maxSize: this.maxSize,
            playTime: this.getPlayTime(),
            killedNPCs: this.killedNPCs
        };
    }
    
    /**
     * Reset player for a new game
     */
    reset(x, y) {
        // Reset base snake properties
        this.x = x;
        this.y = y;
        this.size = GAME_CONSTANTS.PLAYER_INITIAL_SIZE;
        this.angle = Utils.random(0, Math.PI * 2);
        this.targetAngle = this.angle;
        this.isDead = false;
        this.score = 0;
        
        // Reset player-specific properties
        this.boosting = false;
        this.boostKeyPressed = false;
        this.killedNPCs = 0;
        this.startTime = Date.now();
        this.maxSize = this.size;
        this.finalStats = null;
        
        // Reinitialize segments
        this.initializeSegments();
    }
}