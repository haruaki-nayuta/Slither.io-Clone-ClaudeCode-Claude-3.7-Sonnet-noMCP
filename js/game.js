/**
 * Main Game class that manages the game state
 */
class Game {
    constructor() {
        // Get canvas elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Resize canvas to fill window
        this.resizeCanvas();
        
        // Create game map
        this.map = new GameMap(GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT);
        
        // Game state
        this.isRunning = false;
        this.difficulty = 'NORMAL';
        this.entities = [];
        this.foods = [];
        this.player = null;
        this.npcs = [];
        this.viewport = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // Create quadtree for collision detection optimization
        this.quadtree = new Quadtree({
            x: 0,
            y: 0,
            width: GAME_CONSTANTS.MAP_WIDTH,
            height: GAME_CONSTANTS.MAP_HEIGHT
        });
        
        // Create UI manager
        this.ui = new UI(this);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Game loop variables
        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = 1000 / GAME_CONSTANTS.TARGET_FPS;
        
        // Initialize with start menu
        this.ui.showStartMenu();
    }
    
    /**
     * Setup event listeners for game controls
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Mouse movement for player direction
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.player && this.isRunning) {
                this.player.setMousePosition(e.clientX, e.clientY);
            }
        });
        
        // Mouse down/up for boost
        this.canvas.addEventListener('mousedown', () => {
            if (this.player && this.isRunning) {
                this.player.setBoost(true);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.player && this.isRunning) {
                this.player.setBoost(false);
            }
        });
        
        // Mouse leave canvas to stop boost
        this.canvas.addEventListener('mouseleave', () => {
            if (this.player && this.isRunning) {
                this.player.setBoost(false);
            }
        });
    }
    
    /**
     * Resize canvas to fill window
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Start a new game
     */
    startGame(difficulty = 'NORMAL') {
        // Set difficulty
        this.difficulty = difficulty;
        
        // Clear existing entities
        this.entities = [];
        this.foods = [];
        this.npcs = [];
        
        // Create player in the center of the map
        this.player = new Player(
            GAME_CONSTANTS.MAP_WIDTH / 2,
            GAME_CONSTANTS.MAP_HEIGHT / 2
        );
        
        // Add player to entities
        this.entities.push(this.player);
        
        // Create NPCs based on difficulty
        this.npcs = NPC.createNPCs(
            difficulty,
            GAME_CONSTANTS.MAP_WIDTH,
            GAME_CONSTANTS.MAP_HEIGHT
        );
        
        // Add NPCs to entities
        this.entities.push(...this.npcs);
        
        // Create initial food
        const difficultySettings = GAME_CONSTANTS.DIFFICULTY[difficulty];
        const initialFoodCount = Math.floor(GAME_CONSTANTS.MAX_FOOD_COUNT / difficultySettings.FOOD_SCARCITY);
        
        for (let i = 0; i < initialFoodCount; i++) {
            this.spawnFood();
        }
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Game loop
     */
    gameLoop(currentTime) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Fixed time step accumulator pattern
        this.accumulator += deltaTime;
        
        // Update with fixed time step
        while (this.accumulator >= this.timeStep) {
            this.update(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        
        // Render
        this.render();
        
        // Continue loop if game is running
        if (this.isRunning) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    /**
     * Update game state
     */
    update(deltaTime) {
        // Skip update if game is not running
        if (!this.isRunning) return;
        
        // Clear quadtree
        this.quadtree.clear();
        
        // Update viewport to follow player
        this.updateViewport();
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Spawn new food
        this.spawnNewFood(deltaTime);
        
        // Update UI
        this.ui.update(deltaTime);
        
        // Check for game over
        if (this.player.isDead) {
            this.handleGameOver();
        }
    }
    
    /**
     * Update viewport to follow player
     */
    updateViewport() {
        if (this.player && !this.player.isDead) {
            // Center viewport on player
            this.viewport.x = this.player.x - this.viewport.width / 2;
            this.viewport.y = this.player.y - this.viewport.height / 2;
            
            // Clamp viewport to map bounds
            this.viewport.x = Math.max(0, Math.min(this.viewport.x, GAME_CONSTANTS.MAP_WIDTH - this.viewport.width));
            this.viewport.y = Math.max(0, Math.min(this.viewport.y, GAME_CONSTANTS.MAP_HEIGHT - this.viewport.height));
        }
    }
    
    /**
     * Update all game entities
     */
    updateEntities(deltaTime) {
        const entitiesToRemove = [];
        
        // Update and insert entities into quadtree
        for (const entity of this.entities) {
            // Skip inactive entities
            if (entity.isDead) {
                entitiesToRemove.push(entity);
                continue;
            }
            
            // Update entity based on type
            if (entity instanceof Player) {
                entity.update(deltaTime, this.viewport);
            } else if (entity instanceof NPC) {
                entity.update(deltaTime, this, this.player);
            } else if (entity instanceof Food) {
                entity.update(deltaTime);
            }
            
            // Insert into quadtree for collision detection
            this.quadtree.insert(entity);
        }
        
        // Remove dead entities
        for (const entity of entitiesToRemove) {
            this.removeEntity(entity);
        }
    }
    
    /**
     * Check for collisions between entities
     */
    checkCollisions() {
        // Process collisions for player
        if (this.player && !this.player.isDead) {
            this.processEntityCollisions(this.player);
        }
        
        // Process collisions for NPCs
        for (const npc of this.npcs) {
            if (!npc.isDead) {
                this.processEntityCollisions(npc);
            }
        }
    }
    
    /**
     * Process collisions for a specific entity
     */
    processEntityCollisions(entity) {
        // Get entities in the vicinity for collision checking
        const nearbyEntities = this.getEntitiesInRadius(
            entity.x, entity.y, entity.radius * 2
        );
        
        for (const other of nearbyEntities) {
            // Skip self
            if (entity === other) continue;
            
            // Process based on entity types
            if (entity instanceof Snake && other instanceof Food) {
                // Snake eating food
                if (entity.collidesWith(other)) {
                    entity.eat(other);
                    this.removeEntity(other);
                }
            } else if (entity instanceof Snake && other instanceof Snake) {
                // Snake collision with another snake
                if (entity.collidesWithSnake(other)) {
                    // Player killed an NPC
                    if (entity === this.player && !entity.isDead) {
                        entity.registerKill();
                        this.ui.showMessage(`+${Math.floor(other.size)} points!`);
                    }
                    
                    // Handle snake death and spawn food
                    const foods = other.die();
                    for (const food of foods) {
                        this.addEntity(food);
                    }
                }
            }
        }
    }
    
    /**
     * Get entities within a radius (using quadtree)
     */
    getEntitiesInRadius(x, y, radius) {
        return this.quadtree.queryRadius(x, y, radius);
    }
    
    /**
     * Spawn new food periodically
     */
    spawnNewFood(deltaTime) {
        // Count current food
        let foodCount = 0;
        for (const entity of this.entities) {
            if (entity instanceof Food) {
                foodCount++;
            }
        }
        
        // Calculate food scarcity based on difficulty
        const difficultySettings = GAME_CONSTANTS.DIFFICULTY[this.difficulty];
        const maxFood = Math.floor(GAME_CONSTANTS.MAX_FOOD_COUNT / difficultySettings.FOOD_SCARCITY);
        
        // Calculate spawn probability based on current food count
        const spawnProbability = (maxFood - foodCount) / maxFood;
        
        // Random chance to spawn food
        if (Math.random() < spawnProbability * 0.1) {
            this.spawnFood();
        }
    }
    
    /**
     * Spawn a single food at a random position
     */
    spawnFood() {
        const x = Utils.random(0, GAME_CONSTANTS.MAP_WIDTH);
        const y = Utils.random(0, GAME_CONSTANTS.MAP_HEIGHT);
        const food = new Food(x, y);
        this.addEntity(food);
        return food;
    }
    
    /**
     * Add entity to the game
     */
    addEntity(entity) {
        this.entities.push(entity);
        
        // Also add to specific type array
        if (entity instanceof Food) {
            this.foods.push(entity);
        } else if (entity instanceof NPC) {
            this.npcs.push(entity);
        }
    }
    
    /**
     * Remove entity from the game
     */
    removeEntity(entity) {
        // Remove from entities array
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        
        // Also remove from specific type array
        if (entity instanceof Food) {
            const foodIndex = this.foods.indexOf(entity);
            if (foodIndex !== -1) {
                this.foods.splice(foodIndex, 1);
            }
        } else if (entity instanceof NPC) {
            const npcIndex = this.npcs.indexOf(entity);
            if (npcIndex !== -1) {
                this.npcs.splice(npcIndex, 1);
            }
        }
    }
    
    /**
     * Handle game over
     */
    handleGameOver() {
        if (this.isRunning) {
            this.ui.showGameOver();
        }
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map background
        this.map.render(this.ctx, this.viewport);
        
        // Get visible entities to render
        const visibleEntities = this.getVisibleEntities();
        
        // Sort entities by type and size for proper layering
        visibleEntities.sort((a, b) => {
            // Food always at the bottom layer
            if (a instanceof Food && !(b instanceof Food)) return -1;
            if (b instanceof Food && !(a instanceof Food)) return 1;
            
            // Snakes sorted by size (smaller on top of larger)
            if (a instanceof Snake && b instanceof Snake) {
                return b.size - a.size;
            }
            
            return 0;
        });
        
        // Render entities
        for (const entity of visibleEntities) {
            entity.render(this.ctx, this.viewport);
        }
        
        // Draw minimap
        this.map.renderMinimap(this.minimapCtx, this.entities, this.player);
        
        // Draw debug info if enabled
        if (false) { // Set to true for debugging
            this.drawDebugInfo();
        }
    }
    
    /**
     * Get entities that are currently visible
     */
    getVisibleEntities() {
        return this.entities.filter(entity => {
            // Always include player
            if (entity === this.player) return true;
            
            // Check if entity is within viewport (with padding)
            return Utils.isInViewport(
                entity.x,
                entity.y,
                this.viewport,
                entity instanceof Snake ? entity.radius * 4 : entity.radius
            );
        });
    }
    
    /**
     * Draw debug information
     */
    drawDebugInfo() {
        // Draw quadtree
        this.quadtree.draw(this.ctx, this.viewport);
        
        // Draw viewport borders
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.viewport.width, this.viewport.height);
        
        // Draw entity count
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Entities: ${this.entities.length}`, 10, 20);
        this.ctx.fillText(`NPCs: ${this.npcs.length}`, 10, 40);
        this.ctx.fillText(`Food: ${this.foods.length}`, 10, 60);
    }
}