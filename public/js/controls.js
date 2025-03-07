// controls.js - Input handling and controls

import { controls as keyMap } from './config.js';

// Ensure THREE is available
const THREE = window.THREE;

// Set of currently pressed keys
const pressedKeys = new Set();

// Initialize keyboard controls
export function initControls() {
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Focus the game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.addEventListener('click', () => {
            gameContainer.focus();
        });
        gameContainer.focus();
    }
    
    // Log the key mapping for debugging
    console.log("Controls initialized with keymap:", keyMap);
    
    // Specifically log the view key mappings
    console.warn("View key mappings:", {
        front: keyMap.viewFront,
        back: keyMap.viewBack,
        left: keyMap.viewLeft,
        right: keyMap.viewRight
    });
    
    // Create global test function to check key state
    window.testKey = (key) => {
        console.log(`Key "${key}" pressed:`, pressedKeys.has(key));
        console.log("All pressed keys:", Array.from(pressedKeys));
    };
}

// Handle key down event
function handleKeyDown(event) {
    // Handle function keys (F1-F9)
    if (event.key.startsWith('F')) {
        const functionNum = event.key.toLowerCase().replace('f', '');
        pressedKeys.add(functionNum);
        console.log(`Function key pressed: ${event.key} -> ${functionNum}`);
        event.preventDefault();
        return;
    }
    
    const key = event.key.toLowerCase();
    pressedKeys.add(key);
    
    // Log numeric keys 1-4 (view keys)
    if (key >= '1' && key <= '4') {
        console.warn(`Numeric key pressed: ${key}`);
        
        // Check which control this maps to
        Object.entries(keyMap).forEach(([controlName, mappedKey]) => {
            if (mappedKey === key) {
                console.warn(`Key ${key} maps to control: ${controlName}`);
            }
        });
    }
    
    // Debug key presses
    // console.log("Key pressed:", key);
}

// Handle key up event
function handleKeyUp(event) {
    // Handle function keys (F1-F9)
    if (event.key.startsWith('F')) {
        const functionNum = event.key.toLowerCase().replace('f', '');
        pressedKeys.delete(functionNum);
        event.preventDefault();
        return;
    }
    
    const key = event.key.toLowerCase();
    pressedKeys.delete(key);
}

// Check if a key is pressed
export function isKeyPressed(controlName) {
    const key = keyMap[controlName];
    const isPressed = pressedKeys.has(key);
    
    // Add extra debugging for view keys
    if (controlName.startsWith('view') && Math.random() < 0.005) {
        console.log(`Checking view key: ${controlName}, mapped to: "${key}", pressed: ${isPressed}`);
        console.log(`All pressed keys:`, Array.from(pressedKeys));
    }
    
    return isPressed;
}

// Check if any of the given keys are pressed
export function anyKeyPressed(controlNames) {
    return controlNames.some(name => isKeyPressed(name));
}

// Get all currently pressed keys
export function getPressedKeys() {
    return pressedKeys;
}

// Apply flight controls to player ship

export function applyFlightControls(playerShip, deltaTime) {
    if (!playerShip) return;
    
    // Roll controls
    if (isKeyPressed('rollLeft')) {
        playerShip.userData.rollRate = -Math.PI / 2;
        // console.log("Rolling left:", playerShip.userData.rollRate);
    } else if (isKeyPressed('rollRight')) {
        playerShip.userData.rollRate = Math.PI / 2;
        // console.log("Rolling right:", playerShip.userData.rollRate);
    } else {
        const previousRollRate = playerShip.userData.rollRate;
        playerShip.userData.rollRate *= 0.95; // Dampen roll
        // console.log("Damping roll from", previousRollRate, "to", playerShip.userData.rollRate);
    }

    // Pitch controls
    if (isKeyPressed('pitchUp')) {
        playerShip.userData.pitchRate = -Math.PI / 2;
        // console.log("Pitching up:", playerShip.userData.pitchRate);
    } else if (isKeyPressed('pitchDown')) {
        playerShip.userData.pitchRate = Math.PI / 2;
        // console.log("Pitching down:", playerShip.userData.pitchRate);
    } else {
        const previousPitchRate = playerShip.userData.pitchRate;
        playerShip.userData.pitchRate *= 0.95; // Dampen pitch
        // console.log("Damping pitch from", previousPitchRate, "to", playerShip.userData.pitchRate);
    }

    // Speed controls
    if (isKeyPressed('speedUp')) {
        const previousSpeed = playerShip.userData.speed;
        playerShip.userData.speed = Math.min(
            playerShip.userData.speed + 10 * deltaTime, 
            playerShip.userData.maxSpeed
        );
        // console.log("Speeding up from", previousSpeed, "to", playerShip.userData.speed);
    } else if (isKeyPressed('speedDown')) {
        const previousSpeed = playerShip.userData.speed;
        playerShip.userData.speed = Math.max(
            playerShip.userData.speed - 10 * deltaTime, 
            0
        );
        // console.log("Slowing down from", previousSpeed, "to", playerShip.userData.speed);
    } else {
        const previousSpeed = playerShip.userData.speed;
        playerShip.userData.speed *= 0.98; // Inertial dampening
        // console.log("Applying inertial dampening: speed from", previousSpeed, "to", playerShip.userData.speed);
    }
}

// Clean up event listeners
export function cleanupControls() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}