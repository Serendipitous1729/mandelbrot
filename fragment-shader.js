const FRAGMENT_SHADER = /* glsl */`
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision highp float;

varying vec4 v_coords;

uniform vec2 u_resolution;
uniform vec2 u_translate;
uniform vec2 u_scale;
uniform bool show_julia;
uniform vec2 c_julia;
uniform vec2 u_julia_scale;
uniform vec2 u_julia_translate;
uniform int palette;

vec4 HSVCircle(float t) {
    // Normalize t to a range suitable for color generation
    float normalizedT = t * 360.0;
    
    // Generate color using HSV to RGB conversion
    float hue = mod(normalizedT, 360.0);
    float saturation = 1.0;
    float value = 1.0;
    
    float c = value * saturation;
    float x = c * (1.0 - abs(mod(hue / 60.0, 2.0) - 1.0));
    float m = value - c;
    
    vec3 rgb;
    if (hue < 60.0) {
        rgb = vec3(c, x, 0.0);
    } else if (hue < 120.0) {
        rgb = vec3(x, c, 0.0);
    } else if (hue < 180.0) {
        rgb = vec3(0.0, c, x);
    } else if (hue < 240.0) {
        rgb = vec3(0.0, x, c);
    } else if (hue < 300.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }
    
    rgb += vec3(m);
    
    return vec4(rgb, 1.0);
}

vec4 getColor(int i, int maxIterations) {
    // Normalize the iteration count to a value between 0 and 1
    float t = sin(3.14159265358979323 * float(i) / float(maxIterations));
    if(palette == 0){
        return vec4(0., t - 0.5, t * 2., 1.); // blue
    } else if (palette == 1){
        return HSVCircle(t); // rainbow
    } else if (palette == 2){
        return vec4(t, t, t, 1.);
    } else if (palette == 3){
        return vec4(0., 0., t, 1.);
    }
}


void main() {
    // gl_FragColor is a special variable a fragment shader is responsible for setting
    vec2 offset_v_coords = v_coords.xy;
    vec2 pixelCoords;
    vec2 t;

    if(show_julia) {
        if(v_coords.x >= 0.) {
            // center the right side, the julia set
            offset_v_coords.x -= 0.5;

            pixelCoords = (offset_v_coords.xy * u_resolution);
            t = pixelCoords / u_julia_scale - u_julia_translate; // transformed coords
        }else{
            // center the left side, the mandelbrot set
            offset_v_coords.x += 0.5;

            pixelCoords = (offset_v_coords.xy * u_resolution);
            t = pixelCoords / u_scale - u_translate; // transformed coords
        }
    } else {
        pixelCoords = (v_coords.xy * u_resolution * 0.5);
        t = pixelCoords / u_scale - u_translate; // transformed coords
    }

    vec4 finalColor;
    const int max_iterations = 500;

    if(show_julia && v_coords.x <= 1./u_resolution.x && v_coords.x >= -1./u_resolution.x ){
        // border
        gl_FragColor = vec4(1., 1., 1., 1.);
    } else if(show_julia && v_coords.x > 0.) {
        // julia set code
        finalColor = vec4(0.0, 0.0, 1.0, 1.0); // inside set

        vec2 z = t;
        for(int i = 0; i < max_iterations; i++){
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y); // square it
            z += c_julia; // add c
            if(z.x * z.x + z.y * z.y > 4.0) {
                finalColor = getColor(i, max_iterations);
                break;
            }
        }
    } else {
        // mandelbrot set code

        if(show_julia && 
            (v_coords.x + 0.5)*(v_coords.x + 0.5)*u_resolution.x*u_resolution.x + v_coords.y*v_coords.y*u_resolution.y*u_resolution.y < 10.){
            finalColor = vec4(1., 1., 1., 1.);
            return;
        }

        finalColor = vec4(0.0, 0.0, 0.0, 1.0); // inside set

        vec2 z = vec2(0.0, 0.0);
        for(int i = 0; i < max_iterations; i++){
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y); // square it
            z += t; // add c
            if(z.x * z.x + z.y * z.y > 4.0) {
                finalColor = getColor(i, max_iterations);
                break;
            }
        }
    }

    gl_FragColor = finalColor;
}
`;