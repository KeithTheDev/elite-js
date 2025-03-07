# Elite JS

![Elite JS](https://via.placeholder.com/800x400?text=Elite+JS+Screenshot)

## A Modern JavaScript Recreation of the Classic Elite Space Trading Game

Elite JS is an open-source reimplementation of the legendary 1984 space trading game Elite, using modern web technologies. Built with JavaScript and Three.js, this project aims to capture the magic of the original while making it accessible to a new generation of players directly in their browsers.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status](https://img.shields.io/badge/Status-In%20Development-blue)

## Features

- **Classic Elite Gameplay**: Trade, explore, and combat in a vast universe with thousands of planets
- **Modern 3D Graphics**: Wireframe vector graphics with proper hidden line removal implemented in Three.js
- **Browser-Based**: Play directly in your web browser without plugins or installs
- **Full Flight Mechanics**: Roll, pitch, and thrust controls just like the original
- **Trading System**: Buy and sell commodities across different star systems
- **Combat System**: Fight with lasers and missiles against different ship types
- **Docking Mechanics**: Dock with space stations to trade and refuel
- **Starfield Background**: Parallax star effect creating the illusion of infinite space

## Play Now

A live demo is available at: [Coming Soon](#) (Link will be updated when deployed)

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KeithTheDev/elite-js.git
   cd elite-js
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Controls

| Action              | Key            |
|---------------------|----------------|
| Roll Left           | , (comma)      |
| Roll Right          | . (period)     |
| Pitch Up            | X              |
| Pitch Down          | S              |
| Accelerate          | Space          |
| Decelerate          | / (slash)      |
| Fire Laser          | A              |
| Target Missile      | T              |
| Fire Missile        | M              |
| Unarm Missile       | U              |
| Hyperspace Jump     | H              |
| Dock with Station   | C              |
| Launch from Station | L              |
| Front View          | 1              |
| Rear View           | 2              |
| Left View           | 3              |
| Right View          | 4              |
| Market Panel        | 7              |
| Status Panel        | 8              |
| Inventory Panel     | 9              |

## Codebase Architecture

The project is structured as follows:

```
elite-js/
├── server.js               # Simple Express server for development
├── public/                 # Client-side files
│   ├── index.html          # Main HTML page
│   ├── styles.css          # Global styles
│   └── js/                 # JavaScript modules
│       ├── main.js         # Entry point and game loop
│       ├── rendering.js    # Three.js rendering setup
│       ├── ship.js         # Ship creation and management
│       ├── controls.js     # User input handling
│       ├── physics.js      # Collision detection
│       ├── combat.js       # Weapons and damage system
│       ├── trade.js        # Trading mechanics
│       ├── ai.js           # AI behavior for enemy ships
│       ├── ui.js           # Interface overlays
│       ├── effects.js      # Visual effects like explosions
│       ├── gameState.js    # Core game state management
│       ├── starfield.js    # Background star rendering
│       ├── blueprints.js   # Ship model definitions
│       ├── config.js       # Game constants and settings
│       ├── scanner.js      # Radar functionality
│       └── audio.js        # Sound effects
```

### Key Components

- **main.js**: Sets up the game loop, initializes all subsystems, and handles the primary game logic flow
- **rendering.js**: Manages Three.js scene, camera, and renderer with custom wireframe rendering
- **ship.js**: Creates and manages all ships in the game, handling their visual representation
- **gameState.js**: A centralized state management system with event listeners to update the UI when values change
- **blueprints.js**: Contains the vertex and edge data for all ship models in a classic Elite wireframe style

## Contributing

We welcome contributions of all kinds! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Areas That Need Help

- **Performance Optimization**: Help make the game run smoothly on all devices
- **Mobile Controls**: Implement touch controls for mobile play
- **Additional Ship Types**: Add more ships from the Elite universe
- **Enhanced AI**: Improve enemy ship behavior and tactics
- **Better Physics**: Refine collision detection and response
- **World Generation**: Enhance the procedural star system generation
- **Visual Enhancements**: Improve wireframe rendering and effects
- **Sound Design**: Create better sound effects for immersion
- **Trading Economy**: Balance and expand the trading system
- **Mission System**: Implement special missions and goals

## Development Philosophy

This project aims to:

1. **Stay True to the Original**: Maintain the core gameplay elements that made Elite legendary
2. **Embrace Modern Web Tech**: Use current JavaScript and WebGL capabilities to their fullest
3. **Keep It Accessible**: Ensure the game runs well on a variety of devices
4. **Write Clean Code**: Maintain readable, modular code that new contributors can understand

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- David Braben and Ian Bell for creating the original Elite
- The Three.js team for their amazing 3D library
- All contributors who help make this project better

---

*Elite JS is a fan project and is not affiliated with or endorsed by the creators of the original Elite game.*
