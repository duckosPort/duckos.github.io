import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';
import Debug from '../Utils/Debug';

export default class CoffeeMug {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;
    debug: Debug;
    coffeeMug: THREE.Group;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.debug = this.application.debug;

        this.addCoffeeMug();
    }

    addCoffeeMug() {
        // Add coffee mug with its embedded textures
        this.coffeeMug = this.resources.items.gltfModel.coffeeMugModel.scene;

        // Initial scale
        this.coffeeMug.scale.set(128, 128, 128);

        // Initial position (next to the computer on the desk)
        this.coffeeMug.position.set(1990, -3250, 160);

        // Initial rotation
        this.coffeeMug.rotation.set(0.02, -2.7, 0.02);

        this.scene.add(this.coffeeMug);

        console.log('Coffee mug added to scene');
        console.log('Coffee mug position:', this.coffeeMug.position);
        console.log('Coffee mug scale:', this.coffeeMug.scale);

        // Debug controls
        if (this.debug.active) {
            const mugFolder = this.debug.ui.addFolder('Caneca de Café');

            // Position controls
            const positionFolder = mugFolder.addFolder('Posição');
            positionFolder.add(this.coffeeMug.position, 'x', -5000, 5000, 10).name('Posição X');
            positionFolder.add(this.coffeeMug.position, 'y', -5000, 5000, 10).name('Posição Y');
            positionFolder.add(this.coffeeMug.position, 'z', -5000, 5000, 10).name('Posição Z');

            // Rotation controls
            const rotationFolder = mugFolder.addFolder('Rotação');
            rotationFolder.add(this.coffeeMug.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotação X');
            rotationFolder.add(this.coffeeMug.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotação Y');
            rotationFolder.add(this.coffeeMug.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotação Z');

            // Scale controls
            const scaleFolder = mugFolder.addFolder('Tamanho (Escala)');

            // Uniform scale control
            const scaleParams = {
                uniformScale: 128
            };

            scaleFolder.add(scaleParams, 'uniformScale', 1, 500, 1)
                .name('Escala Uniforme')
                .onChange((value: number) => {
                    this.coffeeMug.scale.set(value, value, value);
                });

            // Individual axis scale controls
            scaleFolder.add(this.coffeeMug.scale, 'x', 1, 500, 1).name('Escala X');
            scaleFolder.add(this.coffeeMug.scale, 'y', 1, 500, 1).name('Escala Y');
            scaleFolder.add(this.coffeeMug.scale, 'z', 1, 500, 1).name('Escala Z');

            // Button to log values
            const logParams = {
                logValues: () => {
                    console.log('=== Valores da Caneca de Café ===');
                    console.log('Posição:', {
                        x: this.coffeeMug.position.x,
                        y: this.coffeeMug.position.y,
                        z: this.coffeeMug.position.z
                    });
                    console.log('Rotação:', {
                        x: this.coffeeMug.rotation.x,
                        y: this.coffeeMug.rotation.y,
                        z: this.coffeeMug.rotation.z
                    });
                    console.log('Escala:', {
                        x: this.coffeeMug.scale.x,
                        y: this.coffeeMug.scale.y,
                        z: this.coffeeMug.scale.z
                    });
                    console.log('================================');
                }
            };
            mugFolder.add(logParams, 'logValues').name('📋 Mostrar Valores no Log');

            // Open the folders by default
            mugFolder.open();
            positionFolder.open();
            scaleFolder.open();
        }
    }
}
