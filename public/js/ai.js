// ai.js - AI ship behavior

import { fireLaser } from './combat.js';
import { CONSTANTS } from './config.js';
import { gameState } from './gameState.js';

// Update AI ship behavior
export function updateShipAI(ship, playerShip, deltaTime) {
    if (!ship.userData.alive) return;

    // Regenerate energy over time
    ship.userData.energy = Math.min(
        ship.userData.energy + 0.5 * deltaTime, 
        ship.userData.maxEnergy
    );

    // Calculate distance to player
    const distanceToPlayer = ship.position.distanceTo(playerShip.position);
    
    // State machine for AI behavior
    switch (ship.userData.aiState) {
        case 'idle':
            updateIdleState(ship, playerShip, distanceToPlayer, deltaTime);
            break;
            
        case 'attacking':
            updateAttackingState(ship, playerShip, distanceToPlayer, deltaTime);
            break;
            
        case 'fleeing':
            updateFleeingState(ship, playerShip, distanceToPlayer, deltaTime);
            break;
    }
    
    // Make sure ships don't go too far from the player
    if (distanceToPlayer > CONSTANTS.SHIP_RESPAWN_DISTANCE * 2) {
        respawnShipNearPlayer(ship, playerShip);
    }
}

// Update idle state behavior
function updateIdleState(ship, playerShip, distanceToPlayer, deltaTime) {
    // Random movement in idle state
    ship.userData.rollRate = (Math.random() - 0.5) * Math.PI / 4;
    ship.userData.pitchRate = (Math.random() - 0.5) * Math.PI / 4;
    
    // Random speed changes
    if (Math.random() < 0.01) {
        ship.userData.speed = Math.random() * ship.userData.maxSpeed * 0.5;
    }
    
    // Chance to attack based on distance and random factor
    if (distanceToPlayer < 500 && Math.random() < 0.005 && !gameState.get('docked')) {
        ship.userData.aiState = 'attacking';
        ship.userData.target = playerShip;
        // console.log(`${ship.userData.type} is now attacking the player!`);
    }
}

// Update attacking state behavior
function updateAttackingState(ship, playerShip, distanceToPlayer, deltaTime) {
    if (!ship.userData.target || !ship.userData.target.userData.alive || gameState.get('docked')) {
        ship.userData.aiState = 'idle';
        ship.userData.target = null;
        return;
    }
    
    const target = ship.userData.target;
    
    // Calculate direction to target
    const targetPos = target.position.clone();
    const directionToTarget = new THREE.Vector3().subVectors(targetPos, ship.position).normalize();
    
    // Calculate the current forward direction
    const currentDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
    
    // Calculate angle between current direction and target direction
    const angle = currentDirection.angleTo(directionToTarget);
    
    // If target is behind, perform evasive maneuvers
    if (angle > Math.PI * 0.7) {
        ship.userData.rollRate = Math.PI * (Math.random() > 0.5 ? 1 : -1);
        ship.userData.pitchRate = Math.PI * 0.5 * (Math.random() - 0.5);
        ship.userData.speed = Math.max(ship.userData.speed - 2 * deltaTime, ship.userData.maxSpeed * 0.3);
    } else {
        // Gradually orient towards target using SLERP-like behavior
        ship.userData.rollRate = (Math.random() - 0.5) * Math.PI * 0.2;
        
        // Pitch up or down based on target position
        const localTarget = directionToTarget.clone().applyQuaternion(ship.quaternion.clone().invert());
        ship.userData.pitchRate = localTarget.y * Math.PI;
        
        // Adjust speed based on distance
        if (distanceToPlayer > 200) {
            ship.userData.speed = Math.min(ship.userData.speed + 2 * deltaTime, ship.userData.maxSpeed);
        } else {
            // Maintain distance
            ship.userData.speed = Math.max(ship.userData.speed - deltaTime, ship.userData.maxSpeed * 0.5);
        }
        
        // Fire lasers if in range and facing target
        if (distanceToPlayer < 300 && angle < Math.PI * 0.2 && Math.random() < 0.05) {
            fireLaser(ship, playerShip);
        }
    }
    
    // Small chance to give up pursuit
    if (Math.random() < 0.001 || distanceToPlayer > 1000) {
        ship.userData.aiState = 'idle';
        ship.userData.target = null;
    }
    
    // Check energy levels - flee if low
    if (ship.userData.energy < ship.userData.maxEnergy * 0.2) {
        ship.userData.aiState = 'fleeing';
    }
}

// Update fleeing state behavior
function updateFleeingState(ship, playerShip, distanceToPlayer, deltaTime) {
    // Run away from player
    const fleeDirection = new THREE.Vector3().subVectors(ship.position, playerShip.position).normalize();
    ship.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), fleeDirection);
    ship.userData.speed = Math.min(ship.userData.speed + 5 * deltaTime, ship.userData.maxSpeed);
    
    // Return to idle if safe or energy recovered
    if (distanceToPlayer > 800 || ship.userData.energy > ship.userData.maxEnergy * 0.6 || Math.random() < 0.01) {
        ship.userData.aiState = 'idle';
    }
}

// Respawn a ship near the player
function respawnShipNearPlayer(ship, playerShip) {
    const randomDirection = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
    ).normalize();
    
    ship.position.copy(playerShip.position.clone().add(
        randomDirection.multiplyScalar(CONSTANTS.SHIP_RESPAWN_DISTANCE + Math.random() * 500)
    ));
    
    // Reset AI state
    ship.userData.aiState = 'idle';
    ship.userData.target = null;
}