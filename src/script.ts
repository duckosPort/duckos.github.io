import './style.css';

import Application from './Application/Application';

const app: Application = new Application();

// Easter egg: QUACK function available in console
(window as any).QUACK = () => {
    console.log("Quack pra você também meu lindo!!!");
    return "Quack pra você também meu lindo!!!";
};
