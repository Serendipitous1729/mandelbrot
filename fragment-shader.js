const FRAGMENT_SHADER = /* glsl */`
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision highp float;

varying vec4 v_coords;

uniform vec2 u_resolution;
uniform vec2 u_translate;
uniform vec2 u_scale;

vec4 getColor(int i, int maxIterations) {
    // Normalize the iteration count to a value between 0 and 1
    float t = sin(3.14159265358979323 * float(i) / float(maxIterations));
    return vec4(t, t, t, 1.0);
}


void main() {
    // gl_FragColor is a special variable a fragment shader is responsible for setting
    vec2 pixelCoords = (v_coords.xy * u_resolution * 0.5);
    vec2 t = pixelCoords / u_scale - u_translate; // transformed coords

    vec2 z = vec2(0.0, 0.0);
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    const int max_iterations = 500;
    for(int i = 0; i < max_iterations; i++){
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y); // square it
        z += t; // add c
        if(z.x * z.x + z.y * z.y > 4.0) {
            finalColor = getColor(i, max_iterations);
            break;
        }
    }

    gl_FragColor = finalColor;
}
`;