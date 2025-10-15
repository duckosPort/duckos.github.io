import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';

export default class Computer {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    model: THREE.Group;
    lights: THREE.Light[];

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.lights = [];

        this.setModel();
        this.addLighting();
        this.setupDebug();
    }

    setModel() {
        // Load the Commodore 64 model with its original textures
        const gltfModel = this.resources.items.gltfModel.computerSetupModel;
        this.model = gltfModel.scene;

        // Scale the model
        this.model.scale.set(436, 436, 436);

        // Position the model (move up and forward)
        this.model.position.set(0, 0, 325);

        // Traverse the model to ensure materials are properly set
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Ensure the material receives lighting
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });

        this.scene.add(this.model);

        // Separate and hide specific objects after adding to scene
        this.separateAndHideObjects();
    }

    addLighting() {
        // Add ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Add directional light from above and front
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(0, 1000, 500);
        this.scene.add(directionalLight1);
        this.lights.push(directionalLight1);

        // Add directional light from the side for better definition
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(500, 500, 0);
        this.scene.add(directionalLight2);
        this.lights.push(directionalLight2);

        // Add a point light near the computer for additional detail
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 2000);
        pointLight.position.set(0, 800, 400);
        this.scene.add(pointLight);
        this.lights.push(pointLight);
    }

    // Separate Object_14 and Object_15 into parts and hide specific ones
    separateAndHideObjects() {
        // Define which objects should be hidden by default
        const hiddenByDefault = [
            'Object_14_part1',
            'Object_14_part2',
            'Object_14_part4',
            'Object_14_part6',
            'Object_14_part7',
            'Object_15_part1',
            'Object_15_part2',
            'Object_15_part3',
            'Object_15_part4',
            'Object_15_part5',
            'Object_15_part6',
            'Object_15_part7',
            'Object_15_part8',
            'Object_15_part9',
            'Object_15_part10'
        ];

        // Find and separate Object_14 and Object_15
        const objectsToSeparate: { mesh: THREE.Mesh; name: string; parent: THREE.Object3D }[] = [];

        this.model.traverse((child) => {
            if (child === this.model) return;

            if (child instanceof THREE.Mesh &&
                (child.name === 'Object_14' || child.name === 'Object_15') &&
                child.parent) {
                objectsToSeparate.push({
                    mesh: child,
                    name: child.name,
                    parent: child.parent
                });
            }
        });

        // Separate the objects
        objectsToSeparate.forEach(({ mesh, name, parent }) => {
            const minVertices = name === 'Object_15' ? 50 : 10;
            const separatedMeshes = this.separateGeometry(mesh, name, minVertices);

            if (separatedMeshes.length > 1) {
                mesh.removeFromParent();
                separatedMeshes.forEach((separatedMesh) => {
                    parent.add(separatedMesh);

                    // Set initial visibility based on hiddenByDefault list
                    if (hiddenByDefault.includes(separatedMesh.name)) {
                        separatedMesh.visible = false;
                    }
                });
            }
        });
    }

    // Separate disconnected geometries into individual meshes
    separateGeometry(mesh: THREE.Mesh, baseName: string, minVertices: number = 10): THREE.Mesh[] {
        const geometry = mesh.geometry;
        const position = geometry.attributes.position;
        const normal = geometry.attributes.normal;
        const uv = geometry.attributes.uv;
        const index = geometry.index;

        if (!index) {
            console.warn(`Cannot separate ${baseName}: no index buffer`);
            return [mesh];
        }

        // Build adjacency list for vertices
        const vertexCount = position.count;
        const adjacency: Set<number>[] = Array.from({ length: vertexCount }, () => new Set());

        // For each triangle, mark vertices as connected
        for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i);
            const b = index.getX(i + 1);
            const c = index.getX(i + 2);

            adjacency[a].add(b);
            adjacency[a].add(c);
            adjacency[b].add(a);
            adjacency[b].add(c);
            adjacency[c].add(a);
            adjacency[c].add(b);
        }

        // Find connected components using DFS
        const visited = new Array(vertexCount).fill(false);
        const components: number[][] = [];

        const dfs = (vertex: number, component: number[]) => {
            visited[vertex] = true;
            component.push(vertex);

            for (const neighbor of adjacency[vertex]) {
                if (!visited[neighbor]) {
                    dfs(neighbor, component);
                }
            }
        };

        for (let i = 0; i < vertexCount; i++) {
            if (!visited[i] && adjacency[i].size > 0) {
                const component: number[] = [];
                dfs(i, component);
                components.push(component);
            }
        }

        console.log(`Found ${components.length} total components in ${baseName}`);

        // Filter out components with too few vertices
        const filteredComponents = components.filter(comp => comp.length >= minVertices);
        console.log(`Keeping ${filteredComponents.length} components (filtered out ${components.length - filteredComponents.length} small parts with < ${minVertices} vertices)`);

        // If only one significant component, return original mesh
        if (filteredComponents.length <= 1) {
            return [mesh];
        }

        // Create new meshes for each significant component
        const meshes: THREE.Mesh[] = [];

        filteredComponents.forEach((component, idx) => {
            const vertexMap = new Map<number, number>();
            const newPositions: number[] = [];
            const newNormals: number[] = [];
            const newUVs: number[] = [];
            const newIndices: number[] = [];

            // Collect vertices in this component
            component.forEach((oldIdx) => {
                if (!vertexMap.has(oldIdx)) {
                    const newIdx = vertexMap.size;
                    vertexMap.set(oldIdx, newIdx);

                    newPositions.push(
                        position.getX(oldIdx),
                        position.getY(oldIdx),
                        position.getZ(oldIdx)
                    );

                    if (normal) {
                        newNormals.push(
                            normal.getX(oldIdx),
                            normal.getY(oldIdx),
                            normal.getZ(oldIdx)
                        );
                    }

                    if (uv) {
                        newUVs.push(uv.getX(oldIdx), uv.getY(oldIdx));
                    }
                }
            });

            // Collect triangles that use vertices from this component
            for (let i = 0; i < index.count; i += 3) {
                const a = index.getX(i);
                const b = index.getX(i + 1);
                const c = index.getX(i + 2);

                if (vertexMap.has(a) && vertexMap.has(b) && vertexMap.has(c)) {
                    newIndices.push(
                        vertexMap.get(a)!,
                        vertexMap.get(b)!,
                        vertexMap.get(c)!
                    );
                }
            }

            // Create new geometry
            const newGeometry = new THREE.BufferGeometry();
            newGeometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(newPositions, 3)
            );

            if (newNormals.length > 0) {
                newGeometry.setAttribute(
                    'normal',
                    new THREE.Float32BufferAttribute(newNormals, 3)
                );
            }

            if (newUVs.length > 0) {
                newGeometry.setAttribute(
                    'uv',
                    new THREE.Float32BufferAttribute(newUVs, 2)
                );
            }

            newGeometry.setIndex(newIndices);

            // Create new mesh
            const newMesh = new THREE.Mesh(newGeometry, mesh.material);
            newMesh.name = `${baseName}_part${idx + 1}`;
            newMesh.position.copy(mesh.position);
            newMesh.rotation.copy(mesh.rotation);
            newMesh.scale.copy(mesh.scale);
            newMesh.castShadow = mesh.castShadow;
            newMesh.receiveShadow = mesh.receiveShadow;

            meshes.push(newMesh);
        });

        return meshes;
    }

    setupDebug() {
        if (!this.application.debug.active) return;

        const debugFolder = this.application.debug.ui.addFolder('Commodore 64 Objects');
        debugFolder.open();

        // Store all visual objects (not just meshes)
        const visualObjects: { [key: string]: THREE.Object3D } = {};
        let unnamedCount = 0;

        const scanAndAddObjects = () => {
            console.log('=== Scanning all objects in Commodore 64 model ===');

            // First pass: collect objects to separate (don't modify during traverse)
            const objectsToSeparate: { mesh: THREE.Mesh; name: string; parent: THREE.Object3D }[] = [];
            const normalObjects: { obj: THREE.Object3D; name: string }[] = [];

            // Traverse the model and collect ALL objects with visual representation
            this.model.traverse((child) => {
                // Skip root
                if (child === this.model) return;

                // Check for any object that has visual representation
                const isVisual =
                    child instanceof THREE.Mesh ||
                    child instanceof THREE.Line ||
                    child instanceof THREE.LineSegments ||
                    child instanceof THREE.LineLoop ||
                    child instanceof THREE.Points ||
                    child instanceof THREE.Sprite;

                if (isVisual) {
                    let objectName = child.name || `Unnamed_${unnamedCount++}`;

                    // Check if this object needs separation (Object_14 or Object_15)
                    if (child instanceof THREE.Mesh &&
                        (objectName === 'Object_14' || objectName === 'Object_15') &&
                        child.parent) {
                        // Mark for separation (do it later, not during traverse)
                        objectsToSeparate.push({
                            mesh: child,
                            name: objectName,
                            parent: child.parent
                        });
                    } else {
                        // Check if already in list
                        const alreadyAdded = Object.values(visualObjects).includes(child);
                        if (!alreadyAdded) {
                            // Avoid duplicate names
                            let finalName = objectName;
                            let counter = 1;
                            while (normalObjects.some(obj => obj.name === finalName) || visualObjects[finalName]) {
                                finalName = `${objectName}_${counter}`;
                                counter++;
                            }
                            normalObjects.push({ obj: child, name: finalName });
                        }
                    }
                }
            });

            // Define which objects should be hidden by default
            const hiddenByDefault = [
                'Object_14_part1',
                'Object_14_part2',
                'Object_14_part4',
                'Object_14_part6',
                'Object_14_part7',
                'Object_15_part1',
                'Object_15_part2',
                'Object_15_part3',
                'Object_15_part4',
                'Object_15_part5',
                'Object_15_part6',
                'Object_15_part7',
                'Object_15_part8',
                'Object_15_part9',
                'Object_15_part10'
            ];

            // Second pass: now it's safe to separate objects
            objectsToSeparate.forEach(({ mesh, name, parent }) => {
                console.log(`Attempting to separate ${name}...`);

                // Use different minimum vertex thresholds for different objects
                // Object_15 needs higher threshold to filter out very small parts
                const minVertices = name === 'Object_15' ? 50 : 10;
                const separatedMeshes = this.separateGeometry(mesh, name, minVertices);

                if (separatedMeshes.length > 1) {
                    mesh.removeFromParent();
                    separatedMeshes.forEach((separatedMesh) => {
                        parent.add(separatedMesh);

                        // Set initial visibility based on hiddenByDefault list
                        if (hiddenByDefault.includes(separatedMesh.name)) {
                            separatedMesh.visible = false;
                            console.log(`Added separated: ${separatedMesh.name} (Mesh) - HIDDEN by default`);
                        } else {
                            console.log(`Added separated: ${separatedMesh.name} (Mesh) - visible`);
                        }

                        visualObjects[separatedMesh.name] = separatedMesh;
                    });
                } else {
                    visualObjects[name] = mesh;
                    console.log(`Added: ${name} (Mesh) - could not separate`);
                }
            });

            // Third pass: add normal objects
            normalObjects.forEach(({ obj, name }) => {
                visualObjects[name] = obj;
                console.log(`Added: ${name} (${obj.type})`, {
                    type: obj.type,
                    visible: obj.visible,
                    object: obj
                });
            });

            console.log('=== Scan complete ===');
            console.log(`Total visual objects: ${Object.keys(visualObjects).length}`);
        };

        // Initial scan
        scanAndAddObjects();

        // Store controllers for toggles
        const toggleControllers: any[] = [];

        // Function to create/update toggles
        const updateToggles = () => {
            // Remove all existing toggle controllers
            toggleControllers.forEach((c) => c.destroy());
            toggleControllers.length = 0;

            // Create toggles for each object
            Object.entries(visualObjects).forEach(([name, obj]) => {
                const toggleParams = {
                    visible: obj.visible
                };

                const controller = debugFolder
                    .add(toggleParams, 'visible')
                    .name(`${name} (${obj.type})`)
                    .onChange((value: boolean) => {
                        obj.visible = value;
                        console.log(`${name} visibility: ${value}`);
                    });

                toggleControllers.push(controller);
            });

            console.log(`Added ${Object.keys(visualObjects).length} object toggles to debug panel`);
        };

        // Create initial toggles
        updateToggles();

        // Add utility buttons
        const controls = {
            rescan: () => {
                console.log('🔄 Rescanning for new objects...');
                const beforeCount = Object.keys(visualObjects).length;
                scanAndAddObjects();
                const afterCount = Object.keys(visualObjects).length;
                const newCount = afterCount - beforeCount;

                if (newCount > 0) {
                    console.log(`✅ Found ${newCount} new object(s)! Updating toggles...`);
                    updateToggles();
                } else {
                    console.log('ℹ️ No new objects found.');
                }
            },
            hideAll: () => {
                Object.values(visualObjects).forEach((obj) => {
                    obj.visible = false;
                });
                debugFolder.controllersRecursive().forEach((c) => c.updateDisplay());
                console.log('All objects hidden');
            },
            showAll: () => {
                Object.values(visualObjects).forEach((obj) => {
                    obj.visible = true;
                });
                debugFolder.controllersRecursive().forEach((c) => c.updateDisplay());
                console.log('All objects shown');
            },
            listVisible: () => {
                console.log('=== CHECKING VISIBLE OBJECTS ===');

                const visibleObjectsList: any[] = [];
                const hiddenObjectsList: any[] = [];

                // Check all objects in the entire model
                this.model.traverse((child) => {
                    if (child === this.model) return; // Skip root

                    const isVisualType =
                        child instanceof THREE.Mesh ||
                        child instanceof THREE.Line ||
                        child instanceof THREE.LineSegments ||
                        child instanceof THREE.LineLoop ||
                        child instanceof THREE.Points ||
                        child instanceof THREE.Sprite;

                    if (isVisualType) {
                        const info = {
                            name: child.name || 'Unnamed',
                            type: child.type,
                            visible: child.visible,
                            inToggleList: Object.values(visualObjects).includes(child),
                            object: child
                        };

                        if (child.visible) {
                            visibleObjectsList.push(info);
                        } else {
                            hiddenObjectsList.push(info);
                        }
                    }
                });

                console.log(`%c✅ VISIBLE OBJECTS (${visibleObjectsList.length}):`, 'color: green; font-weight: bold; font-size: 14px');
                visibleObjectsList.forEach((info, index) => {
                    const inList = info.inToggleList ? '✓ in list' : '⚠️ NOT IN LIST';
                    console.log(`  ${index + 1}. ${info.name} (${info.type}) - ${inList}`, info.object);
                });

                console.log(`%c❌ HIDDEN OBJECTS (${hiddenObjectsList.length}):`, 'color: red; font-weight: bold; font-size: 14px');
                hiddenObjectsList.forEach((info, index) => {
                    const inList = info.inToggleList ? '✓ in list' : '⚠️ NOT IN LIST';
                    console.log(`  ${index + 1}. ${info.name} (${info.type}) - ${inList}`, info.object);
                });

                // Check for objects not in toggle list but visible
                const visibleButNotInList = visibleObjectsList.filter(obj => !obj.inToggleList);
                if (visibleButNotInList.length > 0) {
                    console.log(`%c⚠️ WARNING: ${visibleButNotInList.length} objects are VISIBLE but NOT in toggle list!`, 'color: orange; font-weight: bold; font-size: 14px');
                    visibleButNotInList.forEach((info, index) => {
                        console.log(`  ${index + 1}. ${info.name} (${info.type})`, info.object);
                    });
                    console.log('%cℹ️ TIP: Click "🔄 Rescan Objects" to add missing objects to the toggle list.', 'color: blue; font-weight: bold;');
                }

                console.log('=== END OF VISIBILITY CHECK ===');
            }
        };

        debugFolder.add(controls, 'rescan').name('🔄 Rescan Objects');
        debugFolder.add(controls, 'hideAll').name('🚫 Hide All');
        debugFolder.add(controls, 'showAll').name('👁️ Show All');
        debugFolder.add(controls, 'listVisible').name('📋 List Visible in Console');
    }
}
