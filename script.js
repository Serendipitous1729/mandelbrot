const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

const panSpan = document.getElementById("pan");
const zoomSpan = document.getElementById("zoom");

function prettyDecimal(decimal, places, signed = true) {
    let zeroes = new Array(places+1);
    zeroes.fill("0");
    if(decimal == 0) return "0."+zeroes.join("").toString().slice(0, -2);

    let final = (decimal > 0 ? "+" : "") + (decimal.toString() + zeroes.join("")).slice(0, (decimal > 0 ? places-1 : places) + (signed ? 0 : 1));
    if(!signed) return final.slice(1, final.length);
    return final;
}
function updatePanSpan(pan) {
    panSpan.innerText = `x = ${prettyDecimal(pan.x, 7)}, y = ${prettyDecimal(pan.y, 7)}`;
}
function updateZoomSpan(zoom) {
    zoomSpan.innerText = `${prettyDecimal(zoom, 7, false)}`;
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
const showJuliaUniformLocation = gl.getUniformLocation(program, "show_julia");
const cJuliaUniformLocation = gl.getUniformLocation(program, "c_julia");
const jTranslateUniformLocation = gl.getUniformLocation(program, "u_julia_translate");
const jScaleUniformLocation = gl.getUniformLocation(program, "u_julia_scale");
const paletteUniformLocation = gl.getUniformLocation(program, "palette");

let showJuliaSet = false;
let scale = {x: 1, y: 1};
let translate = {x: 0, y: 0};
let scrollSpeed = 0.100;
let jScale = {x: 1, y: 1};
let jTranslate = {x: 0, y: 0};
let palette = 0;

sizeCanvas(canvas);
scale.x = Math.min(canvas.width, canvas.height)/2;
scale.y = scale.x;
jScale.x = scale.x;
jScale.y = scale.x;

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
    gl.uniform1i(showJuliaUniformLocation, showJuliaSet);
    gl.uniform2f(cJuliaUniformLocation, -translate.x, -translate.y);
    gl.uniform2f(jTranslateUniformLocation, jTranslate.x, jTranslate.y);
    gl.uniform2f(jScaleUniformLocation, jScale.x, jScale.y);
    gl.uniform1i(paletteUniformLocation, palette);


    // now actually draw the stuff
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    window.requestAnimationFrame(update);
}

update();
updatePanSpan(translate);
updateZoomSpan(scale.x);

// the part that shows the mandelbrot
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    if(showJuliaSet && e.clientX >= canvas.width/2) return; // showing juliaset panel and hovered on that side

    let pScaleX = scale.x;
    scale.x -= Math.sign(e.deltaY) * scrollSpeed * scale.x;
    scale.x = Math.max(scale.x, Math.min(canvas.width, canvas.height)/10);
    scale.y = scale.x;

    let mouseX, mouseY
    if(showJuliaSet) {
        mouseX = e.clientX  - canvas.width/4;
    } else {
        mouseX = e.clientX - canvas.width/2;
    }
    mouseY = canvas.height/2 - e.clientY;

    let theCoordsNowAtTheMouse = (mouseX) / pScaleX;
    translate.x -= (theCoordsNowAtTheMouse * scale.x - mouseX) / scale.x;
    let theCoordsNowAtTheMouseY = mouseY / pScaleX;
    translate.y -= (theCoordsNowAtTheMouseY * scale.x - mouseY) / scale.x;
    // i hate this so much and no clue how it works but i dont want to think so pls dont touch it
    // "the translate cancels out" just in case you know/remember what that means

    updatePanSpan(translate);
    updateZoomSpan(scale.x);
}, {passive: false});

// julia set panel on right
canvas.addEventListener("wheel", (e) => {
    if(!showJuliaSet) return; // not showing julia set
    if(e.clientX < canvas.width/2) return; // not on the correct side of canvas

    let pScaleX = jScale.x;
    jScale.x -= Math.sign(e.deltaY) * scrollSpeed * jScale.x;
    jScale.x = Math.max(jScale.x, Math.min(canvas.width, canvas.height)/10);
    jScale.y = jScale.x;

    let mouseX, mouseY
    mouseX = e.clientX - 0.75*canvas.width; // wrt 3/4 mark, center of juliaset panel
    mouseY = canvas.height/2 - e.clientY;

    let theCoordsNowAtTheMouse = (mouseX) / pScaleX;
    jTranslate.x -= (theCoordsNowAtTheMouse * jScale.x - mouseX) / jScale.x;
    let theCoordsNowAtTheMouseY = mouseY / pScaleX;
    jTranslate.y -= (theCoordsNowAtTheMouseY * jScale.x - mouseY) / jScale.x;

}, {passive: false});

let pMouse = null;
let mouseInJuliaHalf = false;
canvas.addEventListener("mousedown", (e) => {
    pMouse = {x: e.clientX, y: e.clientY};
    if(showJuliaSet && e.clientX >= canvas.width/2) mouseInJuliaHalf = true;
});
canvas.addEventListener("mousemove", (e) => {
    if(pMouse !== null) {
        console.log("ok")
        if(mouseInJuliaHalf) {
            jTranslate.x += (e.clientX - pMouse.x)*2 / (jScale.x); // scale halved, so distances are doubled
            jTranslate.y -= (e.clientY - pMouse.y)*2 / (jScale.y);
        } else {
            translate.x += (e.clientX - pMouse.x)*(showJuliaSet?2:1) / (scale.x);
            translate.y -= (e.clientY - pMouse.y)*(showJuliaSet?2:1) / (scale.y);
            updatePanSpan(translate);
        }
        pMouse = {x: e.clientX, y: e.clientY};
    }
});
canvas.addEventListener("mouseup", (e) => {
    pMouse = null;
    mouseInJuliaHalf = false;
});

document.getElementById("recenter-j").style.display = showJuliaSet ? "inline-block" : "none";
document.getElementById("julia").addEventListener("click", (e) => {
    showJuliaSet = !showJuliaSet;
    document.getElementById("recenter-j").style.display = showJuliaSet ? "inline-block" : "none";
    if(!showJuliaSet) {
        jTranslate = {x: 0, y: 0};
        jScale.x = Math.min(canvas.width, canvas.height)/2;
        jScale.y = jScale.x;
    }
    e.target.innerText = showJuliaSet ? "hide julia set" : "show julia set";
});

document.getElementById("recenter-m").addEventListener("click", () => {
    translate = {x: 0, y: 0};
    scale.x = Math.min(canvas.width, canvas.height)/2;
    scale.y = scale.x;
});
document.getElementById("recenter-j").addEventListener("click", () => {
    jTranslate = {x: 0, y: 0};
    jScale.x = Math.min(canvas.width, canvas.height)/2;
    jScale.y = jScale.x;
});

document.getElementById("color").addEventListener("click", () => {
    palette = (palette + 1) % 4;
});