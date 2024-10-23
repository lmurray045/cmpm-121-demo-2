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

interface line {
    lineVertices: point[];
    lineWeight: number;
}

const pointArray: point[] = []
const undoStack: line[] = []
const redoStack: line[] = []

//command functions
function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, weight: number, color: "white" | "black" | "red" | "#1a1a1a") {
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

function eraseLine(): void {
    if(context){
        clearCanvas(context)
    }
    for(let i = 0; i < undoStack.length; i++){
        if(context){
            redrawLine(undoStack[i])
        }
    }
}

function redrawLine(line: line): void {
    let oldX = line.lineVertices[0].x
    let oldY = line.lineVertices[0].y
    for(let i = 1; i < line.lineVertices.length; i++){
        const x = line.lineVertices[i].x
        const y = line.lineVertices[i].y
        if(context){
            drawLine(context, x, y, oldX, oldY, line.lineWeight, "white")
        }
        oldX = x
        oldY = y
    }
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
    const pointCopy: point[] = pointArray.slice()
    const newLine: line = {lineVertices: pointCopy, lineWeight: 2};
    undoStack.push(newLine);
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

//undo button
const undoButton = document.createElement("button")
undoButton.innerHTML = "undo"
app.append(undoButton)

//button listener
undoButton.addEventListener("click", () => {
    if(undoStack.length < 1) { //only if there is a line to undo
        return;
    }
    const newLine = undoStack.pop()
    if(newLine) {
        redoStack.push(newLine);
        eraseLine();
    }
  });


//redo button
const redoButton = document.createElement("button")
redoButton.innerHTML = "redo"
app.append(redoButton)

//button listener
redoButton.addEventListener("click", () => {
    //update numbers
    if(redoStack.length < 1) { //only if there is a line to undo
        return;
    }
    const newLine = redoStack.pop()
    if(newLine) {
        undoStack.push(newLine)
        redrawLine(newLine);
    }
  });