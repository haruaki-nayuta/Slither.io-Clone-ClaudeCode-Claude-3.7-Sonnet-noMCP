/**
 * Game Constants
 */
const GAME_CONSTANTS = {
    // Map dimensions
    MAP_WIDTH: 5000,
    MAP_HEIGHT: 5000,
    
    // Player settings
    PLAYER_INITIAL_SIZE: 10,
    PLAYER_INITIAL_SEGMENTS: 20,
    PLAYER_SPEED: 3,
    PLAYER_BOOST_SPEED: 5,
    PLAYER_BOOST_COST: 0.2,  // How much size is lost per frame when boosting
    PLAYER_TURN_SPEED: 0.15,  // How quickly the player can change direction
    
    // Food settings
    FOOD_SIZE: 5,
    FOOD_VALUE: 1,
    FOOD_SPAWN_RATE: 5,  // Number of food items to spawn per second
    FOOD_COLORS: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'],
    MAX_FOOD_COUNT: 1000,
    
    // NPC settings
    NPC_DECISION_INTERVAL: 500,  // ms between NPC decisions
    NPC_SIGHT_RANGE: 300,  // How far NPCs can "see"
    NPC_TURN_SPEED: 0.1,   // How quickly NPCs can change direction
    
    // NPC types and their probabilities for different states
    NPC_TYPES: {
        NORMAL: {
            COLOR: '#8BC34A',
            PATTERN: 'solid',
            EXPLORE_PROB: 0.7,
            ATTACK_PROB: 0.2,
            FLEE_PROB: 0.1
        },
        AGGRESSIVE: {
            COLOR: '#F44336',
            PATTERN: 'striped',
            EXPLORE_PROB: 0.3,
            ATTACK_PROB: 0.6,
            FLEE_PROB: 0.1
        },
        TIMID: {
            COLOR: '#2196F3',
            PATTERN: 'dotted',
            EXPLORE_PROB: 0.8,
            ATTACK_PROB: 0.05,
            FLEE_PROB: 0.15
        }
    },
    
    // Difficulty settings
    DIFFICULTY: {
        EASY: {
            MAX_NPC_COUNT: 20,
            AGGRESSIVE_RATIO: 0.1,
            NORMAL_RATIO: 0.5,
            TIMID_RATIO: 0.4,
            NPC_REACTION_SPEED: 0.7,
            NPC_MAX_SIZE_MULTIPLIER: 5,
            FOOD_SCARCITY: 1
        },
        NORMAL: {
            MAX_NPC_COUNT: 40,
            AGGRESSIVE_RATIO: 0.33,
            NORMAL_RATIO: 0.34,
            TIMID_RATIO: 0.33,
            NPC_REACTION_SPEED: 1.0,
            NPC_MAX_SIZE_MULTIPLIER: 10,
            FOOD_SCARCITY: 1.5
        },
        HARD: {
            MAX_NPC_COUNT: 60,
            AGGRESSIVE_RATIO: 0.4,
            NORMAL_RATIO: 0.4,
            TIMID_RATIO: 0.2,
            NPC_REACTION_SPEED: 1.2,
            NPC_MAX_SIZE_MULTIPLIER: 15,
            FOOD_SCARCITY: 2
        }
    },
    
    // Game physics
    COLLISION_DISTANCE: 10,
    SEGMENT_SPACING: 5,
    
    // Visual settings
    BACKGROUND_COLOR: '#0A0A2A',
    GRID_COLOR: '#1A1A3A',
    GRID_SPACING: 50,
    
    // Performance settings
    TARGET_FPS: 60,
    VISIBLE_AREA_PADDING: 100  // Extra area around the viewport to keep active
};