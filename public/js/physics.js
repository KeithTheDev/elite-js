// physics.js - Collision detection and physics

import { playCollisionSound } from './audio.js';
import { damageShip } from './combat.js';
import { CONSTANTS } from './config.js';
import { getShips } from './ship.js';

// Check collisions between ships and station
export function checkCollisions(playerShip, station) {
    if (!playerShip || !station) return;
    
    // Player-station collision
    checkPlayerStationCollision(playerShip, station);
    
    // Player-ship collisions
    checkPlayerShipCollisions(playerShip);
}

// Check collision between player and station
function checkPlayerStationCollision(playerShip, station) {
    const stationDistance = playerShip.position.distanceTo(station.position);
    
    // If close enough to station and moving slowly, allow docking
    if (stationDistance < 50 && playerShip.userData.speed < 5) {
        // Enable docking with C key handled elsewhere
    } 
    // Collision with station at high speed
    else if (stationDistance < 150 && playerShip.userData.speed > 5) {
        damageShip(playerShip, 50 + playerShip.userData.speed, false);
        playCollisionSound();
    }
}

// Check collisions between player and AI ships
function checkPlayerShipCollisions(playerShip) {
    const ships = getShips();
    
    ships.forEach(ship => {
        if (ship.userData.alive) {
            const distance = playerShip.position.distanceTo(ship.position);
            
            if (distance < CONSTANTS.COLLISION_THRESHOLD) {
                // Collision damage proportional to relative speed
                const relativeSpeed = playerShip.userData.speed + ship.userData.speed;
                damageShip(playerShip, relativeSpeed * 5, false);
                damageShip(ship, relativeSpeed * 5, false);
                playCollisionSound();
                
                // Push ships apart
                pushShipsApart(playerShip, ship);
            }
        }
    });
}

// Push two ships apart after collision
function pushShipsApart(ship1, ship2) {
    const pushDirection = new THREE.Vector3().subVectors(
        ship1.position, ship2.position
    ).normalize();
    
    ship1.position.add(pushDirection.clone().multiplyScalar(10));
    ship2.position.add(pushDirection.clone().multiplyScalar(-10));
}

// Calculate distance between two objects
export function getDistance(obj1, obj2) {
    return obj1.position.distanceTo(obj2.position);
}

// Check if object is in front of ship
export function isInFrontOfShip(ship, object) {
    // Get forward vector
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
    
    // Get vector to object
    const toObject = new THREE.Vector3().subVectors(object.position, ship.position).normalize();
    
    // Calculate dot product (positive if in front)
    const dotProduct = forward.dot(toObject);
    
    return dotProduct > 0;
}

// Check if player is close enough to dock with station
export function canDock(playerShip, station) {
    const distance = getDistance(playerShip, station);
    const speed = playerShip.userData.speed;
    
    return distance < 50 && speed < 5;
}