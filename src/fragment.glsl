        precision highp float;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform sampler2D uPressureTop;
        uniform sampler2D uPressureBottom;
        uniform sampler2D uPreviousFrame; // フレームバッファからのテクスチャ
        void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        // 上から下への圧力
            float pressureTop = texture2D(uPressureTop, vec2(uv.x, 0.0)).r;

            // 下から上への圧力
            float pressureBottom = texture2D(uPressureBottom, vec2(uv.x, 0.0)).r;

            // 滲みアルゴリズム
            vec3 rgbTop = vec3(0.2, 0.4, 0.8);   // 上部の色（青系）
            vec3 rgbBottom = vec3(0.8, 0.3, 0.2); // 下部の色（赤系）

            if (uTime < 3.0) {
                // 初期状態：上下分割
                gl_FragColor = vec4(uv.y > 0.5 ? rgbTop : rgbBottom, 1.0);

            } else {

           float animationTime = uTime - 3.0;

         // 境界面 (Y = 0.5) の距離計算
         float distanceToBoundary = abs(uv.y - 0.5);

         if (uv.y < 0.5) {
            // 上部の圧力を取得
            float pressure = texture2D(uPressureTop, vec2(uv.x, 0.0)).r;

            // 自身と上部のピクセルの座標を計算
            vec2 upperUv = vec2(uv.x, clamp(uv.y - 1.0 / uResolution.y, 0.0, 1.0));

            // 上部のピクセルの色
            // vec3 upperColor = mix(rgbBottom, rgbTop, clamp(upperUv.y, 0.0, 1.0));
            vec4 upperPixelColor = texture2D(uPreviousFrame, uv + vec2(0.0, -1.0 / uResolution.y));

            // 自身の色
            vec3 selfColor = mix(rgbBottom, rgbTop, clamp(uv.y, 0.0, 1.0));

            // ブレンド強度を計算
            float blendStrength = pressure * exp(-distanceToBoundary * 10.0) * (animationTime / 500.0);
    
            // 新しい色を計算
            vec3 blendedRgb = mix(selfColor, upperColor.xyz, blendStrength);

            gl_FragColor = vec4(blendedRgb, 1.0);
        } else {
            // 下部の圧力を取得
            //float pressure = texture2D(uPressureBottom, vec2(uv.x, 0.0)).r;

            // 自身と下部のピクセルの座標を計算
            //vec2 lowerUv = vec2(uv.x, clamp(uv.y + 1.0 / uResolution.y, 0.0, 1.0));
            // 下部のピクセルの色
            //vec3 lowerColor = mix(rgbBottom, rgbTop, clamp(lowerUv.y, 0.0, 1.0));
            // 自身の色
            //vec3 selfColor = mix(rgbBottom, rgbTop, clamp(uv.y, 0.0, 1.0));
            // ブレンド強度を計算
            //float blendStrength = pressure * exp(-distanceToBoundary * 10.0) * (animationTime / 500.0);
            // 新しい色を計算
            //vec3 blendedRgb = mix(selfColor, lowerColor, blendStrength);
            //gl_FragColor = vec4(blendedRgb, 1.0);
        }
     }
  }
