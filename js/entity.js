/**
 * Base class for all game entities
 */
class Entity {
    constructor(x, y, radius, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.id = Math.random().toString(36).substr(2, 9); // Random ID for entity
        this.isActive = true; // Whether this entity is active (for object pooling)
    }
    
    /**
     * Update entity state (to be overridden by subclasses)
     */
    update(deltaTime) {
        // Base update logic here
    }
    
    /**
     * Render entity (to be overridden by subclasses)
     */
    render(ctx, viewport) {
        // Base render logic here
        // Check if entity is in view before rendering
        if (!Utils.isInViewport(
            this.x, 
            this.y, 
            viewport, 
            this.radius + GAME_CONSTANTS.VISIBLE_AREA_PADDING
        )) {
            return; // Skip rendering if not in viewport
        }
        
        // Calculate screen position
        const screenX = this.x - viewport.x;
        const screenY = this.y - viewport.y;
        
        // Draw entity
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Check if this entity collides with another entity
     */
    collidesWith(other) {
        const distance = Utils.distance(this.x, this.y, other.x, other.y);
        return distance < this.radius + other.radius;
    }
    
    /**
     * Handle collision with another entity (to be overridden by subclasses)
     */
    handleCollision(other) {
        // Base collision handling logic here
    }
    
    /**
     * Activate this entity (for object pooling)
     */
    activate(x, y) {
        this.x = x;
        this.y = y;
        this.isActive = true;
    }
    
    /**
     * Deactivate this entity (for object pooling)
     */
    deactivate() {
        this.isActive = false;
    }
    
    /**
     * Get the entity's bounds for quadtree
     */
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}