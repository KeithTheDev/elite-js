// main.js - Entry point, initializes everything

import { updateShipAI } from './ai.js';
import { initAudio } from './audio.js';
import { cancelMissileTargeting, fireLaser, fireMissile, startMissileTargeting, updateLasers } from './combat.js';
import { CONSTANTS } from './config.js';
import { applyFlightControls, initControls, isKeyPressed } from './controls.js';
import { createHyperspaceEffect } from './effects.js';
import { gameState } from './gameState.js';
import { canDock, checkCollisions } from './physics.js';
import { getCamera, getScene, initRenderer, render, setView, updateCameraPosition } from './rendering.js';
import { initScanner, updateScanner } from './scanner.js';
import { createPlayerShip, createStation, getShips, spawnRandomShips, updateShipPosition } from './ship.js';
import { createStarfield, updateStarfield } from './starfield.js';
import { hidePanels, initUI, showInventoryPanel, showMarketPanel, showNotification, showStatusPanel, updateUI } from './ui.js';



// Ensure THREE is available
const THREE = window.THREE;



// Animation loop
let animationId;
const clock = new THREE.Clock();

// Key state tracking for UI panels to avoid multiple toggles per keypress
let marketKeyWasPressed = false;
let inventoryKeyWasPressed = false;
let statusKeyWasPressed = false;
let viewFrontKeyWasPressed = false;
let viewBackKeyWasPressed = false;
let viewLeftKeyWasPressed = false;
let viewRightKeyWasPressed = false;

// Debug flag - set to true for console logs
const DEBUG = true;

// Initialize the game
export function initGame() {
    console.log("Initializing Elite JS game...");
    
    if (!window.THREE) {
        console.error("THREE.js is not loaded. Check your script imports.");
        return;
    }
    
    if (!window.shipBlueprints) {
        console.error("Error: shipBlueprints is not defined. Ensure blueprints.js is loaded.");
        return;
    }
    
    const { scene, camera, renderer } = initRenderer();
    if (!scene || !camera || !renderer) {
        console.error("Failed to initialize renderer components");
        return;
    }
    
    initControls();
    initAudio();
    initUI();
    initScanner();
    
    const playerShip = createPlayerShip();
    if (!playerShip) {
        console.error("Failed to create player ship");
        return;
    }
    
    const station = createStation();
    if (!station) {
        console.error("Failed to create station");
        return;
    }
    
    const stars = createStarfield();
    
    gameState.playerShip = playerShip;
    gameState.station = station;
    
    // Make gameState globally available for other modules
    window.gameState = gameState;
    
    // Initialize the camera with the correct orientation
    // Don't set camera position directly here, as it will be set by setView
    setView('front');
    
    // Force an immediate camera position update
    updateCameraPosition(playerShip);
    
    // Set initial docked state in the UI
    if (gameState.get('docked')) {
        document.getElementById('game-container').classList.add('docked');
    } else {
        document.getElementById('game-container').classList.remove('docked');
    }
    
    spawnRandomShips(CONSTANTS.SHIP_AI_SPAWN_COUNT, gameState.playerShip); // Update this too
    
    // Add direct key listeners for view keys (as a backup)
    window.addEventListener('keydown', (event) => {
        // Only handle number keys 1-4
        if (event.key >= '1' && event.key <= '4') {
            console.warn(`NUMBER KEY DIRECT HANDLER: ${event.key}`);
            
            switch(event.key) {
                case '1':
                    console.warn("Directly changing to FRONT view");
                    setView('front');
                    break;
                case '2':
                    console.warn("Directly changing to BACK view");
                    setView('back');
                    break;
                case '3':
                    console.warn("Directly changing to LEFT view");
                    setView('left');
                    break;
                case '4':
                    console.warn("Directly changing to RIGHT view");
                    setView('right');
                    break;
            }
        }
    });
    
    startGameLoop();
    
    // Add debug functions to window for console testing
    window.forceViewChange = (viewName) => {
        console.warn("Forcing view change to:", viewName);
        setView(viewName);
    };
    
    window.debugView = () => {
        console.log("Current view:", currentView);
        console.log("View key states:", {
            front: viewFrontKeyWasPressed,
            back: viewBackKeyWasPressed,
            left: viewLeftKeyWasPressed,
            right: viewRightKeyWasPressed
        });
    };
    
    window.buy = (goodIndex, amount) => import('./trade.js').then(m => m.buy(goodIndex, amount));
    window.sell = (goodIndex, amount) => import('./trade.js').then(m => m.sell(goodIndex, amount));
    window.buyFuel = (amount) => import('./trade.js').then(m => m.buyFuel(amount));
    window.setHyperspaceSystem = (index) => {
        gameState.setHyperspaceSystem(index);
        import('./ui.js').then(m => m.updateHyperspaceTarget(index));
    };
    
    if (DEBUG) {
        console.log("Player ship:", gameState.playerShip);
        console.log("Station:", gameState.station);
        console.log("Stars:", stars);
        console.log("Test cube added at position (100, 0, -100) for camera rotation debugging");
    }
    
    console.log("Game initialized successfully");
    showNotification("Welcome Commander! Press Space to accelerate, '/' to slow down.", "#0F0", 4000);
}
    


// Start the game loop
function startGameLoop() {
    animationId = requestAnimationFrame(gameLoop);
    clock.start();
    if (DEBUG) console.log("Game loop started");
}

// Main game loop
function gameLoop() {
    // Get elapsed time since last frame, cap it to prevent huge jumps
    const deltaTime = Math.min(clock.getDelta(), 0.1);
    
    if (deltaTime <= 0) {
        // Skip this frame if deltaTime is zero or negative
        // (can happen due to timing issues)
        animationId = requestAnimationFrame(gameLoop);
        return;
    }
    
    if (!gameState.get('docked')) {
        // Player is flying
        
        // First, apply flight controls to update ship's desired motion
        applyFlightControls(gameState.playerShip, deltaTime);
        
        // Apply the resulting motion to update ship's position
        updateShipPosition(gameState.playerShip, deltaTime);
        
        // Update all other ships
        updateAIShips(deltaTime);
        
        // Now update the camera to follow the ship's new position
        updateCameraPosition(gameState.playerShip);
        
        // Force the scene's matrices to update
        const scene = getScene();
        if (scene) {
            // CRITICAL: Update all object matrices before rendering
            scene.traverse(object => {
                if (object.type !== 'Scene') {
                    object.matrixAutoUpdate = true;
                    object.updateMatrix();
                    object.updateMatrixWorld(true);
                }
            });
            scene.updateMatrixWorld(true);
        }
        
        // Update the rest of the game state
        updateFlightMode(deltaTime);
    } else {
        // Player is docked
        updateDockedMode();
    }
    
    // Always update UI
    updateUI(gameState);
    
    // Render the scene (with current matrices)
    render();
    
    // Debug logging
    if (DEBUG && Math.random() < 0.01) {
        console.log("Game loop tick - deltaTime:", deltaTime.toFixed(4));
        if (gameState.playerShip) {
            console.log("Ship speed:", gameState.playerShip.userData.speed.toFixed(2));
        }
    }
    
    // Continue the loop
    animationId = requestAnimationFrame(gameLoop);
}


function updateFlightMode(deltaTime) {
    // NOTE: Some functions are now called directly in gameLoop
    // applyFlightControls(gameState.playerShip, deltaTime);
    // updateShipPosition(gameState.playerShip, deltaTime);
    // updateCameraPosition(gameState.playerShip);
    // updateAIShips(deltaTime);
    
    // Update starfield based on player movement
    updateStarfield(gameState.playerShip);
    
    // Check for collisions
    checkCollisions(gameState.playerShip, gameState.station);
    
    // Update scanner (radar)
    updateScanner(gameState.playerShip, gameState.station);
    
    // Handle combat actions
    handleCombat();
    
    // Update lasers
    updateLasers(deltaTime);
    
    // Handle hyperspace
    handleHyperspace();
    
    // Regenerate shields and energy
    gameState.regenShieldsAndEnergy(
        deltaTime, 
        CONSTANTS.SHIELD_REGEN_RATE, 
        CONSTANTS.ENERGY_REGEN_RATE
    );
    
    // AI ships are now updated in gameLoop
    // updateAIShips(deltaTime);
    
    // Handle docking
    handleDocking();
    
    // Rotate station
    if (gameState.station) {
        gameState.station.rotation.z += CONSTANTS.STATION_ROTATION_SPEED * deltaTime;
        // Force station matrix update
        gameState.station.matrixAutoUpdate = true;
        gameState.station.updateMatrix();
        gameState.station.updateMatrixWorld(true);
    }
    
    // Reset view key states when keys are released
    if (!isKeyPressed('viewFront')) viewFrontKeyWasPressed = false;
    if (!isKeyPressed('viewBack')) viewBackKeyWasPressed = false;
    if (!isKeyPressed('viewLeft')) viewLeftKeyWasPressed = false;
    if (!isKeyPressed('viewRight')) viewRightKeyWasPressed = false;
    
    // Handle view changes
    handleViewChanges();
}

// Update game state when docked
function updateDockedMode() {
    
    // Update the camera even when docked
    updateCameraPosition(gameState.playerShip);
    // Handle UI panels
    handleDockUI();
    
    // Launch ship
    if (isKeyPressed('launch')) {
        if (DEBUG) console.log("Launch key pressed");

        launchShip();
    }
    
    // Hide panels with escape key
    if (isKeyPressed('escape')) {
        hidePanels();
    }
    
    // Reset key states when keys are released
    if (!isKeyPressed('market')) marketKeyWasPressed = false;
    if (!isKeyPressed('inventory')) inventoryKeyWasPressed = false;
    if (!isKeyPressed('status')) statusKeyWasPressed = false;
    if (!isKeyPressed('viewFront')) viewFrontKeyWasPressed = false;
    if (!isKeyPressed('viewBack')) viewBackKeyWasPressed = false;
    if (!isKeyPressed('viewLeft')) viewLeftKeyWasPressed = false;
    if (!isKeyPressed('viewRight')) viewRightKeyWasPressed = false;
    
    // Handle view changes
    handleViewChanges();
}

// Handle view changes (front, back, left, right)
function handleViewChanges() {
    // Add diagnostic logging for all view keys for debugging
    if (DEBUG && Math.random() < 0.01) {
        console.log("View key states:", 
            "1:", isKeyPressed('viewFront'), "was:", viewFrontKeyWasPressed,
            "2:", isKeyPressed('viewBack'), "was:", viewBackKeyWasPressed,
            "3:", isKeyPressed('viewLeft'), "was:", viewLeftKeyWasPressed,
            "4:", isKeyPressed('viewRight'), "was:", viewRightKeyWasPressed
        );
    }

    if (isKeyPressed('viewFront') && !viewFrontKeyWasPressed) {
        viewFrontKeyWasPressed = true;
        console.warn("*** SWITCHING TO FRONT VIEW ***");
        setView('front');
    }
    
    if (isKeyPressed('viewBack') && !viewBackKeyWasPressed) {
        viewBackKeyWasPressed = true;
        console.warn("*** SWITCHING TO BACK VIEW ***");
        setView('back');
    }
    
    if (isKeyPressed('viewLeft') && !viewLeftKeyWasPressed) {
        viewLeftKeyWasPressed = true;
        console.warn("*** SWITCHING TO LEFT VIEW ***");
        setView('left');
    }
    
    if (isKeyPressed('viewRight') && !viewRightKeyWasPressed) {
        viewRightKeyWasPressed = true;
        console.warn("*** SWITCHING TO RIGHT VIEW ***");
        setView('right');
    }
}

// Handle combat inputs
function handleCombat() {
    // Fire laser
    if (isKeyPressed('fireLaser')) {
        if (DEBUG) console.log("Fire laser key pressed");
        const camera = getCamera();
        if (!camera) {
            console.error("Camera not available for fireLaser");
        }
        fireLaser(gameState.playerShip, gameState.playerShip);
    }
    
    // Missile targeting
    if (isKeyPressed('targetMissile')) {
        if (DEBUG) console.log("Target missile key pressed");
        startMissileTargeting();
    }
    
    // Fire missile
    if (isKeyPressed('fireMissile')) {
        if (DEBUG) console.log("Fire missile key pressed");
        fireMissile();
    }
    
    // Unarm missile
    if (isKeyPressed('unarmMissile')) {
        if (DEBUG) console.log("Unarm missile key pressed");
        cancelMissileTargeting();
    }
}

// Handle hyperspace
function handleHyperspace() {
    if (isKeyPressed('hyperspace')) {
        if (DEBUG) console.log("Hyperspace key pressed");
        if (gameState.get('fuel') >= 10) {
            const currentSystem = gameState.get('currentSystem');
            const targetSystem = gameState.get('hyperspaceSystem');
            
            if (gameState.useFuel(10)) {
                if (DEBUG) console.log(`Jumping from system ${currentSystem} to ${targetSystem}`);
                
                const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.playerShip.quaternion);
                createHyperspaceEffect(gameState.playerShip.position, direction);
                
                gameState.setCurrentSystem(targetSystem);
                
                gameState.playerShip.position.set(0, 0, 0);
                gameState.station.position.set(0, 0, -CONSTANTS.STATION_DISTANCE);
                
                const ships = getShips();
                while (ships.length > 0) {
                    const ship = ships.pop();
                    getScene().remove(ship);
                }
                spawnRandomShips(CONSTANTS.SHIP_AI_SPAWN_COUNT, gameState.playerShip);
            }
        } else {
            if (DEBUG) console.log("Not enough fuel for hyperspace jump");
        }
    }
}

// Handle docking
function handleDocking() {
    if (isKeyPressed('dock')) {
        if (DEBUG) console.log("Dock key pressed");
        if (canDock(gameState.playerShip, gameState.station)) {
            if (DEBUG) console.log("Docking successful");
            gameState.dock();
            gameState.playerShip.position.set(0, 0, 0);
            gameState.station.position.set(0, 0, -CONSTANTS.STATION_DISTANCE);
        } else {
            if (DEBUG) console.log("Cannot dock - not in position or moving too fast");
        }
    }
}

// Handle UI when docked
function handleDockUI() {
    // Handle Market panel toggle with key state tracking
    if (isKeyPressed('market') && !marketKeyWasPressed) {
        marketKeyWasPressed = true;
        if (DEBUG) console.log("Market key pressed");
        const marketPanel = document.getElementById('market');
        
        if (marketPanel.style.display === 'block') {
            hidePanels();
        } else {
            hidePanels(); // Hide any other panels first
            showMarketPanel();
        }
    }
    
    // Handle Inventory panel toggle with key state tracking
    if (isKeyPressed('inventory') && !inventoryKeyWasPressed) {
        inventoryKeyWasPressed = true;
        if (DEBUG) console.log("Inventory key pressed");
        const inventoryPanel = document.getElementById('inventory');
        
        if (inventoryPanel.style.display === 'block') {
            hidePanels();
        } else {
            hidePanels(); // Hide any other panels first
            showInventoryPanel();
        }
    }
    
    // Handle Status panel toggle with key state tracking
    if (isKeyPressed('status') && !statusKeyWasPressed) {
        statusKeyWasPressed = true;
        if (DEBUG) console.log("Status key pressed");
        const statusPanel = document.getElementById('status');
        
        if (statusPanel.style.display === 'block') {
            hidePanels();
        } else {
            hidePanels(); // Hide any other panels first
            showStatusPanel();
        }
    }
}

// Launch ship from station
function launchShip() {
    if (DEBUG) console.log("Launching ship from station");
    gameState.launch();
    
    // Position the ship away from the station
    gameState.playerShip.position.set(0, 0, -400);
    
    // Set the ship's orientation to face AWAY from the station
    // We've changed forward to be +Z, so we need the default orientation (0,0,0)
    gameState.playerShip.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
    
    // Reset ship's speed to zero on launch
    gameState.playerShip.userData.speed = 0;
    
    // Reset ship's rotation rates
    gameState.playerShip.userData.rollRate = 0;
    gameState.playerShip.userData.pitchRate = 0;
    
    // Force update of ship matrices
    gameState.playerShip.updateMatrix();
    gameState.playerShip.updateMatrixWorld(true);
    
    hidePanels(); // Hide any open UI panels
    setView('front'); // Reset to front view
    
    if (DEBUG) {
        console.log("Ship launched and oriented away from station");
        console.log("Ship forward vector:", new THREE.Vector3(0, 0, 1).applyQuaternion(gameState.playerShip.quaternion));
    }
}

// Update AI ships
function updateAIShips(deltaTime) {
    const ships = getShips();
    ships.forEach(ship => {
        updateShipAI(ship, gameState.playerShip, deltaTime);
        updateShipPosition(ship, deltaTime);
    });
}

// Stop the game loop
export function stopGame() {
    cancelAnimationFrame(animationId);
    if (DEBUG) console.log("Game stopped");
}

// Initialize game when document is loaded
document.addEventListener('DOMContentLoaded', initGame);