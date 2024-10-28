import "./style.css";

const APP_NAME = "SketchPad Power!";
const app = document.querySelector<HTMLDivElement>("#app")!;

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const exportContainer = document.createElement("div");
exportContainer.id = "button-container";
app.append(exportContainer);

const canvas = document.createElement("canvas");
canvas.width = 512;
canvas.height = 512;
app.append(canvas)

const buttonContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.append(buttonContainer);

const markerContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.append(markerContainer);

const colorContainer = document.createElement("div");
colorContainer.id = "button-container";
app.append(colorContainer);

const stickerContainer = document.createElement("div");
buttonContainer.id = "button-container";
app.append(stickerContainer);

const colorSlider = document.createElement("input");
colorSlider.type = "range";
colorSlider.min = "0";
colorSlider.max = "100";
app.append(colorSlider)


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
    fontSize: number = defaultSize;
    constructor(text: string, color: string, lineSize: number) {
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
        this.cursor.style.left = `${x + canvasBounds.left + globalThis.scrollX}px`;
        this.cursor.style.top = `${y + canvasBounds.top + globalThis.scrollY}px`;
    }
    display() {
        this.isNull = false;
        this.cursor.style.display = 'block'
    }
    update(text: string, color: string, lineSize: number){
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
type ToolMovedEvent = CustomEvent<ToolMovedEventDetail>


const pointArray: point[] = []
const undoStack: ctx[] = []
let contextPointer = 0;
let lineThickness = 2;
const defaultSize = 8;
let mouseString: string = "•";
let mouseColor: string = "white";
const preview: mousePointer = new mousePointer(mouseString, mouseColor, lineThickness);

const blankCanvas: ctx = new ctx(context.getImageData(0, 0, canvas.width, canvas.height));
undoStack.push(blankCanvas);

//command functions
function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, weight: number, color: string) {
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
    mouseString = "•";
    lineThickness = 4;
    isSticker = false;
}

function thinLine(): void {
    mouseString = "•";
    lineThickness = 2;
    isSticker = false;
}

function red(): void {
    mouseColor = "red";
    if(context){
        context.fillStyle = mouseColor;
    }
}

function black(): void {
    mouseColor = "black";
    if(context){
        context.fillStyle = mouseColor;
    }
}

function white(): void {
    mouseColor = "white";
    if(context){
        context.fillStyle = mouseColor;
    }
}

function blue(): void {
    mouseColor = "blue";
    if(context){
        context.fillStyle = mouseColor;
    }
}

function makeSticker(s: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const stickerButton = new commandButton(s, () => {
        mouseString = s
        lineThickness = 4;
        if(context){
            context.font = `${lineThickness * defaultSize - 1}px Arial`;
            context.fillStyle = mouseColor;
        }
        isSticker = true;
    }, stickerContainer)
}

function customSticker(): void {
    const customSticker = prompt("Custom Sticker");
    if(customSticker){
        stickerList.push(customSticker);
        makeSticker(customSticker);
    } 
}

function measureText(s: string): number[] {
    const measure = document.createElement('span');
        if(context){
            measure.style.font = context.font;
        }
        measure.style.fontSize = `${(lineThickness * defaultSize)}px`;
        measure.style.position = 'absolute';
        measure.style.visibility = 'hidden';
        measure.textContent = s;
        document.body.appendChild(measure);

        const textWidth: number = measure.offsetWidth;
        const textHeight: number = measure.offsetHeight;
        document.body.removeChild(measure);
        const returnArray: number[] = [textWidth, textHeight]
        return returnArray;
}

function toolMovedEvent(x: number, y: number, isNull: boolean) {
    const toolEvent: ToolMovedEvent = new CustomEvent<ToolMovedEventDetail>("tool-moved", {
        detail: {
            x: x,
            y: y,
            isNull: isNull
        }
    }) as ToolMovedEvent;
    canvas.dispatchEvent(toolEvent);
}

function exportDrawing(): void {
    const newCanvas = document.createElement("canvas");
    newCanvas.width = 1024;
    newCanvas.height = 1024;
    const newCtx = newCanvas.getContext('2d');
    if(context && newCtx) {
        // Set up the scale first
        const scale = newCanvas.width / canvas.width
        newCtx.scale(scale, scale);
 
        // Copy the original canvas to the new one, scaling it by the specified factor
        newCtx.drawImage(canvas, 0, 0);

        newCtx.scale(1/scale, 1/scale);

        const anchor = document.createElement("a");
        anchor.href = newCanvas.toDataURL("image/png");
        anchor.download = "sketchpad.png";
        anchor.click();
    }
    else{
        console.log("failed to get 2d context")
    }
}  

function getColorForValue(value:number): string { 
    // Ensure value is within 0-100
    value = Math.min(100, Math.max(0, value));

    // Define color start (red) and end (green)
    const startColor = { r: 255, g: 0, b: 0 }; // Red
    const endColor = { r: 0, g: 255, b: 0 };   // Green

    // Calculate ratio
    const ratio = value / 100;

    // Interpolate color
    const r = Math.ceil(startColor.r * (1 - ratio) + endColor.r * ratio);
    const g = Math.ceil(startColor.g * (1 - ratio) + endColor.g * ratio);
    const b = Math.ceil(startColor.b * (1 - ratio) + endColor.b * ratio);

    // Return as CSS color string
    return `rgb(${r}, ${g}, ${b})`;
}

//actions to be linked

//draw on mouse movement
//CODE CITATION: much of this code was taken from the resource that was linked in the slides: https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event

let isDrawing = false;
let isSticker = false;

canvas.addEventListener('drawing-changed', () => {
    if (pointArray.length < 2) return; // Ensure there are enough points to draw a line
    const secondLastPoint = pointArray[pointArray.length - 2];
    const lastPoint = pointArray[pointArray.length - 1];
    drawLine(context, secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y, lineThickness, mouseColor);
})

canvas.addEventListener('mousedown', () => {
    if(!isSticker){
        isDrawing = true;
    }
})

canvas.addEventListener('mouseleave', () => {
    toolMovedEvent(0, 0, true);
})

canvas.addEventListener('mousemove', (e) => {
    if(isDrawing && !isSticker) {
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
    if(isSticker){

        const measurements = measureText(mouseString)
        const textWidth = measurements[0];
        const textHeight = measurements[1];
    
        context.fillText(mouseString, (e.offsetX - textWidth / 2) - 1, (e.offsetY + textHeight / 2) - 11)
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

colorSlider.addEventListener("input", () => {
    mouseColor = getColorForValue(parseInt(colorSlider.value));
})

//clear button
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clearButton = new commandButton("Clear", clearCanvas, buttonContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const undoButton = new commandButton("Undo", undo, buttonContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const redoButton = new commandButton("Redo", redo, buttonContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const thickButton = new commandButton("Marker", thickLine, markerContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const thinButton = new commandButton("Pen", thinLine, markerContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customButton = new commandButton("Custom Sticker", customSticker, markerContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const exportButton = new commandButton("Export", exportDrawing, exportContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const redButton = new commandButton("🟥", red, colorContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const whiteButton = new commandButton("⬜", white, colorContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const blackButton = new commandButton("⬛", black, colorContainer)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const blueButton = new commandButton("🟦", blue, colorContainer)

const stickerList: string[] =  ["🦕", "🦖", "🌋", "🔥", "💥"]

for (const s of stickerList) {
    makeSticker(s);
}