/**
 * NPC class for AI-controlled snakes
 */
class NPC extends Snake {
    constructor(x, y, size, type = 'NORMAL', name = null) {
        // Get type settings from constants
        const typeSettings = GAME_CONSTANTS.NPC_TYPES[type];
        
        // Generate a name if not provided
        const npcName = name || `Snake-${Math.floor(Math.random() * 1000)}`;
        
        // Create snake with type-specific color
        super(x, y, size, typeSettings.COLOR, npcName);
        
        // NPC-specific properties
        this.type = type;
        this.pattern = typeSettings.PATTERN;
        this.state = 'EXPLORE'; // Initial state
        this.stateTimer = 0;     // Time in current state
        this.decisionInterval = GAME_CONSTANTS.NPC_DECISION_INTERVAL;
        this.turnSpeed = GAME_CONSTANTS.NPC_TURN_SPEED;
        
        // Behavior probabilities from type settings
        this.exploreProbability = typeSettings.EXPLORE_PROB;
        this.attackProbability = typeSettings.ATTACK_PROB;
        this.fleeProbability = typeSettings.FLEE_PROB;
        
        // Tracking variables
        this.targetEntity = null;
        this.lastDecisionTime = 0;
        this.dangerDirection = null;
        
        // Set random movement at start
        this.setRandomTargetAngle();
    }
    
    /**
     * Update NPC state
     */
    update(deltaTime, entityManager, player) {
        if (this.isDead) return;
        
        // Base snake update
        super.update(deltaTime);
        
        // Update decision timer
        this.stateTimer += deltaTime;
        
        // Make decisions at intervals (to improve performance)
        if (this.stateTimer >= this.decisionInterval) {
            this.makeDecision(entityManager, player);
            this.stateTimer = 0;
        }
        
        // Execute current state behavior
        this.executeStateBehavior(entityManager, player);
    }
    
    /**
     * Make decision about state transitions
     */
    makeDecision(entityManager, player) {
        // Get nearby entities
        const nearbyEntities = this.getNearbyEntities(entityManager);
        
        // Analyze environment to determine threats and opportunities
        const { nearestFood, nearestLargerSnake, nearestSmallerSnake, threats } = 
            this.analyzeEnvironment(nearbyEntities, player);
        
        // State transition logic based on NPC type and environment
        if (threats.length > 0) {
            // If there are threats, consider fleeing
            if (Math.random() < this.fleeProbability) {
                this.state = 'FLEE';
                // Find the most dangerous threat (closest large snake)
                const mostDangerousThreat = threats.reduce((closest, threat) => {
                    const distToClosest = closest ? Utils.distance(this.x, this.y, closest.x, closest.y) : Infinity;
                    const distToThreat = Utils.distance(this.x, this.y, threat.x, threat.y);
                    return distToThreat < distToClosest ? threat : closest;
                }, null);
                
                if (mostDangerousThreat) {
                    // Calculate angle away from threat
                    const angleToThreat = Utils.angle(this.x, this.y, mostDangerousThreat.x, mostDangerousThreat.y);
                    this.dangerDirection = angleToThreat;
                    // Set target angle opposite to the threat
                    this.targetAngle = (angleToThreat + Math.PI) % (Math.PI * 2);
                    this.boosting = true; // Boost when fleeing
                }
            }
        } else if (nearestSmallerSnake && Math.random() < this.attackProbability) {
            // No threats and attacking probability check passes
            this.state = 'ATTACK';
            this.targetEntity = nearestSmallerSnake;
            this.boosting = nearestSmallerSnake.size < this.size * 0.7; // Boost only if target is significantly smaller
        } else if (nearestFood) {
            // Default to collecting food if available
            this.state = 'COLLECT';
            this.targetEntity = nearestFood;
            this.boosting = false; // Don't boost when collecting food
        } else {
            // Default to exploration
            this.state = 'EXPLORE';
            this.setRandomTargetAngle();
            this.boosting = false;
        }
    }
    
    /**
     * Execute the current state behavior
     */
    executeStateBehavior(entityManager, player) {
        switch (this.state) {
            case 'EXPLORE':
                // In explore mode, periodically change direction
                if (Math.random() < 0.01) {
                    this.setRandomTargetAngle();
                }
                break;
                
            case 'COLLECT':
                // If we have a target food, move toward it
                if (this.targetEntity && !this.targetEntity.isDead) {
                    this.targetAngle = Utils.angle(
                        this.x, this.y, 
                        this.targetEntity.x, this.targetEntity.y
                    );
                } else {
                    // Target no longer valid, go back to exploring
                    this.state = 'EXPLORE';
                    this.setRandomTargetAngle();
                }
                break;
                
            case 'ATTACK':
                // If we have a target snake, predict and move toward its head
                if (this.targetEntity && !this.targetEntity.isDead) {
                    // Predict where the target will be
                    const predictedX = this.targetEntity.x + Math.cos(this.targetEntity.angle) * 
                        this.targetEntity.speed * 5; // Look ahead 5 frames
                    const predictedY = this.targetEntity.y + Math.sin(this.targetEntity.angle) * 
                        this.targetEntity.speed * 5;
                    
                    this.targetAngle = Utils.angle(this.x, this.y, predictedX, predictedY);
                    
                    // If we're getting too close to a larger snake, abort attack
                    const distance = Utils.distance(this.x, this.y, this.targetEntity.x, this.targetEntity.y);
                    if (distance < 50 && this.targetEntity.size > this.size) {
                        this.state = 'FLEE';
                        this.dangerDirection = Utils.angle(this.x, this.y, this.targetEntity.x, this.targetEntity.y);
                        this.targetAngle = (this.dangerDirection + Math.PI) % (Math.PI * 2);
                        this.boosting = true;
                    }
                } else {
                    // Target no longer valid, go back to exploring
                    this.state = 'EXPLORE';
                    this.setRandomTargetAngle();
                }
                break;
                
            case 'FLEE':
                // Continue fleeing for a short time, then reassess
                if (Math.random() < 0.05) { // 5% chance per frame to reassess
                    this.state = 'EXPLORE';
                    this.setRandomTargetAngle();
                    this.boosting = false;
                }
                break;
        }
        
        // Special behavior for aggressive NPCs - they sometimes set traps
        if (this.type === 'AGGRESSIVE' && this.size > 50 && Math.random() < 0.001) {
            this.setTrapBehavior();
        }
    }
    
    /**
     * Set a random target angle for exploration
     */
    setRandomTargetAngle() {
        this.targetAngle = Utils.random(0, Math.PI * 2);
    }
    
    /**
     * Set trap behavior (figure-8 pattern)
     */
    setTrapBehavior() {
        this.state = 'TRAP';
        
        // Start a figure-8 pattern
        const startAngle = this.angle;
        const trapRadius = this.size * 1.5;
        
        // Set a callback for a circular motion
        const self = this;
        let phase = 0;
        
        // This will be called by the game loop
        this.trapBehavior = function(deltaTime) {
            phase += deltaTime * 0.002;
            if (phase > 2) {
                // End trap behavior after full figure-8
                self.state = 'EXPLORE';
                self.trapBehavior = null;
                return;
            }
            
            // Figure-8 pattern using sin and cos
            self.targetAngle = startAngle + Math.sin(phase * Math.PI);
        };
    }
    
    /**
     * Get nearby entities from entity manager (optimized with quadtree)
     */
    getNearbyEntities(entityManager) {
        return entityManager.getEntitiesInRadius(
            this.x, this.y, GAME_CONSTANTS.NPC_SIGHT_RANGE
        );
    }
    
    /**
     * Analyze the environment to find threats and opportunities
     */
    analyzeEnvironment(nearbyEntities, player) {
        // Categorize entities
        const foods = [];
        const largerSnakes = [];
        const smallerSnakes = [];
        const threats = [];
        
        for (const entity of nearbyEntities) {
            // Skip self
            if (entity === this) continue;
            
            if (entity instanceof Food) {
                foods.push(entity);
            } else if (entity instanceof Snake) {
                // Skip dead snakes
                if (entity.isDead) continue;
                
                // Categorize based on size
                if (entity.size > this.size * 1.2) {
                    largerSnakes.push(entity);
                    
                    // Calculate distance to check if it's a threat
                    const distance = Utils.distance(this.x, this.y, entity.x, entity.y);
                    if (distance < GAME_CONSTANTS.NPC_SIGHT_RANGE * 0.7) {
                        threats.push(entity);
                    }
                } else if (entity.size < this.size * 0.8) {
                    smallerSnakes.push(entity);
                }
            }
        }
        
        // Also check if player is nearby and relevant
        if (player && !player.isDead) {
            const distanceToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
            if (distanceToPlayer < GAME_CONSTANTS.NPC_SIGHT_RANGE) {
                if (player.size > this.size * 1.2) {
                    largerSnakes.push(player);
                    if (distanceToPlayer < GAME_CONSTANTS.NPC_SIGHT_RANGE * 0.7) {
                        threats.push(player);
                    }
                } else if (player.size < this.size * 0.8) {
                    smallerSnakes.push(player);
                }
            }
        }
        
        // Find nearest food
        const nearestFood = this.findNearest(foods);
        
        // Find nearest larger and smaller snakes
        const nearestLargerSnake = this.findNearest(largerSnakes);
        const nearestSmallerSnake = this.findNearest(smallerSnakes);
        
        return {
            nearestFood,
            nearestLargerSnake,
            nearestSmallerSnake,
            threats
        };
    }
    
    /**
     * Find the nearest entity from a list
     */
    findNearest(entities) {
        if (entities.length === 0) return null;
        
        return entities.reduce((closest, entity) => {
            const distToClosest = closest ? Utils.distance(this.x, this.y, closest.x, closest.y) : Infinity;
            const distToEntity = Utils.distance(this.x, this.y, entity.x, entity.y);
            return distToEntity < distToClosest ? entity : closest;
        }, null);
    }
    
    /**
     * Render with state indication
     */
    render(ctx, viewport) {
        super.render(ctx, viewport);
        
        // Skip rendering if not in viewport
        if (!Utils.isInViewport(
            this.x, this.y, viewport, 
            this.radius + GAME_CONSTANTS.VISIBLE_AREA_PADDING
        )) {
            return;
        }
        
        // Calculate screen position
        const screenX = this.x - viewport.x;
        const screenY = this.y - viewport.y;
        
        // Visual indicator for state (small dot above the snake)
        let stateColor;
        switch (this.state) {
            case 'EXPLORE': stateColor = '#FFFFFF'; break;
            case 'COLLECT': stateColor = '#00FF00'; break;
            case 'ATTACK': stateColor = '#FF0000'; break;
            case 'FLEE': stateColor = '#0000FF'; break;
            case 'TRAP': stateColor = '#FF00FF'; break;
            default: stateColor = '#999999';
        }
        
        ctx.fillStyle = stateColor;
        ctx.beginPath();
        ctx.arc(screenX, screenY - this.radius - 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Create NPCs based on difficulty settings
     */
    static createNPCs(difficulty, mapWidth, mapHeight) {
        const npcs = [];
        const difficultySettings = GAME_CONSTANTS.DIFFICULTY[difficulty];
        
        // Determine count for each type
        const aggressiveCount = Math.floor(difficultySettings.MAX_NPC_COUNT * difficultySettings.AGGRESSIVE_RATIO);
        const normalCount = Math.floor(difficultySettings.MAX_NPC_COUNT * difficultySettings.NORMAL_RATIO);
        const timidCount = Math.floor(difficultySettings.MAX_NPC_COUNT * difficultySettings.TIMID_RATIO);
        
        // Generate names
        const names = this.generateNPCNames(difficultySettings.MAX_NPC_COUNT);
        
        // Create NPCs of each type
        let nameIndex = 0;
        
        // Create aggressive NPCs
        for (let i = 0; i < aggressiveCount; i++) {
            const x = Utils.random(0, mapWidth);
            const y = Utils.random(0, mapHeight);
            const size = Utils.random(
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE,
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE * difficultySettings.NPC_MAX_SIZE_MULTIPLIER * 0.5
            );
            npcs.push(new NPC(x, y, size, 'AGGRESSIVE', names[nameIndex++]));
        }
        
        // Create normal NPCs
        for (let i = 0; i < normalCount; i++) {
            const x = Utils.random(0, mapWidth);
            const y = Utils.random(0, mapHeight);
            const size = Utils.random(
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE,
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE * difficultySettings.NPC_MAX_SIZE_MULTIPLIER * 0.3
            );
            npcs.push(new NPC(x, y, size, 'NORMAL', names[nameIndex++]));
        }
        
        // Create timid NPCs
        for (let i = 0; i < timidCount; i++) {
            const x = Utils.random(0, mapWidth);
            const y = Utils.random(0, mapHeight);
            const size = Utils.random(
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE,
                GAME_CONSTANTS.PLAYER_INITIAL_SIZE * difficultySettings.NPC_MAX_SIZE_MULTIPLIER * 0.2
            );
            npcs.push(new NPC(x, y, size, 'TIMID', names[nameIndex++]));
        }
        
        return npcs;
    }
    
    /**
     * Generate NPC names
     */
    static generateNPCNames(count) {
        const names = [];
        const prefixes = ['Cool', 'Super', 'Ninja', 'Mega', 'Ultra', 'Pro', 'Epic', 'King', 'Queen', 'Master'];
        const suffixes = ['Snake', 'Slither', 'Viper', 'Python', 'Cobra', 'Mamba', 'Serpent', 'Boa', 'Dragon', 'Worm'];
        
        // Generate random names
        for (let i = 0; i < count; i++) {
            if (Math.random() < 0.7) {
                // Use prefix + suffix format
                const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
                names.push(`${prefix}${suffix}`);
            } else {
                // Use simple numbered format
                names.push(`Snake${i + 1}`);
            }
        }
        
        return names;
    }
}