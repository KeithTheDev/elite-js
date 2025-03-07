// effects.js - Visual effects like explosions

import { playExplosionSound } from './audio.js';
import { addToScene, removeFromScene } from './rendering.js';

// Create explosion effect at a position
export function createExplosion(position, particleCount = 30) {
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Random direction
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();
        
        // Random speed and lifetime
        const speed = 5 + Math.random() * 15;
        const lifetime = 1 + Math.random();
        
        // Create particle
        const geometry = new THREE.SphereGeometry(0.5 + Math.random() * 1.5, 4, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? 0xff6600 : 0xffcc00
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Store particle properties
        particle.userData = {
            direction,
            speed,
            lifetime
        };
        
        // Add to scene
        addToScene(particle);
        particles.push(particle);
        
        // Play explosion sound (but not for every particle)
        if (i % 5 === 0) {
            playExplosionSound();
        }
    }
    
    // Update and remove particles
    updateParticles(particles);
    
    return particles;
}

// Update explosion particles
function updateParticles(particles) {
    if (particles.length === 0) return;
    
    let allExpired = true;
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Reduce lifetime
        particle.userData.lifetime -= 0.016; // Approx 60fps
        
        if (particle.userData.lifetime > 0) {
            allExpired = false;
            
            // Move particle
            particle.position.add(
                particle.userData.direction.clone().multiplyScalar(
                    particle.userData.speed * 0.016
                )
            );
            
            // Slow down and fade
            particle.userData.speed *= 0.98;
            particle.scale.multiplyScalar(0.98);
        } else {
            // Remove expired particle
            removeFromScene(particle);
            particles.splice(i, 1);
        }
    }
    
    // Continue updating if particles remain
    if (!allExpired) {
        requestAnimationFrame(() => updateParticles(particles));
    }
}

// Create laser hit effect
export function createLaserHitEffect(position) {
    // Create a small sphere as hit effect
    const hitEffect = new THREE.Mesh(
        new THREE.SphereGeometry(2),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    hitEffect.position.copy(position);
    addToScene(hitEffect);
    
    // Remove after a short time
    setTimeout(() => removeFromScene(hitEffect), 100);
    
    return hitEffect;
}

// Create hyperspace effect
export function createHyperspaceEffect(position, direction) {
    const particles = [];
    const particleCount = 100;
    
    // Create particles flying past the player
    for (let i = 0; i < particleCount; i++) {
        // Position along the direction vector
        const distance = Math.random() * 1000;
        const spread = 200;
        
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );
        
        const pos = position.clone().add(
            direction.clone().multiplyScalar(distance).add(offset)
        );
        
        // Create streaking particle
        const length = 10 + Math.random() * 40;
        const geometry = new THREE.BufferGeometry();
        const vertices = [
            pos.x, pos.y, pos.z,
            pos.x - direction.x * length, pos.y - direction.y * length, pos.z - direction.z * length
        ];
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({ 
            color: 0xaaaaff, 
            opacity: 0.7,
            transparent: true
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Store properties
        line.userData = {
            speed: 50 + Math.random() * 100,
            lifetime: 1 + Math.random() * 2
        };
        
        // Add to scene
        addToScene(line);
        particles.push(line);
    }
    
    // Update and remove particles
    updateHyperspaceParticles(particles, direction);
    
    return particles;
}

// Update hyperspace particles
function updateHyperspaceParticles(particles, direction) {
    if (particles.length === 0) return;
    
    let allExpired = true;
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Reduce lifetime
        particle.userData.lifetime -= 0.016; // Approx 60fps
        
        if (particle.userData.lifetime > 0) {
            allExpired = false;
            
            // Move particle along direction
            particle.position.add(
                direction.clone().multiplyScalar(particle.userData.speed * 0.016)
            );
            
            // Update opacity
            particle.material.opacity = Math.min(1, particle.userData.lifetime);
        } else {
            // Remove expired particle
            removeFromScene(particle);
            particles.splice(i, 1);
        }
    }
    
    // Continue updating if particles remain
    if (!allExpired) {
        requestAnimationFrame(() => updateHyperspaceParticles(particles, direction));
    }
}