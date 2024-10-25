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

const buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.append(buttonContainer);

const context = canvas.getContext('2d');

if (!context) {
    throw new Error('Failed to get 2D context');
}

//command pattern - make commands one way, then make button and link them

//definitions
interface point {
    x: number;
    y: number;
}

class ctx {
    imageData: ImageData;
    constructor(imageData: ImageData) {
        this.imageData = imageData;
    }
    display(context: CanvasRenderingContext2D) {
        context.putImageData(this.imageData, 0, 0)
    }
}

class mousePointer {
    private x: number = 0;
    private y: number = 0;
    cursor: HTMLDivElement;
    color: string;
    isNull: boolean;
    fontSize: number = 8;
    constructor(text: string, color: "white" | "black" | "red", lineSize: number) {
        this.color = color;
        this.isNull = true;
        this.cursor = document.createElement("div");
        this.cursor.id = "custom-cursor";
        this.cursor.style.position = "absolute";
        this.cursor.style.display = 'none'
        this.cursor.style.fontSize = `${this.fontSize * lineSize}px`;
        this.cursor.style.pointerEvents = "none"; // Allow clicks to pass through
        this.cursor.textContent = text;
        this.cursor.style.color = color;
        app.appendChild(this.cursor);
    }
    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        const canvasBounds = canvas.getBoundingClientRect();
        if(this.isNull) {
            this.cursor.style.display = 'none'
        }
        this.cursor.style.left = `${x + canvasBounds.left}px`;
        this.cursor.style.top = `${y + canvasBounds.top}px`;
    }
    display() {
        this.isNull = false;
        this.cursor.style.display = 'block'
    }
    update(text: string, color: "white" | "black" | "red", lineSize: number){
        this.color = color;
        this.cursor.textContent = text;
        this.cursor.style.color = color;
        this.cursor.style.fontSize = `${lineSize * this.fontSize}px`
    }
}

class commandButton {
    text: string;
    command: () => void;
    button: HTMLButtonElement;
    constructor(text: string, command: () => void, container: HTMLDivElement) {
        this.text = text;
        this.command = command;
        this.button = document.createElement("button")
        this.button.innerHTML = this.text
        container.append(this.button)
        this.button.addEventListener("click", () => {
            this.command();
        });
    }
}

// Define the structure of your event's detail
interface ToolMovedEventDetail {
    x: number;
    y: number;
    isNull: boolean;
}

// Extend the base event type to include your custom detail
interface ToolMovedEvent extends CustomEvent<ToolMovedEventDetail> {}

const pointArray: point[] = []
const undoStack: ctx[] = []
let contextPointer = 0;
let lineThickness = 2;
let mouseString: string = "•";
let mouseColor: "white" | "red" | "black" = "white"
let preview: mousePointer = new mousePointer(mouseString, mouseColor, lineThickness);

const blankCanvas: ctx = new ctx(context.getImageData(0, 0, canvas.width, canvas.height));
undoStack.push(blankCanvas);

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

function clearCanvas(): void {
    if(context){
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    undoStack.length = 0
    contextPointer = 0
    undoStack.push(blankCanvas);
}

function undo(): void {
    if(contextPointer == 0) { //only if there is a line to undo
        return;
    }
    contextPointer -= 1;
    if(context) {
        undoStack[contextPointer].display(context)
    }
}

function redo(): void {
    if(contextPointer == undoStack.length - 1) { //only if there is a line to undo
        return;
    }
    contextPointer += 1;
    if(context) {
        undoStack[contextPointer].display(context)
    }
}

function thickLine(): void {
    lineThickness = 4;
}

function thinLine(): void {
    lineThickness = 2;
}

function toolMovedEvent(x: number, y: number, isNull: boolean) {
    const toolEvent: ToolMovedEvent = new CustomEvent("tool-moved", {
        detail: {
            x: x,
            y: y,
            isNull: isNull
        }
    });
    canvas.dispatchEvent(toolEvent);
}


//actions to be linked

//draw on mouse movement
//CODE CITATION: much of this code was taken from the resource that was linked in the slides: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event

let isDrawing = false;

canvas.addEventListener('drawing-changed', () => {
    if (pointArray.length < 2) return; // Ensure there are enough points to draw a line
    const secondLastPoint = pointArray[pointArray.length - 2];
    const lastPoint = pointArray[pointArray.length - 1];
    drawLine(context, secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y, lineThickness, "white");
})

canvas.addEventListener('mousedown', () => {
    isDrawing = true;
})

canvas.addEventListener('mouseleave', () => {
    toolMovedEvent(0, 0, true);
})

canvas.addEventListener('mousemove', (e) => {
    if(isDrawing) {
        toolMovedEvent(e.offsetX, e.offsetY, true);

        const newPoint: point = {x: e.offsetX, y: e.offsetY}
        pointArray.push(newPoint)
        
        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);
    }
    else {
        toolMovedEvent(e.offsetX, e.offsetY, false);
    }
})

canvas.addEventListener('mouseup', (e) => {
    if(isDrawing) {
        toolMovedEvent(e.offsetX, e.offsetY, true);

        const newPoint: point = {x: e.offsetX, y: e.offsetY}
        pointArray.push(newPoint)

        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);

        isDrawing = false;
    }
    undoStack.length = contextPointer + 1;
    const newCtx = new ctx(context.getImageData(0, 0, canvas.width, canvas.height));
    undoStack.push(newCtx);
    contextPointer += 1;
    pointArray.length = 0
})

canvas.addEventListener("tool-moved", (e: ToolMovedEvent) => {
    preview.isNull = e.detail.isNull
    preview.update(mouseString, mouseColor, lineThickness);
    preview.updatePosition(e.detail.x, e.detail.y);
    if(!e.detail.isNull){
        preview.display()
    }
})

//clear button
const clearButton = new commandButton("clear", clearCanvas, buttonContainer)
const undoButton = new commandButton("undo", undo, buttonContainer)
const redoButton = new commandButton("redo", redo, buttonContainer)
const thickButton = new commandButton("Marker", thickLine, buttonContainer)
const thinButton = new commandButton("Pen", thinLine, buttonContainer)
