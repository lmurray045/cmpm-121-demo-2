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

const context = canvas.getContext('2d');

if (!context) {
    throw new Error('Failed to get 2D context');
}

//command pattern - make commands one way, then make button and link them

//command functions
function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, weight: number, color: "white" | "black" | "red") {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = weight;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
  }

function clearCanvas(context: CanvasRenderingContext2D): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

//actions to be linked

//draw on mouse movement

//CODE CITATION: much of this code was taken from the resource that was linked in the slides: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event

let isDrawing = false;
let x = 0;
let y = 0;

canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
    console.log("mousedown")
})

canvas.addEventListener('mousemove', (e) => {
    if(isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY, 1, "white");
        x = e.offsetX;
        y = e.offsetY;
        console.log("mousemove")
    }
})

canvas.addEventListener('mouseup', (e) => {
    if(isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY, 1, "white");
        x = 0;
        y = 0;
        isDrawing = false;
    }
    console.log("mouseup")
})

//clear button
const clearButton = document.createElement("button")
clearButton.innerHTML = "clear"
app.append(clearButton)

//button listener
clearButton.addEventListener("click", () => {
    //update numbers
    clearCanvas(context);
  });