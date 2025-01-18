const FRAGMENT_SHADER = /* glsl */`
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision highp float;

varying vec4 v_coords;

uniform vec2 u_resolution;
uniform vec2 u_translate;
uniform vec2 u_scale;

void main() {
    // gl_FragColor is a special variable a fragment shader is responsible for setting
    vec2 pixelCoords = (v_coords.xy * u_resolution * 0.5);
    vec2 t = pixelCoords / u_scale - u_translate; // transformed coords

    vec2 z = vec2(0.0, 0.0);
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    for(int i = 0; i < 1000; i++){
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y); // square it
        z += t; // add c
        if(z.x * z.x + z.y * z.y > 4.0) {
            finalColor = vec4(0.0, 0.0, float(i) / 100.0, 1.0);
            break;
        }
    }

    gl_FragColor = finalColor;
}
`;