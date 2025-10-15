import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import GUI from 'lil-gui';
import Application from '../Application';
import Debug from '../Utils/Debug';
import Resources from '../Utils/Resources';
import Sizes from '../Utils/Sizes';
import Camera from '../Camera/Camera';
import EventEmitter from '../Utils/EventEmitter';

const SCREEN_SIZE = { w: 1340, h: 970 };
let CURVE_STRENGTH_X = 40;
let CURVE_STRENGTH_Y = 25;
let TEXTURE_OFFSET_SCALE = 0.5;
const IFRAME_PADDING = 0;
const IFRAME_SIZE = {
    w: SCREEN_SIZE.w - IFRAME_PADDING,
    h: SCREEN_SIZE.h - IFRAME_PADDING,
};

export default class MonitorScreen extends EventEmitter {
    application: Application;
    scene: THREE.Scene;
    cssScene: THREE.Scene;
    resources: Resources;
    debug: Debug;
    sizes: Sizes;
    debugFolder: GUI;
    screenSize: THREE.Vector2;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    camera: Camera;
    prevInComputer: boolean;
    shouldLeaveMonitor: boolean;
    inComputer: boolean;
    mouseClickInProgress: boolean;
    dimmingPlane: THREE.Mesh;
    videoTextures: { [key in string]: THREE.VideoTexture };

    constructor() {
        super();
        this.application = new Application();
        this.scene = this.application.scene;
        this.cssScene = this.application.cssScene;
        this.sizes = this.application.sizes;
        this.resources = this.application.resources;
        this.debug = this.application.debug;
        this.screenSize = new THREE.Vector2(SCREEN_SIZE.w, SCREEN_SIZE.h);
        this.camera = this.application.camera;
        this.position = new THREE.Vector3(-4, 984, 242);
        this.rotation = new THREE.Euler(-0.2 * THREE.MathUtils.DEG2RAD, 0, 0);
        this.videoTextures = {};
        this.mouseClickInProgress = false;
        this.shouldLeaveMonitor = false;

        // Create screen
        this.initializeScreenEvents();
        this.createIframe();
        const maxOffset = this.createTextureLayers();
        this.createEnclosingPlanes(maxOffset);
        this.createPerspectiveDimmer(maxOffset);

        // Debug controls - only on #debug endpoint
        if (this.debug.active) {
            this.setupDebugControls();
        }
    }

    setupDebugControls() {
        // Create debug GUI
        const gui = new GUI();

        // Position GUI in bottom left corner
        gui.domElement.style.position = 'fixed';
        gui.domElement.style.top = 'auto';
        gui.domElement.style.bottom = '10px';
        gui.domElement.style.right = 'auto';
        gui.domElement.style.left = '10px';
        gui.domElement.style.zIndex = '10000';

        // Make title bar more obvious for dragging
        const titleBar = gui.domElement.querySelector('.title');
        if (titleBar) {
            (titleBar as HTMLElement).style.cursor = 'move';
            (titleBar as HTMLElement).style.userSelect = 'none';
            (titleBar as HTMLElement).title = 'Drag to move panel';
        }

        // Enable dragging functionality
        this.makeDraggable(gui.domElement);

        const screenFolder = gui.addFolder('Screen Position & Size');

        const settings = {
            posX: this.position.x,
            posY: this.position.y,
            posZ: this.position.z,
            rotX: this.rotation.x * (180 / Math.PI),
            width: SCREEN_SIZE.w,
            height: SCREEN_SIZE.h,
            curveX: CURVE_STRENGTH_X,
            curveY: CURVE_STRENGTH_Y,
            textureOffset: TEXTURE_OFFSET_SCALE
        };

        screenFolder.add(settings, 'posX', -500, 500, 1).onChange((value: number) => {
            this.position.x = value;
            this.updateScreenPosition();
        });

        screenFolder.add(settings, 'posY', 500, 1500, 1).onChange((value: number) => {
            this.position.y = value;
            this.updateScreenPosition();
        });

        screenFolder.add(settings, 'posZ', 0, 500, 1).onChange((value: number) => {
            this.position.z = value;
            this.updateScreenPosition();
        });

        screenFolder.add(settings, 'rotX', -30, 30, 0.1).onChange((value: number) => {
            this.rotation.x = value * (Math.PI / 180);
            this.updateScreenPosition();
        });

        screenFolder.add(settings, 'width', 800, 1600, 10).onChange((value: number) => {
            this.screenSize.width = value;
            this.updateScreenSize();
        });

        screenFolder.add(settings, 'height', 600, 1200, 10).onChange((value: number) => {
            this.screenSize.height = value;
            this.updateScreenSize();
        });

        screenFolder.add(settings, 'curveX', 0, 200, 1).name('Curve Horizontal').onChange((value: number) => {
            CURVE_STRENGTH_X = value;
            this.updateScreenSize();
        });

        screenFolder.add(settings, 'curveY', 0, 200, 1).name('Curve Vertical').onChange((value: number) => {
            CURVE_STRENGTH_Y = value;
            this.updateScreenSize();
        });

        screenFolder.add(settings, 'textureOffset', 0, 10, 0.1).name('Texture Distance').onChange((value: number) => {
            TEXTURE_OFFSET_SCALE = value;
            this.updateTextureOffsets();
        });

        screenFolder.open();

        // Add button to log current values
        const logButton = { log: () => {
            console.log('Current Screen Settings:');
            console.log(`Position: x: ${this.position.x}, y: ${this.position.y}, z: ${this.position.z}`);
            console.log(`Rotation: ${this.rotation.x * (180 / Math.PI)} degrees`);
            console.log(`Size: ${this.screenSize.width} x ${this.screenSize.height}`);
            console.log(`Curvature: X: ${CURVE_STRENGTH_X}, Y: ${CURVE_STRENGTH_Y}`);
            console.log(`Texture Offset Scale: ${TEXTURE_OFFSET_SCALE}`);
        }};
        screenFolder.add(logButton, 'log').name('Log Values to Console');
    }

    makeDraggable(element: HTMLElement) {
        let isDragging = false;
        let currentX: number;
        let currentY: number;
        let initialX: number;
        let initialY: number;

        const titleBar = element.querySelector('.title') as HTMLElement;
        if (!titleBar) return;

        titleBar.addEventListener('mousedown', (e: MouseEvent) => {
            isDragging = true;
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                element.style.left = currentX + 'px';
                element.style.top = currentY + 'px';
                element.style.bottom = 'auto';
                element.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    updateScreenPosition() {
        // Update all screen elements
        this.cssScene.children.forEach((child) => {
            if (child instanceof CSS3DObject) {
                child.position.copy(this.position);
                child.rotation.copy(this.rotation);
            }
        });

        // Update GL scene elements
        this.scene.children.forEach((child) => {
            if (child.userData && child.userData.isScreenElement) {
                const mesh = child as THREE.Mesh;

                // If element has a z-offset (like texture layers), apply it
                if (typeof child.userData.zOffset !== 'undefined') {
                    const offset = child.userData.zOffset;
                    mesh.position.copy(
                        this.offsetPosition(this.position, new THREE.Vector3(0, 0, offset))
                    );
                } else {
                    mesh.position.copy(this.position);
                }

                mesh.rotation.copy(this.rotation);
            }
        });
    }

    updateTextureOffsets() {
        // Base offsets for each texture type
        const baseOffsets: { [key: string]: number } = {
            smudge: 24,
            innerShadow: 5,
            video: 10,
            video2: 15
        };

        // Update all texture layers
        this.scene.children.forEach((child) => {
            if (child.userData && child.userData.isScreenElement && child.userData.zOffset !== undefined && child.userData.zOffset !== 0) {
                const mesh = child as THREE.Mesh;

                // Find which texture this is based on approximate offset
                let baseOffset = 0;
                const currentBaseOffset = child.userData.zOffset / (child.userData.originalScale || 4);

                // Match to closest base offset
                for (const [key, value] of Object.entries(baseOffsets)) {
                    if (Math.abs(currentBaseOffset - value) < 2) {
                        baseOffset = value;
                        break;
                    }
                }

                if (baseOffset > 0) {
                    // Calculate new offset with current scale factor
                    const newOffset = baseOffset * TEXTURE_OFFSET_SCALE;
                    child.userData.zOffset = newOffset;
                    child.userData.originalScale = TEXTURE_OFFSET_SCALE;

                    // Update position
                    mesh.position.copy(
                        this.offsetPosition(this.position, new THREE.Vector3(0, 0, newOffset))
                    );
                }
            }
        });

        // Update dimming plane if it exists
        if (this.dimmingPlane) {
            const maxOffset = Math.max(...Object.values(baseOffsets)) * TEXTURE_OFFSET_SCALE;
            const newDimOffset = maxOffset - 5;
            this.dimmingPlane.userData.zOffset = newDimOffset;
            this.dimmingPlane.position.copy(
                this.offsetPosition(this.position, new THREE.Vector3(0, 0, newDimOffset))
            );
        }
    }

    updateScreenSize() {
        // Update CSS3D container and iframe size
        this.cssScene.children.forEach((child) => {
            if (child instanceof CSS3DObject) {
                const element = child.element as HTMLElement;
                element.style.width = this.screenSize.width + 'px';
                element.style.height = this.screenSize.height + 'px';

                // Update iframe inside container
                const iframe = element.querySelector('iframe');
                if (iframe) {
                    iframe.style.width = this.screenSize.width + 'px';
                    iframe.style.height = this.screenSize.height + 'px';
                }
            }
        });

        // Update GL plane geometries
        this.scene.children.forEach((child) => {
            if (child.userData && child.userData.isScreenElement) {
                const mesh = child as THREE.Mesh;

                // Create new geometry with updated size
                const newGeometry = new THREE.PlaneGeometry(
                    this.screenSize.width,
                    this.screenSize.height,
                    32,
                    32
                );

                // Apply curvature to new geometry
                this.applyCurvature(newGeometry, 1200);

                // Replace geometry
                mesh.geometry.dispose();
                mesh.geometry = newGeometry;
            }
        });
    }

    initializeScreenEvents() {
        document.addEventListener(
            'mousemove',
            (event) => {
                // @ts-ignore
                const id = event.target.id;
                if (id === 'computer-screen') {
                    // @ts-ignore
                    event.inComputer = true;
                }

                // @ts-ignore
                this.inComputer = event.inComputer;

                if (this.inComputer && !this.prevInComputer) {
                    this.camera.trigger('enterMonitor');
                }

                if (
                    !this.inComputer &&
                    this.prevInComputer &&
                    !this.mouseClickInProgress
                ) {
                    this.camera.trigger('leftMonitor');
                }

                if (
                    !this.inComputer &&
                    this.mouseClickInProgress &&
                    this.prevInComputer
                ) {
                    this.shouldLeaveMonitor = true;
                } else {
                    this.shouldLeaveMonitor = false;
                }

                this.application.mouse.trigger('mousemove', [event]);

                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mousedown',
            (event) => {
                // @ts-ignore
                this.inComputer = event.inComputer;
                this.application.mouse.trigger('mousedown', [event]);

                this.mouseClickInProgress = true;
                this.prevInComputer = this.inComputer;
            },
            false
        );
        document.addEventListener(
            'mouseup',
            (event) => {
                // @ts-ignore
                this.inComputer = event.inComputer;
                this.application.mouse.trigger('mouseup', [event]);

                if (this.shouldLeaveMonitor) {
                    this.camera.trigger('leftMonitor');
                    this.shouldLeaveMonitor = false;
                }

                this.mouseClickInProgress = false;
                this.prevInComputer = this.inComputer;
            },
            false
        );
    }

    /**
     * Creates the iframe for the computer screen
     */
    createIframe() {
        // Create container
        const container = document.createElement('div');
        container.style.width = this.screenSize.width + 'px';
        container.style.height = this.screenSize.height + 'px';
        container.style.opacity = '1';
        container.style.background = 'transparent';
        container.style.transformStyle = 'preserve-3d';
        container.style.perspective = '2000px';

        // Create iframe
        const iframe = document.createElement('iframe');

        // Bubble mouse move events to the main application, so we can affect the camera
        iframe.onload = () => {
            if (iframe.contentWindow) {
                window.addEventListener('message', (event) => {
                    var evt = new CustomEvent(event.data.type, {
                        bubbles: true,
                        cancelable: false,
                    });

                    // @ts-ignore
                    evt.inComputer = true;
                    if (event.data.type === 'mousemove') {
                        var clRect = iframe.getBoundingClientRect();
                        const { top, left, width, height } = clRect;
                        const widthRatio = width / IFRAME_SIZE.w;
                        const heightRatio = height / IFRAME_SIZE.h;

                        // @ts-ignore
                        evt.clientX = Math.round(
                            event.data.clientX * widthRatio + left
                        );
                        //@ts-ignore
                        evt.clientY = Math.round(
                            event.data.clientY * heightRatio + top
                        );
                    } else if (event.data.type === 'keydown') {
                        // @ts-ignore
                        evt.key = event.data.key;
                    } else if (event.data.type === 'keyup') {
                        // @ts-ignore
                        evt.key = event.data.key;
                    }

                    iframe.dispatchEvent(evt);
                });
            }
        };

        // Set iframe attributes
        // Use localhost:3000
        iframe.src = 'http://localhost:3000/';
        iframe.style.width = this.screenSize.width + 'px';
        iframe.style.height = this.screenSize.height + 'px';
        iframe.style.padding = '0px';
        iframe.style.boxSizing = 'border-box';
        iframe.style.opacity = '1';
        iframe.style.border = 'none';
        iframe.style.outline = 'none';
        iframe.className = 'jitter';
        iframe.id = 'computer-screen';
        iframe.frameBorder = '0';
        iframe.title = 'DuckOS';
        iframe.setAttribute('allow', 'autoplay; fullscreen; geolocation; microphone; camera; midi; encrypted-media');
        iframe.setAttribute('allowfullscreen', 'true');

        // Debug: log when iframe loads or errors
        iframe.addEventListener('load', () => {
            console.log('Iframe loaded successfully');
        });
        iframe.addEventListener('error', (e) => {
            console.error('Iframe error:', e);
        });

        // Add iframe to container
        container.appendChild(iframe);

        // Create CSS plane
        this.createCssPlane(container);
    }

    /**
     * Creates a CSS plane and GL plane to properly occlude the CSS plane
     * @param element the element to create the css plane for
     */
    createCssPlane(element: HTMLElement) {
        // Create CSS3D object
        const object = new CSS3DObject(element);

        // copy monitor position and rotation
        object.position.copy(this.position);
        object.rotation.copy(this.rotation);

        // Add to CSS scene
        this.cssScene.add(object);

        // Create GL plane with curvature
        const material = new THREE.MeshLambertMaterial();
        material.side = THREE.DoubleSide;
        material.opacity = 0;
        material.transparent = true;
        // NoBlending allows the GL plane to occlude the CSS plane
        material.blending = THREE.NoBlending;

        // Create plane geometry with segments for curvature
        const geometry = new THREE.PlaneGeometry(
            this.screenSize.width,
            this.screenSize.height,
            32,
            32
        );

        // Apply curvature to the geometry
        this.applyCurvature(geometry, 1200);

        // Create the GL plane mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Copy the position, rotation and scale of the CSS plane to the GL plane
        mesh.position.copy(object.position);
        mesh.rotation.copy(object.rotation);
        mesh.scale.copy(object.scale);

        // Mark as screen element for debug updates (no offset for occlusion plane)
        mesh.userData.isScreenElement = true;
        mesh.userData.zOffset = 0;

        // Add to gl scene
        this.scene.add(mesh);
    }

    /**
     * Applies curvature to a plane geometry
     * @param geometry the geometry to apply curvature to
     * @param radius the radius of curvature
     */
    applyCurvature(geometry: THREE.PlaneGeometry, radius: number) {
        const positions = geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);

            // Normalize coordinates to -1 to 1 range
            const normX = x / (this.screenSize.width / 2);
            const normY = y / (this.screenSize.height / 2);

            // Apply cylindrical curvature in both X and Y directions (CRT-style)
            // Use global curvature strength values
            const zX = normX * normX * CURVE_STRENGTH_X;
            const zY = normY * normY * CURVE_STRENGTH_Y;

            // Combine both curvatures
            const z = -(zX + zY);

            positions.setZ(i, z);
        }

        geometry.computeVertexNormals();
    }

    /**
     * Creates the texture layers for the computer screen
     * @returns the maximum offset of the texture layers
     */
    createTextureLayers() {
        const textures = this.resources.items.texture;

        this.getVideoTextures('video-1');
        this.getVideoTextures('video-2');

        // Scale factor to multiply depth offset by
        const scaleFactor = TEXTURE_OFFSET_SCALE;

        // Construct the texture layers
        const layers = {
            smudge: {
                texture: textures.monitorSmudgeTexture,
                blending: THREE.AdditiveBlending,
                opacity: 0.12,
                offset: 24,
            },
            innerShadow: {
                texture: textures.monitorShadowTexture,
                blending: THREE.MultiplyBlending,
                opacity: 0.3,
                offset: 5,
            },
            video: {
                texture: this.videoTextures['video-1'],
                blending: THREE.AdditiveBlending,
                opacity: 0.5,
                offset: 10,
            },
            video2: {
                texture: this.videoTextures['video-2'],
                blending: THREE.AdditiveBlending,
                opacity: 0.1,
                offset: 15,
            },
        };

        // Declare max offset
        let maxOffset = -1;

        // Add the texture layers to the screen
        for (const [_, layer] of Object.entries(layers)) {
            const offset = layer.offset * scaleFactor;
            this.addTextureLayer(
                layer.texture,
                layer.blending,
                layer.opacity,
                offset
            );
            // Calculate the max offset
            if (offset > maxOffset) maxOffset = offset;
        }

        // Return the max offset
        return maxOffset;
    }

    getVideoTextures(videoId: string) {
        const video = document.getElementById(videoId);
        if (!video) {
            setTimeout(() => {
                this.getVideoTextures(videoId);
            }, 100);
        } else {
            this.videoTextures[videoId] = new THREE.VideoTexture(
                video as HTMLVideoElement
            );
        }
    }

    /**
     * Adds a texture layer to the screen
     * @param texture the texture to add
     * @param blending the blending mode
     * @param opacity the opacity of the texture
     * @param offset the offset of the texture, higher values are further from the screen
     */
    addTextureLayer(
        texture: THREE.Texture,
        blendingMode: THREE.Blending,
        opacity: number,
        offset: number
    ) {
        // Create material
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            blending: blendingMode,
            side: THREE.DoubleSide,
            opacity,
            transparent: true,
        });

        // Create geometry with segments for curvature
        const geometry = new THREE.PlaneGeometry(
            this.screenSize.width,
            this.screenSize.height,
            32,
            32
        );

        // Apply curvature to the geometry
        this.applyCurvature(geometry, 1200);

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);

        // Copy position and apply the depth offset
        mesh.position.copy(
            this.offsetPosition(this.position, new THREE.Vector3(0, 0, offset))
        );

        // Copy rotation
        mesh.rotation.copy(this.rotation);

        // Mark as screen element for debug updates and store offset
        mesh.userData.isScreenElement = true;
        mesh.userData.zOffset = offset;
        mesh.userData.originalScale = TEXTURE_OFFSET_SCALE;

        this.scene.add(mesh);
    }

    /**
     * Creates enclosing planes for the computer screen
     * @param maxOffset the maximum offset of the texture layers
     */
    createEnclosingPlanes(maxOffset: number) {
        // Create planes, lots of boiler plate code here because I'm lazy
        const planes = {
            left: {
                size: new THREE.Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(
                    this.position,
                    new THREE.Vector3(
                        -this.screenSize.width / 2,
                        0,
                        maxOffset / 2
                    )
                ),
                rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
            },
            right: {
                size: new THREE.Vector2(maxOffset, this.screenSize.height),
                position: this.offsetPosition(
                    this.position,
                    new THREE.Vector3(
                        this.screenSize.width / 2,
                        0,
                        maxOffset / 2
                    )
                ),
                rotation: new THREE.Euler(0, 90 * THREE.MathUtils.DEG2RAD, 0),
            },
            top: {
                size: new THREE.Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(
                    this.position,
                    new THREE.Vector3(
                        0,
                        this.screenSize.height / 2,
                        maxOffset / 2
                    )
                ),
                rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
            },
            bottom: {
                size: new THREE.Vector2(this.screenSize.width, maxOffset),
                position: this.offsetPosition(
                    this.position,
                    new THREE.Vector3(
                        0,
                        -this.screenSize.height / 2,
                        maxOffset / 2
                    )
                ),
                rotation: new THREE.Euler(90 * THREE.MathUtils.DEG2RAD, 0, 0),
            },
        };

        // Add each of the planes
        for (const [_, plane] of Object.entries(planes)) {
            this.createEnclosingPlane(plane);
        }
    }

    /**
     * Creates a plane for the enclosing planes
     * @param plane the plane to create
     */
    createEnclosingPlane(plane: EnclosingPlane) {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x48493f,
            transparent: true,
            opacity: 0,
        });

        const geometry = new THREE.PlaneGeometry(plane.size.x, plane.size.y);
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(plane.position);
        mesh.rotation.copy(plane.rotation);

        this.scene.add(mesh);
    }

    createPerspectiveDimmer(maxOffset: number) {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x000000,
            transparent: true,
            blending: THREE.AdditiveBlending,
        });

        const plane = new THREE.PlaneGeometry(
            this.screenSize.width,
            this.screenSize.height,
            32,
            32
        );

        // Apply curvature to the dimmer plane
        this.applyCurvature(plane, 1200);

        const mesh = new THREE.Mesh(plane, material);

        mesh.position.copy(
            this.offsetPosition(
                this.position,
                new THREE.Vector3(0, 0, maxOffset - 5)
            )
        );

        mesh.rotation.copy(this.rotation);

        // Mark as screen element for debug updates and store offset
        mesh.userData.isScreenElement = true;
        mesh.userData.zOffset = maxOffset - 5;

        this.dimmingPlane = mesh;

        this.scene.add(mesh);
    }

    /**
     * Offsets a position vector by another vector
     * @param position the position to offset
     * @param offset the offset to apply
     * @returns the new offset position
     */
    offsetPosition(position: THREE.Vector3, offset: THREE.Vector3) {
        const newPosition = new THREE.Vector3();
        newPosition.copy(position);
        newPosition.add(offset);
        return newPosition;
    }

    update() {
        if (this.dimmingPlane) {
            const planeNormal = new THREE.Vector3(0, 0, 1);
            const viewVector = new THREE.Vector3();
            viewVector.copy(this.camera.instance.position);
            viewVector.sub(this.position);
            viewVector.normalize();

            const dot = viewVector.dot(planeNormal);

            // calculate the distance from the camera vector to the plane vector
            const dimPos = this.dimmingPlane.position;
            const camPos = this.camera.instance.position;

            const distance = Math.sqrt(
                (camPos.x - dimPos.x) ** 2 +
                    (camPos.y - dimPos.y) ** 2 +
                    (camPos.z - dimPos.z) ** 2
            );

            const opacity = 1 / (distance / 10000);

            const DIM_FACTOR = 0.7;

            // @ts-ignore
            this.dimmingPlane.material.opacity =
                (1 - opacity) * DIM_FACTOR + (1 - dot) * DIM_FACTOR;
        }
    }
}
