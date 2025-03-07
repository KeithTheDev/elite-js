// trade.js - Trading mechanics

import { playSound } from './audio.js';
import { basePrices, CONSTANTS, galaxy, goods } from './config.js';
import { gameState } from './gameState.js';
import { showNotification } from './ui.js';

// Generate market prices for a system
export function generateMarket(systemIndex) {
    const system = galaxy[systemIndex];
    const market = [];
    
    for (let i = 0; i < goods.length; i++) {
        // Calculate price with economic factors and randomness
        const price = basePrices[i] * (1 + (system.economy - 3) * 0.1 + (Math.random() - 0.5) * 0.2);
        
        // Calculate availability based on economy
        const availability = Math.floor(Math.random() * 50 * (7 - system.economy));
        
        // Add to market
        market.push({ 
            name: goods[i], 
            price: price.toFixed(1), 
            availability 
        });
    }
    
    return market;
}

// Buy goods
export function buy(goodIndex, amount) {
    const market = generateMarket(gameState.get('currentSystem'));
    const item = market[goodIndex];
    const cost = parseFloat(item.price) * amount;
    const totalCargo = gameState.getTotalCargo();
    
    // Check if purchase is valid
    if (gameState.get('cash') >= cost && 
        totalCargo + amount <= gameState.get('cargoCapacity') && 
        item.availability >= amount) {
        
        // Process purchase
        gameState.subtractCash(cost);
        gameState.addCargo(goodIndex, amount);
        playSound(550, 100);
        
        // Show success notification
        showNotification(
            `Bought ${amount}t of ${item.name} for ${cost.toFixed(1)} CR`,
            '#0f0',
            2000
        );
        
        return true;
    } else {
        // Show error notification
        let errorMessage = "";
        
        if (gameState.get('cash') < cost) {
            errorMessage = `Not enough credits. Need ${cost.toFixed(1)} CR`;
        } else if (totalCargo + amount > gameState.get('cargoCapacity')) {
            errorMessage = `Not enough cargo space. ${gameState.getAvailableCargoSpace()}t available`;
        } else {
            errorMessage = `Only ${item.availability}t available to buy`;
        }
        
        showNotification(errorMessage, '#f00', 2000);
        return false;
    }
}

// Sell goods
export function sell(goodIndex, amount) {
    const market = generateMarket(gameState.get('currentSystem'));
    const item = market[goodIndex];
    const cargo = gameState.get('cargo');
    
    if (cargo[goodIndex] >= amount) {
        const profit = parseFloat(item.price) * amount;
        
        // Process sale
        gameState.addCash(profit);
        gameState.removeCargo(goodIndex, amount);
        playSound(660, 100);
        
        // Show success notification
        showNotification(
            `Sold ${amount}t of ${item.name} for ${profit.toFixed(1)} CR`,
            '#0f0',
            2000
        );
        
        return true;
    } else {
        // Show error notification
        showNotification(
            `Not enough ${item.name} to sell`,
            '#f00',
            2000
        );
        
        return false;
    }
}

// Buy fuel
export function buyFuel(amount) {
    const fuelPrice = CONSTANTS.FUEL_PRICE;
    const cost = amount * fuelPrice;
    const maxFuel = CONSTANTS.MAX_FUEL;
    
    if (gameState.get('cash') >= cost && gameState.get('fuel') + amount <= maxFuel) {
        // Process fuel purchase
        gameState.subtractCash(cost);
        gameState.addFuel(amount);
        playSound(550, 100);
        
        // Show success notification
        showNotification(
            `Bought ${amount/10} LY of fuel for ${cost.toFixed(1)} CR`,
            '#0f0',
            2000
        );
        
        return true;
    } else {
        // Show error notification
        let errorMessage = "";
        
        if (gameState.get('cash') < cost) {
            errorMessage = `Not enough credits. Need ${cost.toFixed(1)} CR`;
        } else {
            errorMessage = `Fuel tank capacity exceeded. ${(maxFuel - gameState.get('fuel'))/10} LY available`;
        }
        
        showNotification(errorMessage, '#f00', 2000);
        return false;
    }
}