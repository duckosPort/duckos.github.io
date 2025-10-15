import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';
import Debug from '../Utils/Debug';

export default class Environment {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    skybox: THREE.Group;
    officeDesk: THREE.Group;
    debug: Debug;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.debug = this.application.debug;

        this.setModel();
        this.addOfficeDesk();
    }

    setModel() {
        // Load skybox with its embedded textures
        this.skybox = this.resources.items.gltfModel.environmentModel.scene;

        // Initial scale and position
        this.skybox.scale.set(8380, 8380, 8380);
        this.skybox.position.set(0, 0, 0);

        // Traverse and ensure materials are properly set
        this.skybox.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Ensure the material receives lighting and is double-sided
                if (child.material) {
                    child.material.side = THREE.DoubleSide;
                    child.material.needsUpdate = true;
                }
                console.log('Skybox mesh found:', child.name);
            }
        });

        this.scene.add(this.skybox);
        console.log('Skybox added to scene');
        console.log('Skybox position:', this.skybox.position);
        console.log('Skybox scale:', this.skybox.scale);

        // Debug controls
        if (this.debug.active) {
            const skyboxFolder = this.debug.ui.addFolder('Skybox');

            // Position controls
            const positionFolder = skyboxFolder.addFolder('Posição');
            positionFolder.add(this.skybox.position, 'x', -50000, 50000, 100).name('Posição X');
            positionFolder.add(this.skybox.position, 'y', -50000, 50000, 100).name('Posição Y');
            positionFolder.add(this.skybox.position, 'z', -50000, 50000, 100).name('Posição Z');

            // Rotation controls
            const rotationFolder = skyboxFolder.addFolder('Rotação');
            rotationFolder.add(this.skybox.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotação X');
            rotationFolder.add(this.skybox.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotação Y');
            rotationFolder.add(this.skybox.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotação Z');

            // Scale controls
            const scaleFolder = skyboxFolder.addFolder('Tamanho (Escala)');

            // Uniform scale control
            const scaleParams = {
                uniformScale: 1
            };

            scaleFolder.add(scaleParams, 'uniformScale', 0.1, 100000, 10)
                .name('Escala Uniforme')
                .onChange((value: number) => {
                    this.skybox.scale.set(value, value, value);
                });

            // Individual axis scale controls
            scaleFolder.add(this.skybox.scale, 'x', 0.1, 100000, 10).name('Escala X');
            scaleFolder.add(this.skybox.scale, 'y', 0.1, 100000, 10).name('Escala Y');
            scaleFolder.add(this.skybox.scale, 'z', 0.1, 100000, 10).name('Escala Z');

            // Button to log values
            const logParams = {
                logValues: () => {
                    console.log('=== Valores do Skybox ===');
                    console.log('Posição:', {
                        x: this.skybox.position.x,
                        y: this.skybox.position.y,
                        z: this.skybox.position.z
                    });
                    console.log('Rotação:', {
                        x: this.skybox.rotation.x,
                        y: this.skybox.rotation.y,
                        z: this.skybox.rotation.z
                    });
                    console.log('Escala:', {
                        x: this.skybox.scale.x,
                        y: this.skybox.scale.y,
                        z: this.skybox.scale.z
                    });
                    console.log('========================');
                }
            };
            skyboxFolder.add(logParams, 'logValues').name('📋 Mostrar Valores no Log');

            // Open the folders by default
            skyboxFolder.open();
            positionFolder.open();
            scaleFolder.open();
        }
    }

    addOfficeDesk() {
        // Add office desk with its embedded textures
        this.officeDesk = this.resources.items.gltfModel.officeDeskModel.scene;

        // Scale the desk
        this.officeDesk.scale.set(2480, 3390, 4950);

        // Position the desk
        this.officeDesk.position.set(50, -3090, 2410);

        this.scene.add(this.officeDesk);

        console.log('Office desk added to scene');
        console.log('Office desk position:', this.officeDesk.position);
        console.log('Office desk scale:', this.officeDesk.scale);

        // Debug controls
        if (this.debug.active) {
            const deskFolder = this.debug.ui.addFolder('Mesa (Office Desk)');

            // Position controls
            const positionFolder = deskFolder.addFolder('Posição');
            positionFolder.add(this.officeDesk.position, 'x', -10000, 10000, 10).name('Posição X');
            positionFolder.add(this.officeDesk.position, 'y', -10000, 10000, 10).name('Posição Y');
            positionFolder.add(this.officeDesk.position, 'z', -10000, 10000, 10).name('Posição Z');

            // Scale controls
            const scaleFolder = deskFolder.addFolder('Tamanho (Escala)');

            // Uniform scale control
            const scaleParams = {
                uniformScale: 2480
            };

            scaleFolder.add(scaleParams, 'uniformScale', 100, 10000, 10)
                .name('Escala Uniforme')
                .onChange((value: number) => {
                    this.officeDesk.scale.set(value, value, value);
                });

            // Individual axis scale controls
            scaleFolder.add(this.officeDesk.scale, 'x', 100, 10000, 10).name('Escala X');
            scaleFolder.add(this.officeDesk.scale, 'y', 100, 10000, 10).name('Escala Y');
            scaleFolder.add(this.officeDesk.scale, 'z', 100, 10000, 10).name('Escala Z');

            // Button to log values
            const logParams = {
                logValues: () => {
                    console.log('=== Valores da Mesa (Office Desk) ===');
                    console.log('Posição:', {
                        x: this.officeDesk.position.x,
                        y: this.officeDesk.position.y,
                        z: this.officeDesk.position.z
                    });
                    console.log('Escala:', {
                        x: this.officeDesk.scale.x,
                        y: this.officeDesk.scale.y,
                        z: this.officeDesk.scale.z
                    });
                    console.log('====================================');
                }
            };
            deskFolder.add(logParams, 'logValues').name('📋 Mostrar Valores no Log');

            // Open the folders by default
            deskFolder.open();
            positionFolder.open();
            scaleFolder.open();
        }
    }

    update() {}
}
