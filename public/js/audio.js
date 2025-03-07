// audio.js - Sound effects

// Audio context
let audioContext;

// Initialize audio system
export function initAudio() {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return audioContext;
}

// Play a sound with specified frequency and duration
export function playSound(frequency, duration, type = 'sine', volume = 0.5) {
    if (!audioContext) {
        initAudio();
    }
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    // Create gain node for volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration);
    
    return oscillator;
}

// Play laser sound
export function playLaserSound(isPlayerLaser = true) {
    return playSound(isPlayerLaser ? 440 : 330, 100, 'sine', 0.3);
}

// Play explosion sound
export function playExplosionSound() {
    // Random pitch for variation
    const frequency = 100 + Math.random() * 50;
    return playSound(frequency, 300, 'sawtooth', 0.4);
}

// Play hyperspace sound
export function playHyperspaceSound() {
    return playSound(220, 1000, 'sine', 0.5);
}

// Play trade sound (buy)
export function playBuySound() {
    return playSound(550, 100, 'sine', 0.3);
}

// Play trade sound (sell)
export function playSellSound() {
    return playSound(660, 100, 'sine', 0.3);
}

// Play collision sound
export function playCollisionSound() {
    return playSound(100, 300, 'sawtooth', 0.4);
}

// Play missile targeting sound
export function playMissileTargetingSound() {
    return playSound(880, 200, 'sine', 0.3);
}

// Play missile launch sound
export function playMissileLaunchSound() {
    return playSound(660, 300, 'sine', 0.4);
}

// Get audio context
export function getAudioContext() {
    if (!audioContext) {
        initAudio();
    }
    return audioContext;
}