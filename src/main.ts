import * as THREE from "three";

// シーン、カメラ、レンダラーの初期化
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.set(0, 0, 1);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// フラグメントシェーダー
const fragmentShader = `
precision highp float;

uniform vec2 uResolution; // 画面の解像度
uniform vec3 uLightDirection; // 光の方向

// RGBをHSVに変換する関数
vec3 rgbToHsv(vec3 c) {
    float cMax = max(c.r, max(c.g, c.b));
    float cMin = min(c.r, min(c.g, c.b));
    float delta = cMax - cMin;

    float h = 0.0;
    if (delta > 0.0) {
        if (cMax == c.r) {
            h = mod((c.g - c.b) / delta, 6.0);
        } else if (cMax == c.g) {
            h = (c.b - c.r) / delta + 2.0;
        } else {
            h = (c.r - c.g) / delta + 4.0;
        }
        h /= 6.0;
    }
    float s = cMax == 0.0 ? 0.0 : delta / cMax;
    float v = cMax;
    return vec3(h, s, v);
}

// 高度計算
float calculateHeight(vec3 color) {
    vec3 hsv = rgbToHsv(color);
    return hsv.x + hsv.y; // 色相 (H) + 彩度 (S)
}

// フラグメントシェーダーの主関数
void main() {
    // 現在のピクセル座標
    vec2 uv = gl_FragCoord.xy / uResolution;

    // グリッドサイズ (N x M)
    int N = 10; // 横の分割数
    int M = 10; // 縦の分割数
    vec2 gridSize = vec2(float(N), float(M));

    // グリッド内でのUV座標
    vec2 gridUv = floor(uv * gridSize) / gridSize;

    // 高度（ランダムな色から算出）
    vec3 randomColor = vec3(fract(sin(dot(gridUv, vec2(12.9898, 78.233))) * 43758.5453));
    float height = calculateHeight(randomColor);

    // 法線ベクトル計算 (擬似的に)
    vec3 normal = normalize(vec3(0.0, 0.0, 1.0) + height * uLightDirection);

    // 光の影響（ランバート反射）
    float lightIntensity = max(0.0, dot(normal, normalize(uLightDirection)));

    // 最終色
    vec3 finalColor = randomColor * lightIntensity;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// シェーダーマテリアルの作成
const material = new THREE.ShaderMaterial({
    uniforms: {
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uLightDirection: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
    },
    fragmentShader,
});

// 平面ジオメトリとメッシュの作成
const geometry = new THREE.PlaneGeometry(2, 2);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// ウィンドウサイズ変更時のリサイズ対応
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    material.uniforms.uResolution.value.set(width, height);
});

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

