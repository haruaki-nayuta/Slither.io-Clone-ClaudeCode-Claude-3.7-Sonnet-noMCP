/**
 * Base Snake class for both Player and NPC
 */
class Snake extends Entity {
    constructor(x, y, size = GAME_CONSTANTS.PLAYER_INITIAL_SIZE, color = null, name = 'Snake') {
        const snakeColor = color || Utils.randomColor();
        super(x, y, GAME_CONSTANTS.PLAYER_INITIAL_SIZE, snakeColor);
        
        this.name = name;
        this.size = size;
        this.speed = GAME_CONSTANTS.PLAYER_SPEED;
        this.angle = Utils.random(0, Math.PI * 2); // Facing direction
        this.targetAngle = this.angle; // Angle to turn towards
        this.turnSpeed = GAME_CONSTANTS.PLAYER_TURN_SPEED;
        this.boosting = false;
        this.segments = []; // Body segments
        this.isDead = false;
        this.score = 0;
        this.pattern = 'solid'; // Visual pattern (solid, striped, dotted)
        
        // Initialize segments
        this.initializeSegments();
    }
    
    /**
     * Initialize snake segments
     */
    initializeSegments() {
        this.segments = [];
        const segmentCount = GAME_CONSTANTS.PLAYER_INITIAL_SEGMENTS;
        
        for (let i = 0; i < segmentCount; i++) {
            // Place segments behind the snake head
            const distance = i * GAME_CONSTANTS.SEGMENT_SPACING;
            const segmentX = this.x - Math.cos(this.angle) * distance;
            const segmentY = this.y - Math.sin(this.angle) * distance;
            
            this.segments.push({
                x: segmentX,
                y: segmentY,
                size: this.size * (1 - i / segmentCount * 0.5) // Gradually smaller segments
            });
        }
    }
    
    /**
     * Update snake state
     */
    update(deltaTime) {
        if (this.isDead) return;
        
        // Update angle (smooth turning)
        const angleDiff = Utils.angleDifference(this.angle, this.targetAngle);
        this.angle += angleDiff * this.turnSpeed;
        
        // Calculate movement speed
        let moveSpeed = this.speed;
        if (this.boosting) {
            moveSpeed = GAME_CONSTANTS.PLAYER_BOOST_SPEED;
            // Lose size when boosting
            this.size -= GAME_CONSTANTS.PLAYER_BOOST_COST;
            if (this.size < GAME_CONSTANTS.PLAYER_INITIAL_SIZE / 2) {
                this.boosting = false; // Stop boosting if too small
            }
        }
        
        // Move the snake head
        const dx = Math.cos(this.angle) * moveSpeed;
        const dy = Math.sin(this.angle) * moveSpeed;
        this.x += dx;
        this.y += dy;
        
        // Wrap around map edges
        const wrapped = Utils.wrapPosition(this.x, this.y, 
            GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);
        this.x = wrapped.x;
        this.y = wrapped.y;
        
        // Update segments (follow the leader)
        this.updateSegments(deltaTime);
        
        // Update radius based on size
        this.radius = Math.sqrt(this.size) + GAME_CONSTANTS.PLAYER_INITIAL_SIZE / 2;
        
        // Update score based on size
        this.score = Math.floor(this.size);
    }
    
    /**
     * Update segments to follow the head
     */
    updateSegments(deltaTime) {
        // If no segments, create them
        if (this.segments.length === 0) {
            this.initializeSegments();
            return;
        }
        
        // Target spacing based on size and segment count
        const targetSpacing = GAME_CONSTANTS.SEGMENT_SPACING * 
            (0.8 + this.size / GAME_CONSTANTS.PLAYER_INITIAL_SIZE * 0.2);
        
        // First segment follows the head
        let prevX = this.x;
        let prevY = this.y;
        let prevSize = this.size;
        
        // Update each segment to follow the one in front of it
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            
            // Calculate direction to previous point
            const dx = prevX - segment.x;
            const dy = prevY - segment.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only move if too far or too close
            if (distance > targetSpacing * 1.1 || distance < targetSpacing * 0.9) {
                // Calculate new position
                const moveRatio = (distance - targetSpacing) / distance;
                segment.x += dx * moveRatio * 0.5; // Smooth following
                segment.y += dy * moveRatio * 0.5;
                
                // Wrap around map edges
                const wrapped = Utils.wrapPosition(segment.x, segment.y, 
                    GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);
                segment.x = wrapped.x;
                segment.y = wrapped.y;
            }
            
            // Gradually decrease segment size
            segment.size = prevSize * 0.95;
            
            // This segment becomes the target for the next one
            prevX = segment.x;
            prevY = segment.y;
            prevSize = segment.size;
        }
        
        // Adjust number of segments based on size
        const targetSegmentCount = Math.floor(10 + this.size / 2);
        
        if (this.segments.length > targetSegmentCount) {
            // Remove excess segments
            this.segments = this.segments.slice(0, targetSegmentCount);
        } else if (this.segments.length < targetSegmentCount) {
            // Add segments if needed
            const lastSegment = this.segments[this.segments.length - 1];
            for (let i = this.segments.length; i < targetSegmentCount; i++) {
                this.segments.push({
                    x: lastSegment.x,
                    y: lastSegment.y,
                    size: lastSegment.size * 0.95
                });
            }
        }
    }
    
    /**
     * Render the snake
     */
    render(ctx, viewport) {
        if (this.isDead) return;
        
        // Skip rendering if not in viewport (with a generous margin)
        // We need to check both the head and the tail
        const headInView = Utils.isInViewport(
            this.x, this.y, viewport, this.radius + GAME_CONSTANTS.VISIBLE_AREA_PADDING
        );
        
        const tailSegment = this.segments[this.segments.length - 1];
        let tailInView = false;
        if (tailSegment) {
            tailInView = Utils.isInViewport(
                tailSegment.x, tailSegment.y, viewport, 
                this.radius + GAME_CONSTANTS.VISIBLE_AREA_PADDING
            );
        }
        
        if (!headInView && !tailInView) {
            return; // Skip rendering if neither head nor tail is in view
        }
        
        // Draw segments from tail to head
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            
            // Skip segments not in viewport
            if (!Utils.isInViewport(
                segment.x, segment.y, viewport, 
                segment.size + GAME_CONSTANTS.VISIBLE_AREA_PADDING
            )) {
                continue;
            }
            
            // Calculate screen position
            const screenX = segment.x - viewport.x;
            const screenY = segment.y - viewport.y;
            
            // Draw segment with pattern
            this.drawSegmentWithPattern(ctx, screenX, screenY, segment.size, i);
        }
        
        // Draw head
        const screenX = this.x - viewport.x;
        const screenY = this.y - viewport.y;
        
        // Draw snake head
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        this.drawEyes(ctx, screenX, screenY);
        
        // Draw name above head (if not the player)
        if (this.name !== 'Player') {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, screenX, screenY - this.radius - 10);
        }
    }
    
    /**
     * Draw segment with pattern
     */
    drawSegmentWithPattern(ctx, x, y, size, index) {
        // Base segment
        ctx.fillStyle = this.color;
        
        // Apply different patterns
        if (this.pattern === 'solid') {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.pattern === 'striped') {
            // Striped pattern (alternating segments)
            if (index % 2 === 0) {
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = this.color + '80'; // Semi-transparent
                ctx.fill();
            }
        } else if (this.pattern === 'dotted') {
            // Dotted pattern
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add dots inside
            if (index % 3 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(x, y, size / 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    /**
     * Draw eyes on the snake head
     */
    drawEyes(ctx, x, y) {
        const eyeDistance = this.radius * 0.7;
        const eyeSize = this.radius * 0.3;
        const pupilSize = eyeSize * 0.5;
        
        // Calculate eye positions based on the snake's angle
        const leftEyeX = x + Math.cos(this.angle - 0.3) * eyeDistance;
        const leftEyeY = y + Math.sin(this.angle - 0.3) * eyeDistance;
        
        const rightEyeX = x + Math.cos(this.angle + 0.3) * eyeDistance;
        const rightEyeY = y + Math.sin(this.angle + 0.3) * eyeDistance;
        
        // Draw eye whites
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils slightly offset in the direction of movement
        const pupilOffsetX = Math.cos(this.angle) * (eyeSize * 0.2);
        const pupilOffsetY = Math.sin(this.angle) * (eyeSize * 0.2);
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX + pupilOffsetX, leftEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX + pupilOffsetX, rightEyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Check if this snake's head collides with another snake's body
     */
    collidesWithSnake(otherSnake) {
        // Skip collision check if either snake is dead
        if (this.isDead || otherSnake.isDead) return false;
        
        // Skip self-collision
        if (this === otherSnake) return false;
        
        // Check collision with other snake's segments
        for (const segment of otherSnake.segments) {
            const distance = Utils.distance(this.x, this.y, segment.x, segment.y);
            if (distance < this.radius + segment.size / 2) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Handle eating food
     */
    eat(food) {
        this.size += food.value;
        return food.value;
    }
    
    /**
     * Handle death - return food to spawn
     */
    die() {
        if (this.isDead) return [];
        
        this.isDead = true;
        
        // Number of food pieces based on snake size
        const foodCount = Math.min(50, Math.max(10, Math.floor(this.size / 3)));
        
        // Create food from the dead snake
        return Food.createFromSnake(this, foodCount);
    }
    
    /**
     * Get the snake's current state data
     */
    getStateData() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            size: this.size,
            color: this.color,
            x: this.x,
            y: this.y,
            angle: this.angle,
            boosting: this.boosting,
            isDead: this.isDead
        };
    }
}