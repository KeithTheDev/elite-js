// config.js - Game constants and configuration

// Trade goods
export const goods = [
    "Food", "Textiles", "Radioactives", "Slaves", "Liquor/Wines",
    "Luxuries", "Narcotics", "Computers", "Machinery", "Alloys",
    "Firearms", "Furs", "Minerals", "Gold", "Platinum", "Gem-Stones", "Alien Items"
];

// Base prices for goods
export const basePrices = [
    19, 27, 65, 42, 82,
    92, 112, 105, 56, 78,
    124, 180, 32, 350, 650, 850, 1000
];

// Galaxy systems
export const galaxy = [
    { name: "Lave", economy: 3, government: 1, techlevel: 4 },
    { name: "Riedquat", economy: 1, government: 2, techlevel: 3 },
    { name: "Diso", economy: 4, government: 1, techlevel: 5 },
    { name: "Leesti", economy: 5, government: 4, techlevel: 7 },
    { name: "Zaonce", economy: 6, government: 3, techlevel: 7 }
];

// Keyboard control mapping
export const controls = {
    rollLeft: ',',           // < (comma)
    rollRight: '.',          // > (period)
    pitchUp: 'x',            // X
    pitchDown: 's',          // S
    speedUp: ' ',            // Space
    speedDown: '/',          // ? (slash)
    fireLaser: 'a',          // A
    targetMissile: 't',      // T
    fireMissile: 'm',        // M
    unarmMissile: 'u',       // U
    hyperspace: 'h',         // H
    dock: 'c',               // C
    launch: 'l',             // f0
    viewFront: '1',          // f0
    viewBack: '2',           // f1
    viewLeft: '3',           // f2
    viewRight: '4',          // f3
    market: '7',             // f7
    inventory: '9',          // f9
    status: '8'              // f8
};

// Camera view positions
export const views = {
    front: { 
        position: [0, 5, -10], // Position camera behind the ship, pointing forward
        rotation: [0, Math.PI, 0] // Look forward (along -Z direction)
    },
    back: { 
        position: [0, 5, 10], // Position camera in front of the ship, pointing backward
        rotation: [0, 0, 0] // Look backward (along +Z direction)
    },
    left: { 
        position: [10, 5, 0], // Position camera to the right of ship, pointing left
        rotation: [0, Math.PI / 2, 0] // Look left (along -X direction)
    },
    right: { 
        position: [-10, 5, 0], // Position camera to the left of ship, pointing right
        rotation: [0, -Math.PI / 2, 0] // Look right (along +X direction)
    }
};

// Game constants
export const CONSTANTS = {
    STARFIELD_COUNT: 3000,  // Increased star count for better immersion
    STARFIELD_SIZE: 8000,  // Expanded size to create the illusion of infinite space
    STATION_DISTANCE: 500,
    MAX_FUEL: 70,
    FUEL_PRICE: 2.0,
    MAX_SHIELDS: 255,
    MAX_ENERGY: 255,
    SHIELD_REGEN_RATE: 0.5,
    ENERGY_REGEN_RATE: 1.0,
    SHIP_AI_SPAWN_COUNT: 5,
    SHIP_RESPAWN_DISTANCE: 1000,
    COLLISION_THRESHOLD: 50,
    STATION_ROTATION_SPEED: 0.05
};