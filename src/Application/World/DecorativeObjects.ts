import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';

interface DecorObject {
    name: string;
    model: THREE.Group;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
}

export default class DecorativeObjects {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    objects: Map<string, DecorObject>;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    camera: THREE.Camera;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.objects = new Map();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.camera = this.application.camera.instance;

        this.setupObjects();
        this.setupClickInteraction();
        this.setupDebug();
    }

    setupObjects() {
        const objectConfigs = [
            {
                name: 'Water Flask',
                resourceKey: 'waterFlaskModel',
                position: { x: 2720, y: 0, z: 1880 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 265, y: 265, z: 265 },
            },
            {
                name: 'Desk Lamp',
                resourceKey: 'deskLampModel',
                position: { x: -2320, y: 0, z: 2440 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 349, y: 349, z: 349 },
            },
            {
                name: 'Duck',
                resourceKey: 'duckModel',
                position: { x: -2880, y: -40, z: 200 },
                rotation: { x: THREE.MathUtils.degToRad(-1), y: THREE.MathUtils.degToRad(140), z: 0 },
                scale: { x: 2000, y: 2000, z: 2000 },
            },
            {
                name: 'Guitar',
                resourceKey: 'guitarModel',
                position: { x: 4121.75, y: -2596.23, z: 3561.92 },
                rotation: { x: THREE.MathUtils.degToRad(-1), y: THREE.MathUtils.degToRad(84), z: THREE.MathUtils.degToRad(4) },
                scale: { x: 4440.28, y: 4440.28, z: 4440.28 },
            },
            {
                name: 'Headphones',
                resourceKey: 'headphoneModel',
                position: { x: 2720, y: -40, z: 200 },
                rotation: { x: 0, y: THREE.MathUtils.degToRad(-52), z: 0 },
                scale: { x: 2000, y: 2000, z: 2000 },
            },
            {
                name: 'Gaming Chair',
                resourceKey: 'gamingChairModel',
                position: { x: 1320, y: -3120, z: 2720 },
                rotation: { x: 0, y: THREE.MathUtils.degToRad(-148), z: 0 },
                scale: { x: 3950.52, y: 3950.52, z: 3950.52 },
            },
            {
                name: 'Palm Plant',
                resourceKey: 'palmPlantModel',
                position: { x: -4280, y: -3120, z: -200 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 14, y: 14, z: 14 },
            },
            {
                name: 'Xbox Controller',
                resourceKey: 'xboxControllerModel',
                position: { x: -1760, y: 100, z: 1320 },
                rotation: { x: 0, y: THREE.MathUtils.degToRad(-132), z: 0 },
                scale: { x: 60, y: 60, z: 60 },
            },
            {
                name: 'Fox',
                resourceKey: 'foxModel',
                position: { x: -2876.15, y: 0, z: 762.76 },
                rotation: { x: 0, y: THREE.MathUtils.degToRad(69.20), z: 0 },
                scale: { x: 100, y: 100, z: 100 },
            },
        ];

        objectConfigs.forEach((config) => {
            const gltfModel = this.resources.items.gltfModel[config.resourceKey];
            if (!gltfModel) {
                console.warn(`Model ${config.resourceKey} not found`);
                return;
            }

            const model = gltfModel.scene.clone();
            model.position.set(config.position.x, config.position.y, config.position.z);
            model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
            model.scale.set(config.scale.x, config.scale.y, config.scale.z);

            // Traverse to ensure materials are set up correctly
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });

            this.scene.add(model);

            this.objects.set(config.name, {
                name: config.name,
                model: model,
                position: model.position,
                rotation: model.rotation,
                scale: model.scale,
            });

            console.log(`Added decorative object: ${config.name}`);
        });
    }

    setupClickInteraction() {
        // Handle mouse click events
        const handleClick = (event: MouseEvent) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update raycaster with camera and mouse position
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Get all meshes from all objects
            const allMeshes: THREE.Mesh[] = [];
            this.objects.forEach((obj) => {
                obj.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        allMeshes.push(child);
                    }
                });
            });

            // Check for intersections
            const intersects = this.raycaster.intersectObjects(allMeshes, false);

            if (intersects.length > 0) {
                // Find which object was clicked
                const clickedMesh = intersects[0].object;

                // Find the parent decorative object
                this.objects.forEach((obj, name) => {
                    let found = false;
                    obj.model.traverse((child) => {
                        if (child === clickedMesh) {
                            found = true;
                        }
                    });

                    if (found) {
                        this.handleObjectClick(name);
                    }
                });
            }
        };

        // Add click event listener
        window.addEventListener('click', handleClick);
    }

    handleObjectClick(objectName: string) {
        console.log(`Clicked on: ${objectName}`);

        // Play sound based on object
        if (objectName === 'Duck') {
            this.playSound('duckSound');
        } else if (objectName === 'Fox') {
            this.playSound('foxSqueak');
        }
    }

    playSound(soundName: string) {
        const audioBuffer = this.resources.items.audio[soundName];
        if (!audioBuffer) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }

        // Create an audio context if it doesn't exist
        if (!this.application.audioContext) {
            this.application.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const audioContext = this.application.audioContext;

        // Create a buffer source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);

        console.log(`Playing sound: ${soundName}`);
    }

    setupDebug() {
        if (!this.application.debug.active) return;

        const debugFolder = this.application.debug.ui.addFolder('Decorative Objects');

        this.objects.forEach((obj, name) => {
            const objFolder = debugFolder.addFolder(name);

            // Visibility toggle
            const visibilityParams = { visible: obj.model.visible };
            objFolder
                .add(visibilityParams, 'visible')
                .name('Visible')
                .onChange((value: boolean) => {
                    obj.model.visible = value;
                });

            // Position controls
            const posFolder = objFolder.addFolder('Position');
            posFolder
                .add(obj.position, 'x', -10000, 10000, 0.01)
                .name('X')
                .onChange(() => this.logStatus(name));
            posFolder
                .add(obj.position, 'y', -10000, 10000, 0.01)
                .name('Y')
                .onChange(() => this.logStatus(name));
            posFolder
                .add(obj.position, 'z', -10000, 10000, 0.01)
                .name('Z')
                .onChange(() => this.logStatus(name));

            // Rotation controls (in degrees for user-friendliness)
            const rotFolder = objFolder.addFolder('Rotation');
            const rotationDegrees = {
                x: THREE.MathUtils.radToDeg(obj.rotation.x),
                y: THREE.MathUtils.radToDeg(obj.rotation.y),
                z: THREE.MathUtils.radToDeg(obj.rotation.z),
            };
            rotFolder
                .add(rotationDegrees, 'x', -180, 180, 0.1)
                .name('X (deg)')
                .onChange((value: number) => {
                    obj.rotation.x = THREE.MathUtils.degToRad(value);
                    this.logStatus(name);
                });
            rotFolder
                .add(rotationDegrees, 'y', -180, 180, 0.1)
                .name('Y (deg)')
                .onChange((value: number) => {
                    obj.rotation.y = THREE.MathUtils.degToRad(value);
                    this.logStatus(name);
                });
            rotFolder
                .add(rotationDegrees, 'z', -180, 180, 0.1)
                .name('Z (deg)')
                .onChange((value: number) => {
                    obj.rotation.z = THREE.MathUtils.degToRad(value);
                    this.logStatus(name);
                });

            // Scale controls
            const scaleFolder = objFolder.addFolder('Scale');
            const uniformScale = { value: obj.scale.x };
            scaleFolder
                .add(uniformScale, 'value', 1, 5000, 0.01)
                .name('Uniform')
                .onChange((value: number) => {
                    obj.scale.set(value, value, value);
                    this.logStatus(name);
                });
            scaleFolder
                .add(obj.scale, 'x', 1, 5000, 0.01)
                .name('X')
                .onChange(() => this.logStatus(name));
            scaleFolder
                .add(obj.scale, 'y', 1, 5000, 0.01)
                .name('Y')
                .onChange(() => this.logStatus(name));
            scaleFolder
                .add(obj.scale, 'z', 1, 5000, 0.01)
                .name('Z')
                .onChange(() => this.logStatus(name));

            // Log status button
            const controls = {
                logStatus: () => this.logStatus(name),
            };
            objFolder.add(controls, 'logStatus').name('📋 Log Status to Console');
        });

        // Global controls
        const globalControls = {
            hideAll: () => {
                this.objects.forEach((obj) => {
                    obj.model.visible = false;
                });
                debugFolder.controllersRecursive().forEach((c) => c.updateDisplay());
                console.log('All decorative objects hidden');
            },
            showAll: () => {
                this.objects.forEach((obj) => {
                    obj.model.visible = true;
                });
                debugFolder.controllersRecursive().forEach((c) => c.updateDisplay());
                console.log('All decorative objects shown');
            },
            logAllStatus: () => {
                console.log('=== DECORATIVE OBJECTS STATUS ===');
                this.objects.forEach((obj, name) => {
                    this.logStatus(name);
                });
                console.log('=== END OF STATUS ===');
            },
        };

        debugFolder.add(globalControls, 'hideAll').name('🚫 Hide All');
        debugFolder.add(globalControls, 'showAll').name('👁️ Show All');
        debugFolder.add(globalControls, 'logAllStatus').name('📋 Log All Status');
    }

    logStatus(objectName: string) {
        const obj = this.objects.get(objectName);
        if (!obj) return;

        console.log(`%c=== ${objectName} STATUS ===`, 'color: cyan; font-weight: bold; font-size: 14px');
        console.log(`Position: { x: ${obj.position.x.toFixed(2)}, y: ${obj.position.y.toFixed(2)}, z: ${obj.position.z.toFixed(2)} }`);
        console.log(
            `Rotation: { x: ${THREE.MathUtils.radToDeg(obj.rotation.x).toFixed(2)}°, y: ${THREE.MathUtils.radToDeg(obj.rotation.y).toFixed(2)}°, z: ${THREE.MathUtils.radToDeg(obj.rotation.z).toFixed(2)}° }`
        );
        console.log(`Scale: { x: ${obj.scale.x.toFixed(2)}, y: ${obj.scale.y.toFixed(2)}, z: ${obj.scale.z.toFixed(2)} }`);
        console.log(`Visible: ${obj.model.visible}`);
        console.log('Object:', obj.model);
    }
}
