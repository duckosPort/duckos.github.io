const sources: Resource[] = [
    {
        name: 'computerSetupModel',
        type: 'gltfModel',
        path: 'models/Computer/commodore_64__computer_full_pack.glb',
    },
    {
        name: 'environmentModel',
        type: 'gltfModel',
        path: 'models/World/skybox.glb',
    },
    {
        name: 'officeDeskModel',
        type: 'gltfModel',
        path: 'models/Decor/office_desk.glb',
    },
    // Textura do environment antiga não é mais necessária (skybox tem texturas embutidas)
    // {
    //     name: 'environmentTexture',
    //     type: 'texture',
    //     path: 'models/World/baked_environment.jpg',
    // },
    // Decorações removidas
    // {
    //     name: 'decorModel',
    //     type: 'gltfModel',
    //     path: 'models/Decor/decor.glb',
    // },
    // {
    //     name: 'decorTexture',
    //     type: 'texture',
    //     path: 'models/Decor/baked_decor_modified.jpg',
    // },
    {
        name: 'coffeeMugModel',
        type: 'gltfModel',
        path: 'models/Decor/coffee_mug_school_project.glb',
    },
    {
        name: 'waterFlaskModel',
        type: 'gltfModel',
        path: 'models/Decor/32oz_water_flask.glb',
    },
    {
        name: 'deskLampModel',
        type: 'gltfModel',
        path: 'models/Decor/desk_lamp.glb',
    },
    {
        name: 'duckModel',
        type: 'gltfModel',
        path: 'models/Decor/duck.glb',
    },
    {
        name: 'guitarModel',
        type: 'gltfModel',
        path: 'models/Decor/fender_stratocaster_guitar.glb',
    },
    {
        name: 'headphoneModel',
        type: 'gltfModel',
        path: 'models/Decor/headphone_with_stand.glb',
    },
    {
        name: 'gamingChairModel',
        type: 'gltfModel',
        path: 'models/Decor/office_chair_gaming_chair.glb',
    },
    {
        name: 'palmPlantModel',
        type: 'gltfModel',
        path: 'models/Decor/palm_plant.glb',
    },
    {
        name: 'xboxControllerModel',
        type: 'gltfModel',
        path: 'models/Decor/xbox_controller_free.glb',
    },
    {
        name: 'foxModel',
        type: 'gltfModel',
        path: 'models/Decor/cute_fox.glb',
    },
    {
        name: 'monitorSmudgeTexture',
        type: 'texture',
        path: 'textures/monitor/layers/compressed/smudges.jpg',
    },
    {
        name: 'monitorShadowTexture',
        type: 'texture',
        path: 'textures/monitor/layers/compressed/shadow-compressed.png',
    },
    {
        name: 'mouseDown',
        type: 'audio',
        path: 'audio/mouse/mouse_down.mp3',
    },
    {
        name: 'mouseUp',
        type: 'audio',
        path: 'audio/mouse/mouse_up.mp3',
    },
    {
        name: 'keyboardKeydown1',
        type: 'audio',
        path: 'audio/keyboard/key_1.mp3',
    },
    {
        name: 'keyboardKeydown2',
        type: 'audio',
        path: 'audio/keyboard/key_2.mp3',
    },
    {
        name: 'keyboardKeydown3',
        type: 'audio',
        path: 'audio/keyboard/key_3.mp3',
    },
    {
        name: 'keyboardKeydown4',
        type: 'audio',
        path: 'audio/keyboard/key_4.mp3',
    },
    {
        name: 'keyboardKeydown5',
        type: 'audio',
        path: 'audio/keyboard/key_5.mp3',
    },
    {
        name: 'keyboardKeydown6',
        type: 'audio',
        path: 'audio/keyboard/key_6.mp3',
    },
    {
        name: 'startup',
        type: 'audio',
        path: 'audio/startup/startup.mp3',
    },
    {
        name: 'office',
        type: 'audio',
        path: 'audio/atmosphere/office.mp3',
    },
    {
        name: 'ccType',
        type: 'audio',
        path: 'audio/cc/type.mp3',
    },
    {
        name: 'duckSound',
        type: 'audio',
        path: 'audio/toys/duck.mp3',
    },
    {
        name: 'foxSqueak',
        type: 'audio',
        path: 'audio/toys/squeak.mp3',
    },
];

export default sources;
