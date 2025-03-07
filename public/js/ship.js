// ship.js - Ship creation and management

import { addToScene, createLineModel, removeFromScene } from './rendering.js';

// Ensure THREE is available
const THREE = window.THREE;

// Collection of ships in the game
const ships = [];

// Create a ship from blueprint
export function createShip(type) {
    if (!window.shipBlueprints || !window.shipBlueprints[type]) {
        console.error(`Ship blueprint not found for type: ${type}`);
        return null;
    }

    const blueprint = window.shipBlueprints[type];
    const model = createLineModel(blueprint.vertices, blueprint.edges);
    
    // Create ship container
    const ship = new THREE.Group();
    ship.add(model);
    
    // Add ship properties from blueprint
    ship.userData = {
        type,
        speed: 0,
        maxSpeed: blueprint.maxSpeed,
        energy: blueprint.energy,
        maxEnergy: blueprint.energy,
        laserPower: blueprint.laserPower,
        missiles: blueprint.missiles,
        bounty: blueprint.bounty,
        rollRate: 0,
        pitchRate: 0,
        alive: true,
        aiState: 'idle',
        target: null,
        lastShotTime: 0,
        visibilityDistance: blueprint.visibilityDistance || 30,
        explosionCount: blueprint.explosionCount || 30
    };
    
    return ship;
}

// Create the player's ship
export function createPlayerShip(type = "Cobra Mk III (Trader)") {
    const playerShip = createShip(type);
    if (!playerShip) return null;
    
    // Set up the ship's initial orientation
    // We've changed the forward direction to be +Z, so no rotation is needed now
    playerShip.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
    playerShip.updateMatrix();
    playerShip.updateMatrixWorld(true);
    
    // Make player ship invisible since we're in first-person view
    // Hide all children (the actual model meshes)
    playerShip.traverse(child => {
        if (child !== playerShip) { // Don't disable the root object
            child.visible = false;
        }
    });

    // Add to scene (even though invisible, we need it for position/orientation reference)
    addToScene(playerShip);
    
    console.warn("Created player ship with orientation: 0, 0, 0 (invisible for first-person view)");
    
    return playerShip;
}

// Create a space station
export function createStation(type = "Coriolis", position = [0, 0, -500]) {
    const station = createShip(type);
    if (!station) return null;
    
    // Position the station
    station.position.set(...position);
    
    // Add to scene
    addToScene(station);
    
    return station;
}

// Add a ship to the ships collection
export function addShip(ship) {
    ships.push(ship);
    return ships.length - 1; // Return index
}

// Remove a ship from the collection and scene
export function removeShip(ship) {
    const index = ships.indexOf(ship);
    if (index !== -1) {
        ships.splice(index, 1);
    }
    removeFromScene(ship);
}

// Spawn a number of random AI ships
export function spawnRandomShips(count, playerShip, excludeTypes = ["Cobra Mk III (Trader)", "Coriolis", "Missile", "Escape Pod", "Cargo Canister"]) {
    const spawnedShips = [];
    
    // Get available ship types
    const shipTypes = Object.keys(window.shipBlueprints).filter(type => 
        !excludeTypes.includes(type)
    );
    
    if (shipTypes.length === 0) {
        console.error("No valid ship types available for spawning");
        return [];
    }
    
    for (let i = 0; i < count; i++) {
        // Choose random ship type
        const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
        const ship = createShip(type);
        
        if (ship) {
            // Position relative to player if available
            if (playerShip) {
                const randomDirection = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize();
                
                ship.position.copy(playerShip.position.clone().add(
                    randomDirection.multiplyScalar(500 + Math.random() * 500)
                ));
            } else {
                // Otherwise random position
                ship.position.set(
                    (Math.random() - 0.5) * 1000,
                    (Math.random() - 0.5) * 1000,
                    (Math.random() - 0.5) * 1000
                );
            }
            
            // Random rotation
            ship.quaternion.setFromEuler(new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ));
            
            // Add to scene and collection
            addToScene(ship);
            addShip(ship);
            spawnedShips.push(ship);
        }
    }
    
    return spawnedShips;
}

// Update ship position based on velocity and rotation
export function updateShipPosition(ship, deltaTime) {
    if (!ship) return;
    
    // COMPLETELY DIFFERENT APPROACH: Use quaternion-based rotation
    
    // First, update the ship's quaternion for proper rotation
    // Create quaternions representing the pitch and roll rotations
    const pitchQuaternion = new THREE.Quaternion();
    const rollQuaternion = new THREE.Quaternion();
    
    // Set up local axes for rotation
    // X is right, Y is up, Z is forward in THREE.js
    const localRight = new THREE.Vector3(1, 0, 0);
    const localForward = new THREE.Vector3(0, 0, 1);
    
    // Transform these axes to account for the ship's current orientation
    localRight.applyQuaternion(ship.quaternion);
    localForward.applyQuaternion(ship.quaternion);
    
    // Set pitch quaternion - rotation around X axis (right vector)
    pitchQuaternion.setFromAxisAngle(localRight, ship.userData.pitchRate * deltaTime);
    
    // Set roll quaternion - rotation around Z axis (forward vector)
    rollQuaternion.setFromAxisAngle(localForward, ship.userData.rollRate * deltaTime);
    
    // Apply rotations to the ship's quaternion
    // Order matters here - we apply pitch first, then roll
    ship.quaternion.premultiply(pitchQuaternion);
    ship.quaternion.premultiply(rollQuaternion);
    
    // Normalize quaternion to prevent drift/precision errors
    ship.quaternion.normalize();
    
    // Apply inertial dampening to rotation rates
    ship.userData.rollRate *= 0.95;
    ship.userData.pitchRate *= 0.95;
    
    // Calculate movement direction based on ship's current orientation
    // In THREE.js, negative Z is "forward" in local space, which we transform to world space
    
    // IMPORTANT DEBUG: Force forward to be +Z instead of -Z
    const forwardVector = new THREE.Vector3(0, 0, 1); // CHANGED! Using +Z instead of -Z
    
    // Transform this local direction to world space based on the ship's orientation
    forwardVector.applyQuaternion(ship.quaternion);
    
    // Always normalize to ensure consistent speed regardless of orientation
    forwardVector.normalize();
    
    // Debug logging to understand direction
    if (Math.random() < 0.01) {
        console.warn("FORWARD VECTOR:", forwardVector.toArray().map(v => v.toFixed(2)).join(", "));
    }
    
    // Calculate movement - positive speed means moving forward
    const movement = forwardVector.multiplyScalar(ship.userData.speed * deltaTime);
    
    // Add this movement to the ship's position
    ship.position.add(movement);
    
    // Debug output to verify movement
    if (Math.random() < 0.01) { // Only log occasionally
        console.log(`Ship ${ship.userData.type} - Position:`, 
            ship.position.x.toFixed(2), 
            ship.position.y.toFixed(2), 
            ship.position.z.toFixed(2),
            "Speed:", ship.userData.speed.toFixed(2),
            "Movement:", movement.length().toFixed(4)
        );
    }
    
    // Force matrix update to propagate position and rotation changes
    ship.matrixAutoUpdate = true;
    ship.updateMatrix();
    ship.updateMatrixWorld(true);
    
    // Iterate through all children and ensure their matrices are updated too
    ship.traverse(child => {
        child.matrixAutoUpdate = true;
        child.updateMatrix();
        child.updateMatrixWorld(true);
    });
}

// Get all ships
export function getShips() {
    return ships;
}