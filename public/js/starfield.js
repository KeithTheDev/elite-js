// starfield.js - Star rendering and animation

import { CONSTANTS } from './config.js';
import { addToScene } from './rendering.js';

// Stars in the scene
let stars;

// Create starfield
export function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = CONSTANTS.STARFIELD_COUNT;
    const starPositions = new Float32Array(starCount * 3);
    
    // Generate random stars with uniform distribution in a spherical volume
    for (let i = 0; i < starCount * 3; i += 3) {
        // Use spherical coordinates for better star distribution
        // This creates a more realistic and evenly distributed starfield
        
        // Random radius (cube root for uniform volume distribution)
        const radius = CONSTANTS.STARFIELD_SIZE/2 * Math.cbrt(Math.random());
        
        // Random angles
        const theta = Math.random() * Math.PI * 2; // Horizontal angle
        const phi = Math.acos(2 * Math.random() - 1); // Vertical angle
        
        // Convert to Cartesian coordinates
        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    // Improved star material
    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 1.5,
        sizeAttenuation: true, // Stars closer to camera appear larger
        transparent: true,
        opacity: 0.8
    });
    
    stars = new THREE.Points(starGeometry, starMaterial);
    
    // Add stars to scene
    addToScene(stars);
    
    console.log(`Created starfield with ${starCount} stars in a sphere of radius ${CONSTANTS.STARFIELD_SIZE/2}`);
    
    return stars;
}

// Update starfield based on player movement
export function updateStarfield(playerShip) {
    if (!stars || !playerShip) return;
    
    // Use the corrected forward vector we established
    const playerDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(playerShip.quaternion);
    const playerVelocity = playerDirection.clone().multiplyScalar(playerShip.userData.speed);
    
    // Update star positions
    const positions = stars.geometry.attributes.position.array;
    const maxDistance = CONSTANTS.STARFIELD_SIZE / 2;
    const minDistance = CONSTANTS.STARFIELD_SIZE / 4; // Maintain a minimum distance from player
    
    // Get player position
    const playerPos = playerShip.position.clone();
    
    for (let i = 0; i < positions.length; i += 3) {
        // Move stars in the opposite direction of player movement
        // Parallax effect - stars further away move less
        const starX = positions[i];
        const starY = positions[i + 1];
        const starZ = positions[i + 2];
        
        // Calculate distance from star to player
        const dx = starX - playerPos.x;
        const dy = starY - playerPos.y;
        const dz = starZ - playerPos.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Parallax factor - distant stars move less
        const parallaxFactor = 0.05 * (1 - Math.min(1, distance / maxDistance * 0.5));
        
        // Apply parallax movement
        positions[i] -= playerVelocity.x * parallaxFactor;
        positions[i + 1] -= playerVelocity.y * parallaxFactor;
        positions[i + 2] -= playerVelocity.z * parallaxFactor;
        
        // Check if star is too far from player and needs to be reset
        const newDx = positions[i] - playerPos.x;
        const newDy = positions[i + 1] - playerPos.y;
        const newDz = positions[i + 2] - playerPos.z;
        const newDistance = Math.sqrt(newDx*newDx + newDy*newDy + newDz*newDz);
        
        if (newDistance > maxDistance) {
            // Create a new star in a random position opposite to player's direction
            // This maintains the illusion of infinite space
            
            // Create a random direction opposite(ish) to player movement
            const oppositeDir = playerDirection.clone().multiplyScalar(-1);
            
            // Randomize the opposite direction a bit
            oppositeDir.x += (Math.random() - 0.5) * 0.5;
            oppositeDir.y += (Math.random() - 0.5) * 0.5;
            oppositeDir.z += (Math.random() - 0.5) * 0.5;
            oppositeDir.normalize();
            
            // Random distance from minimum to maximum
            const newRadius = minDistance + Math.random() * (maxDistance - minDistance);
            
            // Calculate new position based on player position + opposite direction * distance
            positions[i] = playerPos.x + oppositeDir.x * newRadius;
            positions[i + 1] = playerPos.y + oppositeDir.y * newRadius;
            positions[i + 2] = playerPos.z + oppositeDir.z * newRadius;
        }
    }
    
    // Always update the geometry to ensure visual changes
    stars.geometry.attributes.position.needsUpdate = true;
}

// Get stars object
export function getStars() {
    return stars;
}