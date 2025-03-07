// scanner.js - Scanner/radar functionality

// Reference to the scanner dot element
let scannerDot;

// Initialize scanner
export function initScanner() {
    scannerDot = document.getElementById('scanner-dot');
    return scannerDot;
}

// Update scanner dot position based on relative position between player and target
export function updateScanner(playerShip, station) {
    if (!scannerDot || !playerShip || !station) return;
    
    // Get the scanner element to determine its size
    const scanner = document.getElementById('scanner-box');
    if (!scanner) return;
    
    const scannerSize = scanner.offsetWidth;
    const scannerCenter = scannerSize / 2;
    const scaleFactor = scannerSize / 2.5; // Adjust for proper deflection scaling
    
    // Calculate direction from player to station in world space
    const worldDirection = new THREE.Vector3().subVectors(station.position, playerShip.position);
    
    // Transform to ship's local coordinate system
    const localDirection = worldDirection.clone().applyQuaternion(playerShip.quaternion.clone().invert());
    
    // Calculate the absolute Z value for projection (avoiding division by zero)
    let zAbs = Math.abs(localDirection.z);
    if (zAbs < 0.001) zAbs = 0.001;
    
    // Project to 2D screen space with perspective division
    // The original Elite used this type of formula for projection
    const projectionX = localDirection.x / zAbs;
    const projectionY = localDirection.y / zAbs;
    
    // Scale and clamp to scanner bounds
    const dotX = scannerCenter + (scaleFactor * Math.max(-1, Math.min(1, projectionX)));
    const dotY = scannerCenter - (scaleFactor * Math.max(-1, Math.min(1, projectionY))); // Y is inverted in screen space
    
    // Position the dot
    scannerDot.style.left = `${dotX}px`;
    scannerDot.style.top = `${dotY}px`;
    
    // Change dot appearance based on whether target is in front or behind
    const isInFront = localDirection.z > 0;
    
    if (isInFront) {
        // Solid dot for target in front (solid green)
        scannerDot.style.backgroundColor = '#0F0';
        scannerDot.style.border = 'none';
    } else {
        // Hollow dot for target behind (hollow green)
        scannerDot.style.backgroundColor = 'transparent';
        scannerDot.style.border = '2px solid #0F0';
    }
}