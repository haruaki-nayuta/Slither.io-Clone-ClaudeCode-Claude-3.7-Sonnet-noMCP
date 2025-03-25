/**
 * Food class for players and NPCs to eat
 */
class Food extends Entity {
    constructor(x, y, color = null, value = GAME_CONSTANTS.FOOD_VALUE) {
        const foodColor = color || Utils.randomItem(GAME_CONSTANTS.FOOD_COLORS);
        super(x, y, GAME_CONSTANTS.FOOD_SIZE, foodColor);
        this.value = value; // How much size the snake gains by eating this food
        this.glowEffect = 0; // For visual pulsing effect
        this.glowDirection = 1; // 1 for increasing, -1 for decreasing
    }
    
    /**
     * Update food state
     */
    update(deltaTime) {
        // Update glow effect for visual interest
        this.glowEffect += this.glowDirection * 0.05;
        
        if (this.glowEffect >= 1) {
            this.glowEffect = 1;
            this.glowDirection = -1;
        } else if (this.glowEffect <= 0) {
            this.glowEffect = 0;
            this.glowDirection = 1;
        }
    }
    
    /**
     * Render food with glow effect
     */
    render(ctx, viewport) {
        // Skip rendering if not in viewport
        if (!Utils.isInViewport(
            this.x, 
            this.y, 
            viewport, 
            this.radius + GAME_CONSTANTS.VISIBLE_AREA_PADDING
        )) {
            return;
        }
        
        // Calculate screen position
        const screenX = this.x - viewport.x;
        const screenY = this.y - viewport.y;
        
        // Draw glow effect
        const glowRadius = this.radius * (1 + this.glowEffect * 0.3);
        ctx.fillStyle = this.color + '40'; // Add transparency for glow
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw food
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Create food from a dead snake (with explosion effect)
     */
    static createFromSnake(snake, count) {
        const foods = [];
        const angleStep = (Math.PI * 2) / count;
        const value = snake.size / count; // Distribute snake's size among food pieces
        
        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const distance = Utils.random(10, 50);
            const x = snake.x + Math.cos(angle) * distance;
            const y = snake.y + Math.sin(angle) * distance;
            
            // Use snake's color for the food
            const food = new Food(x, y, snake.color, value);
            // Make these food items a bit larger
            food.radius = GAME_CONSTANTS.FOOD_SIZE * 1.5;
            foods.push(food);
        }
        
        return foods;
    }
}