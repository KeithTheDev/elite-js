// gameState.js - Game state management

import { galaxy } from './config.js';

// Initial game state
const initialState = {
    docked: true,
    condition: 'DOCKED',
    cash: 100,
    fuel: 70, // 7 LY * 10
    cargo: Array(17).fill(0), // 17 trade goods
    cargoCapacity: 20,
    shields: { fore: 255, aft: 255 },
    energy: 255,
    missiles: 3,
    laserPower: { front: 2, rear: 0, left: 0, right: 0 },
    currentSystem: 0, // Index in galaxy
    hyperspaceSystem: 0
};

// Create game state with getters and setters
class GameState {
    constructor() {
        this._state = { ...initialState };
        this._listeners = [];
    }

    // Reset the game state
    reset() {
        this._state = { ...initialState };
        this._notifyListeners();
    }

    // Get a property from the state
    get(property) {
        return this._state[property];
    }

    // Set a property in the state
    set(property, value) {
        this._state[property] = value;
        this._notifyListeners(property);
    }

    // Direct access to all properties (use sparingly)
    get state() {
        return this._state;
    }

    // Add a listener for state changes
    addListener(callback) {
        this._listeners.push(callback);
    }

    // Remove a listener
    removeListener(callback) {
        this._listeners = this._listeners.filter(listener => listener !== callback);
    }

    // Notify all listeners of state changes
    _notifyListeners(changedProperty) {
        this._listeners.forEach(listener => listener(this._state, changedProperty));
    }

    // Helper methods for common state changes
    dock() {
        this._state.docked = true;
        this._state.condition = 'DOCKED';
        
        // Add 'docked' class to container for CSS targeting
        document.getElementById('game-container').classList.add('docked');
        
        this._notifyListeners('docked');
    }

    launch() {
        this._state.docked = false;
        this._state.condition = 'GREEN';
        
        // Remove 'docked' class from container to show flight UI elements
        document.getElementById('game-container').classList.remove('docked');
        
        this._notifyListeners('docked');
    }

    addCash(amount) {
        this._state.cash += amount;
        this._notifyListeners('cash');
    }

    subtractCash(amount) {
        this._state.cash -= amount;
        this._notifyListeners('cash');
    }

    setCurrentSystem(index) {
        if (index >= 0 && index < galaxy.length) {
            this._state.currentSystem = index;
            this._notifyListeners('currentSystem');
        }
    }

    setHyperspaceSystem(index) {
        if (index >= 0 && index < galaxy.length) {
            this._state.hyperspaceSystem = index;
            this._notifyListeners('hyperspaceSystem');
        }
    }

    // Cargo methods
    addCargo(goodIndex, amount) {
        if (goodIndex >= 0 && goodIndex < this._state.cargo.length) {
            this._state.cargo[goodIndex] += amount;
            this._notifyListeners('cargo');
        }
    }

    removeCargo(goodIndex, amount) {
        if (goodIndex >= 0 && goodIndex < this._state.cargo.length &&
            this._state.cargo[goodIndex] >= amount) {
            this._state.cargo[goodIndex] -= amount;
            this._notifyListeners('cargo');
        }
    }

    getTotalCargo() {
        return this._state.cargo.reduce((total, amount) => total + amount, 0);
    }

    getAvailableCargoSpace() {
        return this._state.cargoCapacity - this.getTotalCargo();
    }

    // Energy and shields
    damageShields(foreDamage, aftDamage) {
        this._state.shields.fore = Math.max(0, this._state.shields.fore - foreDamage);
        this._state.shields.aft = Math.max(0, this._state.shields.aft - aftDamage);
        this._notifyListeners('shields');
    }

    useEnergy(amount) {
        this._state.energy = Math.max(0, this._state.energy - amount);
        this._notifyListeners('energy');
    }

    regenShieldsAndEnergy(deltaTime, shieldRate, energyRate) {
        if (this._state.shields.fore < 255) {
            this._state.shields.fore = Math.min(255, this._state.shields.fore + shieldRate * deltaTime);
        }
        if (this._state.shields.aft < 255) {
            this._state.shields.aft = Math.min(255, this._state.shields.aft + shieldRate * deltaTime);
        }
        if (this._state.energy < 255) {
            this._state.energy = Math.min(255, this._state.energy + energyRate * deltaTime);
        }
        this._notifyListeners('energy');
    }

    // Fuel management
    useFuel(amount) {
        if (this._state.fuel >= amount) {
            this._state.fuel -= amount;
            this._notifyListeners('fuel');
            return true;
        }
        return false;
    }

    addFuel(amount) {
        this._state.fuel = Math.min(70, this._state.fuel + amount);
        this._notifyListeners('fuel');
    }

    // Missile management
    fireMissile() {
        if (this._state.missiles > 0) {
            this._state.missiles--;
            this._notifyListeners('missiles');
            return true;
        }
        return false;
    }

    addMissiles(amount) {
        this._state.missiles += amount;
        this._notifyListeners('missiles');
    }
}

// Create and export a singleton instance
export const gameState = new GameState();
export default gameState;