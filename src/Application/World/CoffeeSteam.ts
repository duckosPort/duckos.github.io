import * as THREE from 'three';
import Application from '../Application';
import Resources from '../Utils/Resources';
import Time from '../Utils/Time';
import Debug from '../Utils/Debug';

// @ts-ignore
import fragmentShader from '../Shaders/coffee/fragment.glsl';
// @ts-ignore
import vertexShader from '../Shaders/coffee/vertex.glsl';

export default class CoffeeSteam {
    model: any;
    application: Application;
    resources: Resources;
    scene: THREE.Scene;
    time: Time;
    debug: Debug;

    constructor() {
        this.application = new Application();
        this.resources = this.application.resources;
        this.scene = this.application.scene;
        this.time = this.application.time;
        this.debug = this.application.debug;

        this.setModel();
    }

    setModel() {
        this.model = {};

        this.model.color = '#c9c9c9';

        // Material
        this.model.material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uTimeFrequency: { value: 0.001 },
                uUvFrequency: { value: new THREE.Vector2(3, 5) },
                uColor: { value: new THREE.Color(this.model.color) },
            },
        });

        this.model.mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(280, 700),
            this.model.material
        );

        this.model.mesh.position.copy(new THREE.Vector3(1600, 680, 1600));
        this.model.mesh.scale.set(1, 1.5, 1);

        this.scene.add(this.model.mesh);

        // Debug controls
        if (this.debug.active) {
            const steamFolder = this.debug.ui.addFolder('Fumaça do Café');

            // Position controls
            const positionFolder = steamFolder.addFolder('Posição');
            positionFolder.add(this.model.mesh.position, 'x', -5000, 5000, 10).name('Posição X');
            positionFolder.add(this.model.mesh.position, 'y', -5000, 5000, 10).name('Posição Y');
            positionFolder.add(this.model.mesh.position, 'z', -5000, 5000, 10).name('Posição Z');

            // Rotation controls
            const rotationFolder = steamFolder.addFolder('Rotação');
            rotationFolder.add(this.model.mesh.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotação X');
            rotationFolder.add(this.model.mesh.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotação Y');
            rotationFolder.add(this.model.mesh.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotação Z');

            // Scale controls
            const scaleFolder = steamFolder.addFolder('Tamanho (Escala)');

            // Uniform scale control
            const scaleParams = {
                uniformScale: 1.5
            };

            scaleFolder.add(scaleParams, 'uniformScale', 0.1, 5, 0.1)
                .name('Escala Uniforme')
                .onChange((value: number) => {
                    this.model.mesh.scale.set(value, value, value);
                });

            // Individual axis scale controls
            scaleFolder.add(this.model.mesh.scale, 'x', 0.1, 5, 0.1).name('Escala X');
            scaleFolder.add(this.model.mesh.scale, 'y', 0.1, 5, 0.1).name('Escala Y');
            scaleFolder.add(this.model.mesh.scale, 'z', 0.1, 5, 0.1).name('Escala Z');

            // Button to log values
            const logParams = {
                logValues: () => {
                    console.log('=== Valores da Fumaça do Café ===');
                    console.log('Posição:', {
                        x: this.model.mesh.position.x,
                        y: this.model.mesh.position.y,
                        z: this.model.mesh.position.z
                    });
                    console.log('Rotação:', {
                        x: this.model.mesh.rotation.x,
                        y: this.model.mesh.rotation.y,
                        z: this.model.mesh.rotation.z
                    });
                    console.log('Escala:', {
                        x: this.model.mesh.scale.x,
                        y: this.model.mesh.scale.y,
                        z: this.model.mesh.scale.z
                    });
                    console.log('=================================');
                }
            };
            steamFolder.add(logParams, 'logValues').name('📋 Mostrar Valores no Log');

            // Open the folders by default
            steamFolder.open();
            positionFolder.open();
            scaleFolder.open();
        }
    }

    update() {
        this.model.material.uniforms.uTime.value = this.time.elapsed;
    }
}
