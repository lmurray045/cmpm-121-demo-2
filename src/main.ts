import "./style.css";

const APP_NAME = "SketchPad Power!";
const app = document.querySelector<HTMLDivElement>("#app")!;


const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas)