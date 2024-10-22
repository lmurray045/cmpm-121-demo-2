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

//drawing points array
interface point {
    x: number;
    y: number;
}

const pointArray: point[] = [] 

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

canvas.addEventListener('drawing-changed', () => {
    if (pointArray.length < 2) return; // Ensure there are enough points to draw a line
    const secondLastPoint = pointArray[pointArray.length - 2];
    const lastPoint = pointArray[pointArray.length - 1];
    drawLine(context, secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y, 2, "white");
})

canvas.addEventListener('mousedown', () => {
    isDrawing = true;
    console.log("mousedown")
})

canvas.addEventListener('mousemove', (e) => {
    if(isDrawing) {
        const newPoint: point = {x: e.offsetX, y: e.offsetY}
        pointArray.push(newPoint)
        
        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);
        
        console.log("mousemove")
    }
})

canvas.addEventListener('mouseup', (e) => {
    if(isDrawing) {
        const newPoint: point = {x: e.offsetX, y: e.offsetY}
        pointArray.push(newPoint)

        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);

        isDrawing = false;
    }
    pointArray.length = 0
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