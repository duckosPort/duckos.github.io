import Application from '../Application';
import Resources from '../Utils/Resources';
import ComputerSetup from './Computer';
import MonitorScreen from './MonitorScreen';
import Environment from './Environment';
// import Decor from './Decor'; // Decorações removidas
import CoffeeSteam from './CoffeeSteam';
import CoffeeMug from './CoffeeMug';
import Cursor from './Cursor';
import Hitboxes from './Hitboxes';
import AudioManager from '../Audio/AudioManager';
import DecorativeObjects from './DecorativeObjects';

export default class World {
    application: Application;
    scene: THREE.Scene;
    resources: Resources;

    // Objects in the scene
    environment: Environment;
    // decor: Decor; // Decorações removidas
    computerSetup: ComputerSetup;
    monitorScreen: MonitorScreen;
    coffeeSteam: CoffeeSteam;
    coffeeMug: CoffeeMug;
    cursor: Cursor;
    audioManager: AudioManager;
    decorativeObjects: DecorativeObjects;

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.environment = new Environment();
            // this.decor = new Decor(); // Decorações removidas
            this.computerSetup = new ComputerSetup();
            this.monitorScreen = new MonitorScreen();
            this.coffeeSteam = new CoffeeSteam();
            this.coffeeMug = new CoffeeMug();
            this.audioManager = new AudioManager();
            this.decorativeObjects = new DecorativeObjects();
            // const hb = new Hitboxes();
            // this.cursor = new Cursor();
        });
    }

    update() {
        if (this.monitorScreen) this.monitorScreen.update();
        if (this.environment) this.environment.update();
        if (this.coffeeSteam) this.coffeeSteam.update();
        if (this.audioManager) this.audioManager.update();
    }
}
