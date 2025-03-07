// ui.js - UI overlays and HUD

import { isMissileTargeting } from './combat.js';
import { galaxy, goods } from './config.js';
import { gameState } from './gameState.js';
import { generateMarket } from './trade.js';

// UI element references
let speedIndicator, shieldsIndicator, energyIndicator, missileIndicator;
let marketPanel, inventoryPanel, statusPanel;

// Track active panel
let activePanel = null;

// Initialize UI
export function initUI() {
    // Get UI element references
    speedIndicator = document.getElementById('speed-indicator');
    shieldsIndicator = document.getElementById('shields-indicator');
    marketPanel = document.getElementById('market');
    inventoryPanel = document.getElementById('inventory');
    statusPanel = document.getElementById('status');
    
    // Create additional indicators if not present
    createEnergyIndicator();
    createMissileIndicator();
    
    // Add close buttons to panels
    addCloseButtonsToAllPanels();
    
    // Position panels to avoid overlap
    positionPanels();
    
    // Listen for game state changes
    gameState.addListener((state, changedProperty) => {
        updateUI(gameState, changedProperty);
    });
}

// Create energy indicator if not exists
function createEnergyIndicator() {
    if (!document.getElementById('energy-indicator')) {
        energyIndicator = document.createElement('div');
        energyIndicator.id = 'energy-indicator';
        energyIndicator.style.position = 'absolute';
        energyIndicator.style.bottom = '60px';
        energyIndicator.style.left = '20px';
        document.getElementById('ui-overlay').appendChild(energyIndicator);
    } else {
        energyIndicator = document.getElementById('energy-indicator');
    }
}

// Create missile indicator if not exists
function createMissileIndicator() {
    if (!document.getElementById('missile-indicator')) {
        missileIndicator = document.createElement('div');
        missileIndicator.id = 'missile-indicator';
        missileIndicator.style.position = 'absolute';
        missileIndicator.style.bottom = '80px';
        missileIndicator.style.left = '20px';
        document.getElementById('ui-overlay').appendChild(missileIndicator);
    } else {
        missileIndicator = document.getElementById('missile-indicator');
    }
}

// Add close button to a panel
function addCloseButton(panel, title) {
    // Create panel header if doesn't exist
    if (!panel.querySelector('.panel-header')) {
        const header = document.createElement('div');
        header.className = 'panel-header';
        
        // Add title
        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        header.appendChild(titleElement);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '✕';
        closeButton.addEventListener('click', () => {
            panel.style.display = 'none';
            activePanel = null;
        });
        header.appendChild(closeButton);
        
        // Add header to panel
        if (panel.firstChild) {
            panel.insertBefore(header, panel.firstChild);
        } else {
            panel.appendChild(header);
        }
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'panel-content';
        
        // Move existing content to this container
        while (panel.childNodes.length > 1) {
            content.appendChild(panel.childNodes[1]);
        }
        
        panel.appendChild(content);
    }
}

// Add close buttons to all panels
function addCloseButtonsToAllPanels() {
    addCloseButton(marketPanel, 'Market');
    addCloseButton(inventoryPanel, 'Inventory');
    addCloseButton(statusPanel, 'Status');
}

// Position panels to avoid overlap
function positionPanels() {
    // Market panel (left side)
    marketPanel.style.top = '50%';
    marketPanel.style.left = '25%';
    marketPanel.style.width = '300px';
    marketPanel.style.maxHeight = '80vh';
    
    // Inventory panel (right side)
    inventoryPanel.style.top = '50%';
    inventoryPanel.style.left = '75%';
    inventoryPanel.style.width = '300px';
    inventoryPanel.style.maxHeight = '80vh';
    
    // Status panel (top)
    statusPanel.style.top = '20%';
    statusPanel.style.left = '50%';
    statusPanel.style.width = '400px';
}

// Update UI elements
export function updateUI(gameState, changedProperty) {
    if (!changedProperty || changedProperty === 'speed') {
        updateSpeedIndicator(gameState.playerShip); // Use gameState.playerShip
    }
    if (!changedProperty || changedProperty === 'shields') {
        updateShieldsIndicator(gameState.get('shields')); // Use get('shields')
    }
    if (!changedProperty || changedProperty === 'energy') {
        updateEnergyIndicator(gameState.get('energy')); // Use get('energy')
    }
    if (!changedProperty || changedProperty === 'missiles') {
        updateMissileIndicator(gameState.get('missiles')); // Use get('missiles')
    }
}

// Update speed indicator
function updateSpeedIndicator(playerShip) {
    if (speedIndicator && playerShip) {
        speedIndicator.textContent = `Speed: ${playerShip.userData.speed.toFixed(1)}`;
    }
}

// Update shields indicator
function updateShieldsIndicator(shields) {
    if (shieldsIndicator) {
        shieldsIndicator.textContent = `Shields: Fore ${Math.floor(shields.fore)}, Aft ${Math.floor(shields.aft)}`;
    }
}

// Update energy indicator
function updateEnergyIndicator(energy) {
    if (energyIndicator) {
        energyIndicator.textContent = `Energy: ${Math.floor(energy)}`;
    }
}

// Update missile indicator
export function updateMissileIndicator(missiles) {
    if (missileIndicator) {
        missileIndicator.textContent = `Missiles: ${missiles}${isMissileTargeting() ? ' (ARMED)' : ''}`;
    }
}

// Show market panel
export function showMarketPanel() {
    if (!marketPanel) return;
    
    // If another panel is showing, hide it
    if (activePanel && activePanel !== marketPanel) {
        activePanel.style.display = 'none';
    }
    
    // Get market data
    const market = generateMarket(gameState.get('currentSystem'));
    const content = marketPanel.querySelector('.panel-content') || marketPanel;
    
    // Update market content
    content.innerHTML = market.map((item, i) =>
        `<div class="market-item">
            <span class="item-name">${item.name}</span>
            <span class="item-price">${item.price} CR/t</span>
            <span class="item-avail">Stock: ${item.availability}</span>
            <button onclick="window.buy(${i}, 1)">Buy 1</button>
            <button onclick="window.buy(${i}, 5)">Buy 5</button>
            <button onclick="window.buy(${i}, 10)">Buy 10</button>
        </div>`
    ).join('');
    
    // Add fuel purchase option
    content.innerHTML += `
        <div class="market-item fuel-section">
            <h3>Fuel</h3>
            <span>Price: ${gameState.get('fuel') / 10} LY available</span>
            <button onclick="window.buyFuel(10)">Buy 1 LY</button>
            <button onclick="window.buyFuel(30)">Buy 3 LY</button>
            <button onclick="window.buyFuel(70)">Fill Tank</button>
        </div>
    `;
    
    marketPanel.style.display = 'block';
    activePanel = marketPanel;
}

// Show inventory panel
export function showInventoryPanel() {
    if (!inventoryPanel) return;
    
    // If another panel is showing, hide it
    if (activePanel && activePanel !== inventoryPanel) {
        activePanel.style.display = 'none';
    }
    
    const content = inventoryPanel.querySelector('.panel-content') || inventoryPanel;
    
    // Basic info
    content.innerHTML = `
        <div class="inventory-stats">
            <div>Cash: ${gameState.get('cash').toFixed(1)} CR</div>
            <div>Fuel: ${gameState.get('fuel') / 10} LY</div>
            <div>Cargo Space: ${gameState.getTotalCargo()}/${gameState.get('cargoCapacity')}</div>
        </div>
    `;
    
    // Add cargo items
    content.innerHTML += '<h3>Cargo</h3>';
    content.innerHTML += goods.map((name, i) => {
        const amount = gameState.get('cargo')[i];
        if (amount <= 0) return ''; // Skip empty cargo
        
        return `
            <div class="cargo-item">
                <span class="item-name">${name}</span>
                <span class="item-amount">${amount}t</span>
                <button onclick="window.sell(${i}, 1)">Sell 1</button>
                <button onclick="window.sell(${i}, 5)">Sell 5</button>
                <button onclick="window.sell(${i}, ${amount})">Sell All</button>
            </div>
        `;
    }).join('');
    
    inventoryPanel.style.display = 'block';
    activePanel = inventoryPanel;
}

// Show status panel
export function showStatusPanel() {
    if (!statusPanel) return;
    
    // If another panel is showing, hide it
    if (activePanel && activePanel !== statusPanel) {
        activePanel.style.display = 'none';
    }
    
    const content = statusPanel.querySelector('.panel-content') || statusPanel;
    
    content.innerHTML = `
        <div class="status-section">
            <h3>Commander Information</h3>
            <div>Commander: Player</div>
            <div>Rating: Harmless</div>
            <div>Legal Status: Clean</div>
        </div>
        
        <div class="status-section">
            <h3>Ship Status</h3>
            <div>Condition: ${gameState.get('condition')}</div>
            <div>Cash: ${gameState.get('cash').toFixed(1)} CR</div>
            <div>Fuel: ${gameState.get('fuel') / 10} LY</div>
            <div>Cargo: ${gameState.getTotalCargo()}/${gameState.get('cargoCapacity')}</div>
            <div>Missiles: ${gameState.get('missiles')}</div>
        </div>
        
        <div class="status-section">
            <h3>Navigation</h3>
            <div>Present System: ${galaxy[gameState.get('currentSystem')].name}</div>
            <div>Hyperspace Target: ${galaxy[gameState.get('hyperspaceSystem')].name}</div>
            <div class="system-selector">
                <h4>Select Hyperspace Target:</h4>
                ${galaxy.map((system, i) => 
                    `<button onclick="window.setHyperspaceSystem(${i})">${system.name}</button>`
                ).join('')}
            </div>
        </div>
    `;
    
    statusPanel.style.display = 'block';
    activePanel = statusPanel;
}

// Toggle panel visibility
export function togglePanel(panel) {
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        activePanel = null;
    } else {
        if (activePanel) {
            activePanel.style.display = 'none';
        }
        panel.style.display = 'block';
        activePanel = panel;
    }
}

// Hide all panels
export function hidePanels() {
    if (marketPanel) marketPanel.style.display = 'none';
    if (inventoryPanel) inventoryPanel.style.display = 'none';
    if (statusPanel) statusPanel.style.display = 'none';
    activePanel = null;
}

// Show a notification message
export function showNotification(message, color = '#fff', duration = 2000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'absolute';
    notification.style.top = '120px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.color = color;
    notification.style.fontFamily = 'monospace';
    notification.style.background = 'rgba(0,0,0,0.7)';
    notification.style.padding = '5px 10px';
    notification.style.borderRadius = '3px';
    notification.style.zIndex = '1000';
    document.getElementById('ui-overlay').appendChild(notification);
    
    setTimeout(() => notification.remove(), duration);
}

// Update UI for hyperspace target
export function updateHyperspaceTarget(index) {
    showNotification(
        `Hyperspace target: ${galaxy[index].name}`,
        '#ff0',
        2000
    );
}

// Check if any panel is visible
export function isPanelVisible() {
    return activePanel !== null;
}

// Get active panel
export function getActivePanel() {
    return activePanel;
}