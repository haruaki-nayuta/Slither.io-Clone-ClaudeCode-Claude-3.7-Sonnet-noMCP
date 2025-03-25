/**
 * Quadtree implementation for spatial partitioning
 * This helps optimize collision detection by reducing the number of checks needed
 */
class Quadtree {
    constructor(boundary, capacity = 4, level = 0, maxLevel = 5) {
        this.boundary = boundary; // { x, y, width, height }
        this.capacity = capacity; // Max objects before splitting
        this.entities = [];       // Objects in this quadtree node
        this.divided = false;     // Whether this node has been split
        this.level = level;       // Current depth level
        this.maxLevel = maxLevel; // Maximum depth level
        
        // Child nodes
        this.northwest = null;
        this.northeast = null;
        this.southwest = null;
        this.southeast = null;
    }
    
    /**
     * Clear the quadtree
     */
    clear() {
        this.entities = [];
        
        if (this.divided) {
            this.northwest.clear();
            this.northeast.clear();
            this.southwest.clear();
            this.southeast.clear();
            
            this.divided = false;
            this.northwest = null;
            this.northeast = null;
            this.southwest = null;
            this.southeast = null;
        }
    }
    
    /**
     * Split the quadtree into four child nodes
     */
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const width = this.boundary.width;
        const height = this.boundary.height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const nextLevel = this.level + 1;
        
        // Create boundaries for child nodes
        const nwBoundary = { x, y, width: halfWidth, height: halfHeight };
        const neBoundary = { x: x + halfWidth, y, width: halfWidth, height: halfHeight };
        const swBoundary = { x, y: y + halfHeight, width: halfWidth, height: halfHeight };
        const seBoundary = { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight };
        
        // Create child nodes
        this.northwest = new Quadtree(nwBoundary, this.capacity, nextLevel, this.maxLevel);
        this.northeast = new Quadtree(neBoundary, this.capacity, nextLevel, this.maxLevel);
        this.southwest = new Quadtree(swBoundary, this.capacity, nextLevel, this.maxLevel);
        this.southeast = new Quadtree(seBoundary, this.capacity, nextLevel, this.maxLevel);
        
        this.divided = true;
        
        // Move existing entities to appropriate child nodes
        for (const entity of this.entities) {
            this.insertToChildren(entity);
        }
        
        this.entities = []; // Clear parent node's entities
    }
    
    /**
     * Check if an entity is within a boundary
     */
    contains(boundary, entity) {
        return (
            entity.x >= boundary.x &&
            entity.x < boundary.x + boundary.width &&
            entity.y >= boundary.y &&
            entity.y < boundary.y + boundary.height
        );
    }
    
    /**
     * Helper method to insert entity into children nodes
     */
    insertToChildren(entity) {
        if (this.contains(this.northwest.boundary, entity)) {
            this.northwest.insert(entity);
        } else if (this.contains(this.northeast.boundary, entity)) {
            this.northeast.insert(entity);
        } else if (this.contains(this.southwest.boundary, entity)) {
            this.southwest.insert(entity);
        } else if (this.contains(this.southeast.boundary, entity)) {
            this.southeast.insert(entity);
        }
    }
    
    /**
     * Insert an entity into the quadtree
     */
    insert(entity) {
        // If entity doesn't fit in this quadtree node, don't insert it
        if (!this.contains(this.boundary, entity)) {
            return false;
        }
        
        // If there's space and we're at max depth, add it here
        if (this.entities.length < this.capacity || this.level >= this.maxLevel) {
            this.entities.push(entity);
            return true;
        }
        
        // Otherwise, subdivide and add to children
        if (!this.divided) {
            this.subdivide();
        }
        
        return this.insertToChildren(entity);
    }
    
    /**
     * Find all entities in a query range
     */
    query(range, found = []) {
        // If range doesn't intersect this quadtree node, return empty array
        if (!this.intersects(this.boundary, range)) {
            return found;
        }
        
        // Check entities in this node
        for (const entity of this.entities) {
            if (this.contains(range, entity)) {
                found.push(entity);
            }
        }
        
        // If this node is divided, check children
        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }
        
        return found;
    }
    
    /**
     * Check if two rectangles intersect
     */
    intersects(rectA, rectB) {
        return !(
            rectA.x + rectA.width < rectB.x ||
            rectB.x + rectB.width < rectA.x ||
            rectA.y + rectA.height < rectB.y ||
            rectB.y + rectB.height < rectA.y
        );
    }
    
    /**
     * Find all entities within a given radius of a point
     */
    queryRadius(x, y, radius, found = []) {
        // Create a square range that contains the circle
        const range = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };
        
        // Get all entities in the square range
        const entitiesInRange = this.query(range);
        
        // Filter entities that are actually within the radius
        for (const entity of entitiesInRange) {
            const distance = Utils.distance(x, y, entity.x, entity.y);
            if (distance <= radius) {
                found.push(entity);
            }
        }
        
        return found;
    }
    
    /**
     * Draw the quadtree (for debugging)
     */
    draw(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.strokeRect(
            this.boundary.x,
            this.boundary.y,
            this.boundary.width,
            this.boundary.height
        );
        
        if (this.divided) {
            this.northwest.draw(ctx);
            this.northeast.draw(ctx);
            this.southwest.draw(ctx);
            this.southeast.draw(ctx);
        }
    }
}