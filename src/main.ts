import * as THREE from 'three';
import fragmentShader from './shader.frag';


// Quintic spline function
function quinticSpline(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Generate grid values with random noise
function generateGridValues(width: number, step: number): number[] {
  const values: number[] = new Array(Math.floor(width / step) + 1);
  for (let i = 0; i < values.length; i++) {
    values[i] = Math.random(); // Random values between 0 and 1
  }
  return values;
}

// Generate 1D Perlin noise array
function generatePerlinNoise(width: number, step: number, gridValues: number[]): number[] {
  const noise: number[] = new Array(width);

  for (let x = 0; x < width; x++) {
    const gridIndex = Math.floor(x / step);
    const t: number = (x % step) / step; // Position within the grid
    noise[x] = (gridIndex < gridValues.length - 1)
      ? quinticSpline(t) * (gridValues[gridIndex + 1] - gridValues[gridIndex]) + gridValues[gridIndex]
      : gridValues[gridIndex];
  }

  return noise;
}

// Create a DataTexture from single-channel noise
function createRenderTargetFromNoise(noise: number[], width: number): THREE.DataTexture {
  const data: Uint8Array = new Uint8Array(noise.map(value => Math.floor(value * 255)));
  const texture: THREE.DataTexture = new THREE.DataTexture(data, width, 1, THREE.RedFormat, THREE.UnsignedByteType);
  texture.needsUpdate = true;
  return texture;
}

// GPUのメモリアクセスは通常4バイトアライメントが望ましい
function createRenderTargetFromRGBNoise(
  rNoise: number[],
  gNoise: number[],
  bNoise: number[],
  width: number
): THREE.DataTexture {
  // RGBAフォーマットに変更（4チャンネル）
  const data: Uint8Array = new Uint8Array(width * 4);
  
  for (let i = 0; i < width; i++) {
    data[i * 4] = Math.floor(rNoise[i] * 255);     // R
    data[i * 4 + 1] = Math.floor(gNoise[i] * 255); // G
    data[i * 4 + 2] = Math.floor(bNoise[i] * 255); // B (使う予定はないが一応入れておく）
    data[i * 4 + 3] = 255;                         // A (完全な不透明度)
  }

  const texture: THREE.DataTexture = new THREE.DataTexture(
    data,
    width,
    1,
    THREE.RGBAFormat,  // RGBAフォーマットに変更
    THREE.UnsignedByteType
  );
  
  texture.needsUpdate = true;
  return texture;
}




// Texture size and grid setup
const textureWidth: number = Math.floor(window.innerWidth * 10);
const gridStep: number = 500; // Grid spacing

// Generate noise for each channel
const rGridValues: number[] = generateGridValues(textureWidth, gridStep);
const gGridValues: number[] = generateGridValues(textureWidth, gridStep);
const bGridValues: number[] = generateGridValues(textureWidth, gridStep);

const rNoise: number[] = generatePerlinNoise(textureWidth, gridStep, rGridValues);
const gNoise: number[] = generatePerlinNoise(textureWidth, gridStep, gGridValues);
const bNoise: number[] = generatePerlinNoise(textureWidth, gridStep, bGridValues);

const noiseTextureRGB: THREE.DataTexture = createRenderTargetFromRGBNoise(rNoise, gNoise, bNoise, textureWidth);

// Draw graph with noise texture
const graphGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(10, 5);


// フレームバッファ設定
const renderTarget1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});
const renderTarget2 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});

// 現在のターゲットを管理するフラグ
let currentRenderTarget = renderTarget1;
let nextRenderTarget    = renderTarget2;


// Uniform設定
const width = 256;
const height = 1; // 圧力はX方向だけを考慮

// Uniforms
const uniforms = {
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uTime: { value: 0.0 },
  uPreviousFrame: { value: currentRenderTarget.texture }, // 初期状態では renderTarget1 のテクスチャ
  uPressure: { value: noiseTextureRGB },
};




// ShaderMaterialの作成
const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,
  fragmentShader
  : `
`
});

// 平面に適用
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
const scene = new THREE.Scene();
scene.add(plane);

// レンダラーとカメラ
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

// アニメーションループ
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  
  // 時間を更新
  uniforms.uTime.value = clock.getElapsedTime();

  // シェーダに現在のフレームのテクスチャを渡す
  material.uniforms.uPreviousFrame.value = currentRenderTarget.texture;
  
  // 次フレーム用にターゲットを切り替え
  const nextRenderTarget = currentRenderTarget === renderTarget1 ? renderTarget2 : renderTarget1;
  
  // 現在のシーンを次のターゲットにレンダリング
  renderer.setRenderTarget(nextRenderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null); // デフォルトバッファに戻す
  
  // 現在のターゲットを更新
  currentRenderTarget = nextRenderTarget;

  // レンダリング
  renderer.render(scene, camera);
}
animate();

