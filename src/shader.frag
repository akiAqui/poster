precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uPreviousFrame; // フレームバッファからのテクスチャ
uniform sampler2D uPressure;      // DataTexture/境界面での双方向圧力関数
                                  // （RGBAだがRGBにPerlinを定義。上下方向なのでRGのみ利用予定）

void main() {
  float delay=3.0;
  float a=10.0;
  float b=10.0;

  vec2 uv = gl_FragCoord.xy / uResolution;
  // 圧力
  float pressureTop 　 = texture2D(uPressure, vec2(uv.x, 0.0)).r;
  float pressureBottom = texture2D(uPressure, vec2(uv.x, 0.0)).g;
  
  // 初期色の手動設定
  vec3 rgbTop    = vec3(0.2, 0.4, 0.8);   // 上部の色（青系）
  vec3 rgbBottom = vec3(0.8, 0.3, 0.2);   // 下部の色（赤系）
  
  if (uTime < delay) {
    // 初期状態：上下分割
    gl_FragColor = vec4(uv.y > 0.5 ? rgbTop : rgbBottom, 1.0);
    
  } else {
    float aTime = uTime - delay;
    
    float distanceToBoundary = abs(uv.y - 0.5); // 境界面からの (Y = 0.5) の距離を取得
    float pressure = texture2D(uPressure, vec2(uv.x, 0.0)).r;// 現在位置の圧力を取得
    float blendStrength = exp(-a*distanceToBoundary-b*pressure);　// ブレンド強度=exp(-a*距離-b*圧力)
    
    if (uv.y < 0.5) { //下部の色計算、上部の圧力を取得
      // 自身と上部のピクセルの座標を計算
      // vec2 upperUv = vec2(uv.x, clamp(uv.y - 1.0 / uResolution.y, 0.0, 1.0));
      
      // 上部のピクセルの色取得
      //vec4 upperColor = texture2D(uPreviousFrame, uv + vec2(0.0, -1.0 / uResolution.y));
      vec4 upperColor = texture2D(uPreviousFrame, upperUv);

      // 自身のピクセルの色取得
      vec4 selfColor = texture2D(uPreviousFrame, uv);      
      
      // 新しい色を計算
      vec3 blendedRgb = mix(selfColor, upperColor.xyz, blendStrength);
      
      gl_FragColor = vec4(blendedRgb, 1.0);
    } else {
    }
  }
}
