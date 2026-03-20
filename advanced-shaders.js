// ADVANCED WEBGL SHADERS FOR ULTIMATE PORTFOLIO
// Vertex + Fragment shaders for hyper effects

// VERTEX SHADER - Displacement Wave
const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform float uWaveIntensity;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Wave displacement
    float wave = sin(pos.x * 0.1 + uTime) * cos(pos.y * 0.1 + uTime * 1.3) * uWaveIntensity;
    pos.z += wave;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

// FRAGMENT SHADER - Holographic Neon Glow
const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Holographic scanlines
    float scan = sin(uv.y * 200.0 + uTime * 10.0) * 0.1;
    
    // Radial glow
    float dist = length(uv);
    float glow = 1.0 / (1.0 + dist * 5.0);
    
    // Color mixing
    vec3 color = mix(uPrimaryColor, uSecondaryColor, sin(uTime + dist * 5.0) * 0.5 + 0.5);
    color += scan * 0.3;
    
    gl_FragColor = vec4(color * glow, glow * 0.8);
}
`;

// POST-PROCESSING BLOOM SHADER
const bloomFragment = `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float bloomStrength;
uniform float threshold;

varying vec2 vUv;

void main() {
    vec4 sum = vec4(0);
    vec4 base = texture2D(tDiffuse, vUv);
    
    // Threshold bright areas
    if (base.r + base.g + base.b > threshold * 3.0) {
        sum = base;
    }
    
    gl_FragColor = mix(base, sum * bloomStrength, 0.8);
}
`;

// Export for main script
window.AdvancedShaders = {
    vertexShader,
    fragmentShader,
    bloomFragment
};
