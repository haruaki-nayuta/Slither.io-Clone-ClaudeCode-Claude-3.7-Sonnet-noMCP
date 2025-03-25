/**
 * Map class for rendering the game world
 */
class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.backgroundColor = GAME_CONSTANTS.BACKGROUND_COLOR;
        this.gridColor = GAME_CONSTANTS.GRID_COLOR;
        this.gridSpacing = GAME_CONSTANTS.GRID_SPACING;
        
        // Create background pattern (pre-render for performance)
        this.backgroundPattern = this.createBackgroundPattern();
    }
    
    /**
     * Create a background pattern as a separate canvas for better performance
     */
    createBackgroundPattern() {
        // Create a small pattern canvas
        const patternSize = this.gridSpacing * 2;
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = patternSize;
        patternCanvas.height = patternSize;
        const patternCtx = patternCanvas.getContext('2d');
        
        // Fill background
        patternCtx.fillStyle = this.backgroundColor;
        patternCtx.fillRect(0, 0, patternSize, patternSize);
        
        // Draw grid lines
        patternCtx.strokeStyle = this.gridColor;
        patternCtx.lineWidth = 1;
        
        // Draw horizontal and vertical lines
        patternCtx.beginPath();
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(patternSize, 0);
        patternCtx.moveTo(0, this.gridSpacing);
        patternCtx.lineTo(patternSize, this.gridSpacing);
        patternCtx.moveTo(0, 0);
        patternCtx.lineTo(0, patternSize);
        patternCtx.moveTo(this.gridSpacing, 0);
        patternCtx.lineTo(this.gridSpacing, patternSize);
        patternCtx.stroke();
        
        return patternCanvas;
    }
    
    /**
     * Render the map background (optimized to only render visible area)
     */
    render(ctx, viewport) {
        // Get bounds of the viewport
        const startX = Math.floor(viewport.x / this.gridSpacing) * this.gridSpacing;
        const startY = Math.floor(viewport.y / this.gridSpacing) * this.gridSpacing;
        const endX = Math.ceil((viewport.x + viewport.width) / this.gridSpacing) * this.gridSpacing;
        const endY = Math.ceil((viewport.y + viewport.height) / this.gridSpacing) * this.gridSpacing;
        
        // Fill the viewport with background color
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, viewport.width, viewport.height);
        
        // Option 1: Draw grid lines directly
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        
        // Draw vertical grid lines
        for (let x = startX; x <= endX; x += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x - viewport.x, 0);
            ctx.lineTo(x - viewport.x, viewport.height);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = startY; y <= endY; y += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y - viewport.y);
            ctx.lineTo(viewport.width, y - viewport.y);
            ctx.stroke();
        }
        
        /* Option 2: Use pattern (can be more efficient in some browsers)
        // Calculate pattern offset to align with grid
        const offsetX = -(viewport.x % this.backgroundPattern.width);
        const offsetY = -(viewport.y % this.backgroundPattern.height);
        
        // Create pattern
        const pattern = ctx.createPattern(this.backgroundPattern, 'repeat');
        ctx.fillStyle = pattern;
        
        // Apply transformation to align pattern with grid
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.fillRect(-offsetX, -offsetY, viewport.width, viewport.height);
        ctx.restore();
        */
        
        // Draw map boundaries if near edge
        this.drawMapBoundaries(ctx, viewport);
    }
    
    /**
     * Draw map boundaries when player is near the edge
     */
    drawMapBoundaries(ctx, viewport) {
        const boundaryWidth = 5;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        
        // Left boundary
        if (viewport.x < 100) {
            const width = Math.min(boundaryWidth, viewport.x);
            ctx.fillRect(0, 0, width, viewport.height);
        }
        
        // Right boundary
        if (viewport.x + viewport.width > this.width - 100) {
            const distFromEdge = this.width - (viewport.x + viewport.width);
            const width = Math.min(boundaryWidth, viewport.width);
            const x = viewport.width - Math.min(boundaryWidth, viewport.width - distFromEdge);
            ctx.fillRect(x, 0, width, viewport.height);
        }
        
        // Top boundary
        if (viewport.y < 100) {
            const height = Math.min(boundaryWidth, viewport.y);
            ctx.fillRect(0, 0, viewport.width, height);
        }
        
        // Bottom boundary
        if (viewport.y + viewport.height > this.height - 100) {
            const distFromEdge = this.height - (viewport.y + viewport.height);
            const height = Math.min(boundaryWidth, viewport.height);
            const y = viewport.height - Math.min(boundaryWidth, viewport.height - distFromEdge);
            ctx.fillRect(0, y, viewport.width, height);
        }
    }
    
    /**
     * Render the minimap
     */
    renderMinimap(ctx, entities, player) {
        // Clear minimap
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Calculate scale factor
        const scaleX = ctx.canvas.width / this.width;
        const scaleY = ctx.canvas.height / this.height;
        
        // Draw border
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw grid (simplified)
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 0.5;
        const gridStep = this.gridSpacing * 4; // Larger grid on minimap
        
        for (let x = 0; x < this.width; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x * scaleX, 0);
            ctx.lineTo(x * scaleX, ctx.canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y * scaleY);
            ctx.lineTo(ctx.canvas.width, y * scaleY);
            ctx.stroke();
        }
        
        // Draw food entities as small dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (const entity of entities) {
            if (entity instanceof Food) {
                ctx.beginPath();
                ctx.arc(entity.x * scaleX, entity.y * scaleY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw snake entities
        for (const entity of entities) {
            if (entity instanceof Snake && !entity.isDead) {
                // Skip player as we'll draw it last
                if (entity === player) continue;
                
                ctx.fillStyle = entity.color;
                const size = Math.max(2, entity.size * scaleX / 10);
                ctx.beginPath();
                ctx.arc(entity.x * scaleX, entity.y * scaleY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw player (larger and with border)
        if (player && !player.isDead) {
            const playerSize = Math.max(3, player.size * scaleX / 8);
            
            // Draw white border around player
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(player.x * scaleX, player.y * scaleY, playerSize + 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw player
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(player.x * scaleX, player.y * scaleY, playerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw viewport rectangle
        if (player && !player.isDead) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            
            // Calculate viewport dimensions on minimap
            const vpX = Math.max(0, player.x - window.innerWidth / 2);
            const vpY = Math.max(0, player.y - window.innerHeight / 2);
            const vpWidth = Math.min(window.innerWidth, this.width - vpX);
            const vpHeight = Math.min(window.innerHeight, this.height - vpY);
            
            ctx.strokeRect(
                vpX * scaleX,
                vpY * scaleY,
                vpWidth * scaleX,
                vpHeight * scaleY
            );
        }
    }
}