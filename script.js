const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const panSpan = document.getElementById("pan");
const zoomSpan = document.getElementById("zoom");

function updatePanSpan(pan) {
    panSpan.innerText = `x = ${pan.x.toString()}, y = ${pan.y.toString()}`;
}
function updateZoomSpan(zoom) {
    zoomSpan.innerText = `${zoom}`;
}

function sizeCanvas(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}

function setWebGLViewport(gl) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    // error handling
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    // more error handling
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

const program = createProgram(gl, vertexShader, fragmentShader);

// attribute locations
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// buffers
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1, -1,
    3, -1,
    -1, 3
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// uniform locations
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const translateUniformLocation = gl.getUniformLocation(program, "u_translate");
const scaleUniformLocation = gl.getUniformLocation(program, "u_scale");

let scale = {x: 1, y: 1};
let translate = {x: 0, y: 0};
let scrollSpeed = 0.100;

sizeCanvas(canvas);
scale.x = Math.min(canvas.width, canvas.height)/2;
scale.y = scale.x;

function update() {
    // resize canvas and viewport properly
    sizeCanvas(canvas);
    setWebGLViewport(gl);

    // clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // set uniforms
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(translateUniformLocation, translate.x, translate.y);
    gl.uniform2f(scaleUniformLocation, scale.x, scale.y);

    // now actually draw the stuff
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    window.requestAnimationFrame(update);
}

update();
updatePanSpan(translate);
updateZoomSpan(scale.x);

document.addEventListener("wheel", (e) => {
    e.preventDefault();
    let pScaleX = scale.x;
    scale.x -= Math.sign(e.deltaY) * scrollSpeed * scale.x;
    scale.x = Math.max(scale.x, Math.min(canvas.width, canvas.height)/2);
    scale.y = scale.x;

    let theCoordsNowAtTheMouse = (e.clientX - canvas.width/2) / pScaleX;
    translate.x -= (theCoordsNowAtTheMouse * scale.x + canvas.width/2 - e.clientX) / scale.x;
    let theCoordsNowAtTheMouseY = (canvas.height/2 - e.clientY) / pScaleX;
    translate.y -= (theCoordsNowAtTheMouseY * scale.x + canvas.height/2 - (canvas.height - e.clientY)) / scale.x;
    // i hate this so much and no clue how it works but i dont want to think so pls dont touch it
    // "the translate cancels out" just in case you know/remember what that means

    updatePanSpan(translate);
    updateZoomSpan(scale.x);
}, {passive: false});

let pMouse = null;
document.addEventListener("mousedown", (e) => {
    pMouse = {x: e.clientX, y: e.clientY};
});
document.addEventListener("mousemove", (e) => {
    if(pMouse !== null) {
        translate.x += (e.clientX - pMouse.x) / scale.x;
        translate.y -= (e.clientY - pMouse.y) / scale.y;
        pMouse = {x: e.clientX, y: e.clientY};
    }
    updatePanSpan(translate);
});
document.addEventListener("mouseup", (e) => {
    pMouse = null;
});
