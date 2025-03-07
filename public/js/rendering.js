// rendering.js - Three.js setup and rendering

import { views } from './config.js';

// Setup Three.js scene, camera, and renderer
let scene, camera, renderer;
let currentView = 'front';

// This function will be called to check for rendering issues
function debugScene() {
    console.warn("=== DEBUGGING SCENE ===");
    let matrixAutoUpdateDisabled = 0;
    let matrixUpdateNeeded = 0;
    
    scene.traverse(obj => {
        if (!obj.matrixAutoUpdate) {
            matrixAutoUpdateDisabled++;
        }
        
        // Force updates
        obj.updateMatrix();
        obj.updateMatrixWorld(true);
    });
    
    console.warn(`Found ${matrixAutoUpdateDisabled} objects with matrixAutoUpdate disabled`);
}

export function initRenderer() {
    console.warn("INITIALIZING NEW RENDERER");
    
    // Remove any existing renderer
    const container = document.getElementById('three-canvas');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Create brand new Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create camera with wide view distance
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    
    // Create renderer with explicit settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    
    // Set renderer properties
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Explicitly enable depth testing
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    
    // Set these properties to ensure lines at different depths render correctly
    renderer.sortObjects = true;
    renderer.autoClear = true;
    
    // Important for proper hidden line removal
    renderer.logarithmicDepthBuffer = true;
    
    // Add renderer to DOM
    container.appendChild(renderer.domElement);
    
    // Add debug functions to window
    window.debugThreeScene = debugScene;
    window.toggleWireframeFaces = toggleSolidMeshVisibility;
    
    // Add keyboard shortcut for toggling wireframe debug mode
    // Press 'D' key to toggle debug view of wireframes
    window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'd') {
            console.log("Toggling wireframe debug mode...");
            toggleSolidMeshVisibility();
        }
    });
    
    // Add resize handler
    window.addEventListener('resize', handleResize);
    
    // Create global function to force view change
    window.changeView = (viewName) => {
        if (views[viewName]) {
            console.warn(`Forcing view change to ${viewName} via global function`);
            currentView = viewName;
        }
    };
    
    // Debug - check for WebGL capabilities
    console.log("WebGL Parameters:", 
        "Depth Testing:", renderer.getContext().getParameter(renderer.getContext().DEPTH_TEST),
        "Depth Func:", renderer.getContext().getParameter(renderer.getContext().DEPTH_FUNC)
    );
    
    return { scene, camera, renderer };
}

// Update camera view
export function setView(viewName) {
    if (!views[viewName]) {
        console.error("View not found:", viewName);
        return currentView;
    }
    
    // DEBUG: Add more detailed logging
    console.warn(`===== CHANGING VIEW TO: ${viewName} =====`);
    
    // Update current view
    currentView = viewName;
    
    // Apply the view settings immediately
    const viewConfig = views[viewName];
    
    // Reset the camera position and rotation based on the view
    if (camera) {
        // Use a dummy object to position the camera
        const dummyObj = new THREE.Object3D();
        
        // Set the camera relative to the dummy
        dummyObj.add(camera);
        camera.position.set(...viewConfig.position);
        camera.rotation.set(...viewConfig.rotation);
        
        // Update matrices
        dummyObj.updateMatrixWorld(true);
        
        // Remove camera from dummy
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        camera.getWorldPosition(worldPos);
        camera.getWorldQuaternion(worldQuat);
        
        dummyObj.remove(camera);
        
        // Position camera directly
        camera.position.copy(worldPos);
        camera.quaternion.copy(worldQuat);
        camera.updateMatrixWorld(true);
    }
    
    return currentView;
}

// Apply the current view to the camera
export function updateCameraPosition(playerShip) {
    if (!camera || !playerShip) return;
    
    // Get the view configuration for the current view
    const viewConfig = views[currentView];
    if (!viewConfig) {
        console.error("Invalid view:", currentView);
        return;
    }
    
    // SIMPLER APPROACH - Apply position and rotation directly
    
    // Get ship's current world position and quaternion
    const shipPosition = new THREE.Vector3();
    const shipQuaternion = new THREE.Quaternion();
    playerShip.getWorldPosition(shipPosition);
    playerShip.getWorldQuaternion(shipQuaternion);
    
    // Create an offset vector for the camera based on the view
    const offsetVector = new THREE.Vector3(...viewConfig.position);
    
    // Apply the ship's rotation to the offset vector
    offsetVector.applyQuaternion(shipQuaternion);
    
    // Add the rotated offset to the ship's position
    camera.position.copy(shipPosition).add(offsetVector);
    
    // Create a rotation quaternion from the view's rotation
    const viewRotationQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...viewConfig.rotation)
    );
    
    // Combine the ship's quaternion with the view's rotation
    const finalQuaternion = new THREE.Quaternion().copy(shipQuaternion).multiply(viewRotationQuat);
    
    // Apply the final rotation to the camera
    camera.quaternion.copy(finalQuaternion);
    
    // Force update
    camera.updateMatrix();
    camera.updateMatrixWorld(true);
    
    // Log for debugging (only occasionally)
    if (Math.random() < 0.002) {
        console.warn(`Camera updated for view: ${currentView} at ${Date.now()}`);
        console.log("Ship position:", shipPosition.toArray().map(n => n.toFixed(2)).join(", "));
        console.log("Camera position:", camera.position.toArray().map(n => n.toFixed(2)).join(", "));
    }
}


// Handle window resize
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Debug function to toggle between wireframe and solid mode
function toggleSolidMeshVisibility() {
    // Track if we made any changes
    let changed = false;
    
    scene.traverse(object => {
        // Look for our container groups that have two children
        if (object.type === 'Group' && object.children.length === 2) {
            // Check if this is our special model (first child is a mesh, second is line segments)
            if (object.children[0].type === 'Mesh' && object.children[1].type === 'LineSegments') {
                const solidMesh = object.children[0];
                const wireframe = object.children[1];
                
                // Check if we're using our shader material
                if (solidMesh.material.type === 'ShaderMaterial') {
                    // Toggle between wireframe mode and colored face mode
                    
                    if (solidMesh.material.uniforms && solidMesh.material.uniforms.debugMode) {
                        // Already in debug mode, toggle it off
                        solidMesh.material.uniforms.debugMode.value = !solidMesh.material.uniforms.debugMode.value;
                    } else {
                        // Create a new colored material to debug
                        const newMaterial = new THREE.ShaderMaterial({
                            uniforms: {
                                debugMode: { value: true }
                            },
                            vertexShader: `
                                varying vec3 vNormal;
                                
                                void main() {
                                    vNormal = normalize(normalMatrix * normal);
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `,
                            fragmentShader: `
                                varying vec3 vNormal;
                                uniform bool debugMode;
                                
                                void main() {
                                    float facing = dot(vNormal, vec3(0.0, 0.0, 1.0));
                                    
                                    if (debugMode) {
                                        // Debug mode: show front faces in blue, back faces in red
                                        if (facing > 0.0) {
                                            gl_FragColor = vec4(0.0, 0.5, 1.0, 1.0); // Front: blue
                                        } else {
                                            gl_FragColor = vec4(1.0, 0.3, 0.3, 1.0); // Back: red
                                        }
                                    } else {
                                        // Normal mode: front faces white, back faces black
                                        gl_FragColor = vec4(step(0.0, facing));
                                    }
                                }
                            `,
                            side: THREE.DoubleSide,
                            depthWrite: true
                        });
                        
                        // Replace the material
                        solidMesh.material = newMaterial;
                    }
                    
                    changed = true;
                }
            }
        }
    });
    
    if (changed) {
        console.log("Toggled wireframe debug mode");
    } else {
        console.log("No wireframe models found to toggle");
    }
}

// Render function
export function render() {
    if (!scene || !camera || !renderer) {
        console.error("Can't render: scene, camera, or renderer is missing");
        return;
    }
    
    // DEBUG - Report any objects that might be missing matrices
    if (Math.random() < 0.005) {
        scene.traverse(object => {
            if (!object.matrixWorldAutoUpdate) {
                console.warn("Found object with matrixWorldAutoUpdate = false:", object);
            }
        });
    }
    
    // Force full scene graph update to ensure all world matrices are current
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    
    // Log render operation occasionally
    if (Math.random() < 0.005) {
        console.warn("RENDERING SCENE at timestamp:", Date.now());
        console.log("Camera at:", 
            camera.position.x.toFixed(2),
            camera.position.y.toFixed(2),
            camera.position.z.toFixed(2)
        );
        console.log("Camera quaternion:", 
            camera.quaternion.x.toFixed(2),
            camera.quaternion.y.toFixed(2),
            camera.quaternion.z.toFixed(2),
            camera.quaternion.w.toFixed(2)
        );
    }
    
    // Clear both the color buffer and depth buffer
    renderer.clear();
    
    // Make sure depth testing is enabled
    const gl = renderer.getContext();
    gl.enable(gl.DEPTH_TEST);
    
    // Ensure we're rendering the actual scene
    renderer.render(scene, camera);
}

// Add the debug function to window for testing
window.toggleWireframeFaces = toggleSolidMeshVisibility;

// Add object to scene
export function addToScene(object) {
    scene.add(object);
}

// Remove object from scene
export function removeFromScene(object) {
    scene.remove(object);
}

// Get scene
export function getScene() {
    return scene;
}

// Get camera
export function getCamera() {
    return camera;
}

// Get renderer
export function getRenderer() {
    return renderer;
}

// Get current view
export function getCurrentView() {
    return currentView;
}

// Create line model from vertices and edges with proper hidden line removal
export function createLineModel(vertices, edges, color = 0xffffff) {
    // True hidden-line removal approach using solid faces
    
    // Each model has:
    // 1. The solid geometry with opaque white front faces and black back faces
    // 2. Black wireframe rendered on top
    
    // This creates a 3D effect where:
    // - Front-facing surface is white with black lines
    // - Back-facing surface is black (hiding all lines behind it)
    // - Result is that back-facing edges are invisible
    
    // Create container for the model
    const container = new THREE.Group();
    
    // Create solid mesh: this will be rendered as a solid object
    const solidGeometry = new THREE.BufferGeometry();
    
    // Direct buffer for all vertices
    const vertexPositions = [];
    
    // Add all vertices
    vertices.forEach(v => {
        vertexPositions.push(v[0], v[1], v[2]);
    });
    
    solidGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexPositions, 3));
    
    // Find all 3-vertex faces (triangles)
    const triangles = [];
    
    // Algorithm: find all possible 3-vertex combinations from edges
    // and check if they form a triangle (each vertex connected to the others by edges)
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            for (let k = j + 1; k < vertices.length; k++) {
                // Check if vertices i, j, k form a triangle
                const edgeIJ = edges.some(e => 
                    (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i));
                const edgeJK = edges.some(e => 
                    (e[0] === j && e[1] === k) || (e[0] === k && e[1] === j));
                const edgeKI = edges.some(e => 
                    (e[0] === k && e[1] === i) || (e[0] === i && e[1] === k));
                
                if (edgeIJ && edgeJK && edgeKI) {
                    triangles.push([i, j, k]);
                }
            }
        }
    }
    
    // If we didn't find any triangles, try a simpler approach:
    // Look for cycles of length 3 in the edges
    if (triangles.length === 0) {
        // Build an adjacency list for faster lookup
        const adjacencyList = {};
        
        vertices.forEach((_, index) => {
            adjacencyList[index] = [];
        });
        
        edges.forEach(edge => {
            const [a, b] = edge;
            adjacencyList[a] = adjacencyList[a] || [];
            adjacencyList[b] = adjacencyList[b] || [];
            adjacencyList[a].push(b);
            adjacencyList[b].push(a);
        });
        
        // For each edge, check if its endpoints have a common neighbor
        edges.forEach(edge => {
            const [a, b] = edge;
            const neighborsOfA = adjacencyList[a] || [];
            const neighborsOfB = adjacencyList[b] || [];
            
            // Find common neighbors
            for (const c of neighborsOfA) {
                if (c !== b && neighborsOfB.includes(c)) {
                    triangles.push([a, b, c]);
                }
            }
        });
    }
    
    // Set indices for the faces if we found any
    if (triangles.length > 0) {
        const indices = [];
        triangles.forEach(triangle => {
            indices.push(...triangle);
        });
        solidGeometry.setIndex(indices);
    } else {
        console.warn("No triangular faces found for model. Hidden line removal may not work correctly.");
    }
    
    // Compute normals for proper lighting
    solidGeometry.computeVertexNormals();
    
    // Create a shader material that shows white front faces and black back faces
    // With a debug mode that can be toggled to visualize front/back faces
    const faceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            debugMode: { value: false },
            faceColor: { value: new THREE.Color(color) }
        },
        vertexShader: `
            varying vec3 vNormal;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform bool debugMode;
            uniform vec3 faceColor;
            
            void main() {
                // Dot product with view direction (in view space Z is negative)
                float facing = dot(vNormal, vec3(0.0, 0.0, 1.0));
                
                if (debugMode) {
                    // Debug mode: show front faces in blue, back faces in red
                    // This helps us see which faces are front and back
                    if (facing > 0.0) {
                        gl_FragColor = vec4(0.0, 0.5, 1.0, 0.7); // Front: blue
                    } else {
                        gl_FragColor = vec4(1.0, 0.3, 0.3, 0.7); // Back: red
                    }
                } else {
                    // Normal wireframe mode with hidden back edges:
                    // Make all faces fully transparent but still write to depth buffer
                    // Front faces will still block edges behind them via depth testing
                    
                    if (facing <= 0.0) {
                        // Back faces are completely invisible
                        discard; // Don't render the pixel at all
                    } else {
                        // Front faces are transparent but still write to depth buffer
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    }
                }
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        depthWrite: true
    });
    
    // Create and add solid mesh
    const solidMesh = new THREE.Mesh(solidGeometry, faceMaterial);
    container.add(solidMesh);
    
    // Create wireframe - by default it will be white
    const wireframeColor = 0xffffff; // Always use white for wireframes
    
    const lineMaterial = new THREE.LineBasicMaterial({
        color: wireframeColor,
        depthTest: true,
        // No need for polygon offset since front faces are transparent
        linewidth: 1.0
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    
    edges.forEach(edge => {
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        linePositions.push(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]);
    });
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    
    const wireframe = new THREE.LineSegments(lineGeometry, lineMaterial);
    container.add(wireframe);
    
    return container;
}