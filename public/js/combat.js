// combat.js - Lasers, missiles, and combat logic

import { playSound } from './audio.js';
import { createExplosion } from './effects.js';
import { gameState } from './gameState.js';
import { addToScene, getCamera, getCurrentView, removeFromScene } from './rendering.js';
import { getShips } from './ship.js';

// Ensure THREE is available
const THREE = window.THREE;

// Lasers in the scene
const lasers = [];

// Missile targeting state
let missileTargeting = false;

// Fire a laser from a ship
export function fireLaser(ship, playerShip) {
    // Retrieve the camera once so it's available throughout the function
    const camera = getCamera();
    if (ship === playerShip && !camera) {
        console.error("Camera not available for player laser");
        return;
    }

    // Get laser power - handle both player and AI ships
    let laserPower = 0;
    if (ship === playerShip) {
        // Player laser power depends on the current view
        const currentView = getCurrentView();
        laserPower = gameState.get('laserPower')[currentView] || 0;
    } else {
        laserPower = ship.userData.laserPower;
    }
    
    // Check if can fire
    if (laserPower <= 0) return;
    if (ship === playerShip && gameState.get('energy') < 1) return;
    if (ship !== playerShip && ship.userData.energy < 1) return;
    
    // Create laser beam based on whether it's player or AI ship
    let laser;
    
    if (ship === playerShip) {
        // For player, create laser beams from the center of the screen
        // This is how the original Elite rendered player lasers
        const viewDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        
        // Create two parallel beams extending from screen center
        // Left beam
        const leftGeometry = new THREE.BufferGeometry();
        const leftStart = new THREE.Vector3(-4, -2, -10);
        leftStart.applyQuaternion(camera.quaternion).add(camera.position);
        const leftEnd = leftStart.clone().add(viewDirection.clone().multiplyScalar(1000));
        leftGeometry.setFromPoints([leftStart, leftEnd]);
        
        const leftMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        const leftLaser = new THREE.Line(leftGeometry, leftMaterial);
        leftLaser.userData = {
            lifetime: 0.1,
            shooter: ship,
            direction: viewDirection.clone()
        };
        addToScene(leftLaser);
        lasers.push(leftLaser);
        
        // Right beam
        const rightGeometry = new THREE.BufferGeometry();
        const rightStart = new THREE.Vector3(4, -2, -10);
        rightStart.applyQuaternion(camera.quaternion).add(camera.position);
        const rightEnd = rightStart.clone().add(viewDirection.clone().multiplyScalar(1000));
        rightGeometry.setFromPoints([rightStart, rightEnd]);
        
        const rightMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        const rightLaser = new THREE.Line(rightGeometry, rightMaterial);
        rightLaser.userData = {
            lifetime: 0.1,
            shooter: ship,
            direction: viewDirection.clone()
        };
        addToScene(rightLaser);
        lasers.push(rightLaser);
        
        // For hit detection, we'll use the view direction
        laser = rightLaser; // Use one of the lasers for hit detection
    } else {
        // For AI ships, create laser from the ship position
        const start = new THREE.Vector3().copy(ship.position);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
        const end = start.clone().add(direction.multiplyScalar(1000));
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        
        const material = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        laser = new THREE.Line(geometry, material);
        laser.userData = {
            lifetime: 0.1,
            shooter: ship,
            direction: direction.clone()
        };
        addToScene(laser);
        lasers.push(laser);
    }
    
    // Use energy
    if (ship === playerShip) {
        gameState.useEnergy(laserPower);
    } else {
        ship.userData.energy -= laserPower;
    }
    
    // Play sound - different pitch for player vs enemy
    const frequency = ship === playerShip ? 440 : 330;
    playSound(frequency, 100);

    // Hit detection section
    const allShips = getShips();
    const validTargets = allShips.filter(target => 
        target !== ship && target.userData.alive
    );
    
    if (ship !== playerShip && playerShip.userData.alive) {
        validTargets.push(playerShip);
    }
    
    // Use the correct direction for hit detection
    const hitDirection = ship === playerShip 
        ? new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        : laser.userData.direction;

    validTargets.forEach(target => {
        const targetPos = target.position.clone();
        const distance = ship.position.distanceTo(targetPos);
        
        if (distance > 1000) return;
        
        const shipToTarget = targetPos.clone().sub(ship.position);
        const projectionLength = shipToTarget.dot(hitDirection);
        
        if (projectionLength < 0) return;
        
        const closestPoint = ship.position.clone().add(
            hitDirection.clone().multiplyScalar(projectionLength)
        );
        const missDistance = closestPoint.distanceTo(targetPos);
        
        if (missDistance < 30) {
            const damage = laserPower * 10 * (1 - missDistance / 30);
            damageShip(target, damage, ship === playerShip);
            
            const hitEffect = new THREE.Mesh(
                new THREE.SphereGeometry(2),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            hitEffect.position.copy(closestPoint);
            addToScene(hitEffect);
            setTimeout(() => removeFromScene(hitEffect), 100);
        }
    });
}

// Damage a ship
export function damageShip(ship, amount, isFromPlayer = false) {
    if (ship === gameState.playerShip) {
        // For player, damage shields first, then energy
        const shields = gameState.get('shields');
        const shieldDamage = Math.min(shields.fore + shields.aft, amount);
        amount -= shieldDamage;
        
        // Distribute shield damage
        const foreDamage = Math.min(shields.fore, shieldDamage / 2);
        const aftDamage = Math.min(shields.aft, shieldDamage / 2 + Math.max(0, shieldDamage / 2 - shields.fore));
        
        gameState.damageShields(foreDamage, aftDamage);
        
        // If damage remains, apply to energy
        if (amount > 0) {
            gameState.useEnergy(amount);
            if (gameState.get('energy') <= 0) {
                gameState.set('condition', 'DEAD');
                playSound(50, 2000);
                
                // Respawn after a delay
                setTimeout(() => {
                    gameState.set('energy', 255);
                    gameState.set('shields', { fore: 255, aft: 255 });
                    gameState.playerShip.position.set(0, 0, 0);
                    gameState.set('condition', 'GREEN');
                }, 3000);
            }
        }
    } else {
        // For AI ships, damage energy directly
        ship.userData.energy -= amount;
        if (ship.userData.energy <= 0) {
            ship.userData.alive = false;
            
            // Create explosion effect
            createExplosion(ship.position, ship.userData.explosionCount || 30);
            
            // Remove ship after a delay
            setTimeout(() => {
                removeFromScene(ship);
                const ships = getShips();
                const index = ships.indexOf(ship);
                if (index > -1) {
                    ships.splice(index, 1);
                    
                    // Add bounty if applicable and shot by player
                    if (isFromPlayer && ship.userData.bounty > 0) {
                        gameState.addCash(ship.userData.bounty);
                        
                        // Display bounty message
                        showBountyMessage(ship.userData.bounty);
                    }
                }
            }, 1000);
        }
    }
}

// Show bounty message
function showBountyMessage(amount) {
    const bountyMessage = document.createElement('div');
    bountyMessage.textContent = `Bounty: +${amount} CR`;
    bountyMessage.style.position = 'absolute';
    bountyMessage.style.top = '100px';
    bountyMessage.style.left = '50%';
    bountyMessage.style.transform = 'translateX(-50%)';
    bountyMessage.style.color = '#ff0';
    bountyMessage.style.fontFamily = 'monospace';
    document.getElementById('ui-overlay').appendChild(bountyMessage);
    
    // Remove message after a few seconds
    setTimeout(() => {
        bountyMessage.remove();
    }, 3000);
}

// Start missile targeting
export function startMissileTargeting() {
    if (gameState.get('missiles') > 0 && !missileTargeting) {
        missileTargeting = true;
        playSound(880, 200);
        return true;
    }
    return false;
}

// Fire missile
export function fireMissile() {
    if (missileTargeting) {
        gameState.fireMissile();
        missileTargeting = false;
        playSound(660, 300);
        return true;
    }
    return false;
}

// Cancel missile targeting
export function cancelMissileTargeting() {
    if (missileTargeting) {
        missileTargeting = false;
        return true;
    }
    return false;
}

// Check if missile is targeting
export function isMissileTargeting() {
    return missileTargeting;
}

// Update all lasers
export function updateLasers(deltaTime) {
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.userData.lifetime -= deltaTime;
        
        if (laser.userData.lifetime <= 0) {
            removeFromScene(laser);
            lasers.splice(i, 1);
        }
    }
}
