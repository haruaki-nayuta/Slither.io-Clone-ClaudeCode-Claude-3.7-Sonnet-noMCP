/**
 * Utility functions
 */
class Utils {
    /**
     * Calculate the distance between two points
     */
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    /**
     * Calculate the angle between two points
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * Get a random number between min and max
     */
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Get a random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get a random item from an array
     */
    static randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Get a random color
     */
    static randomColor() {
        return `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    
    /**
     * Check if a point is inside the viewport with padding
     */
    static isInViewport(x, y, viewport, padding = 0) {
        return (
            x >= viewport.x - padding &&
            x <= viewport.x + viewport.width + padding &&
            y >= viewport.y - padding &&
            y <= viewport.y + viewport.height + padding
        );
    }
    
    /**
     * Clamp a value between min and max
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    /**
     * Map a value from one range to another
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }
    
    /**
     * Check if two circles are overlapping (for collision detection)
     */
    static circlesOverlap(x1, y1, r1, x2, y2, r2) {
        const distance = this.distance(x1, y1, x2, y2);
        return distance < r1 + r2;
    }
    
    /**
     * Get the position after wrapping around map edges
     */
    static wrapPosition(x, y, mapWidth, mapHeight) {
        let wrappedX = x;
        let wrappedY = y;
        
        if (x < 0) wrappedX = mapWidth + (x % mapWidth);
        else if (x >= mapWidth) wrappedX = x % mapWidth;
        
        if (y < 0) wrappedY = mapHeight + (y % mapHeight);
        else if (y >= mapHeight) wrappedY = y % mapHeight;
        
        return { x: wrappedX, y: wrappedY };
    }
    
    /**
     * Format time in mm:ss format
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Lerp (linear interpolation) between two values
     */
    static lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
    
    /**
     * Get shortest angle difference (for smooth rotation)
     */
    static angleDifference(a1, a2) {
        const diff = ((a2 - a1 + Math.PI) % (Math.PI * 2)) - Math.PI;
        return diff < -Math.PI ? diff + Math.PI * 2 : diff;
    }
    
    /**
     * Smoothly interpolate between two angles
     */
    static lerpAngle(a1, a2, t) {
        return a1 + this.angleDifference(a1, a2) * t;
    }
    
    /**
     * Get a weighted random item from a list based on weights
     */
    static weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
    
    /**
     * Get point on circle given center, radius and angle
     */
    static pointOnCircle(centerX, centerY, radius, angle) {
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }
}