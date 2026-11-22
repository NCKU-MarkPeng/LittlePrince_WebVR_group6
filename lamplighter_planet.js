

(function () {
  if (!window.AFRAME) {
    console.error('[lamplighter-planet] 請把 lamplighter-planet.js 放在載入 A-Frame 的那一行之後');
    return;
  }

  const BASE = './';

  /* 點燈人星球本體
     lamplighter_root 把整組往上移 3 公尺，讓星球中心剛好在 planet-lamplighter 的位置
     （原本是星球頂端在原點）；裡面所有東西的相對位置都跟原本一樣 */
  const LAMPLIGHTER_PLANET_HTML = /* html */ `
    <a-entity id="lamplighter_root" position="0 3 0">

      <!-- ===== 取代原本的白色環境光（0.15） =====
           環境光會照到整個場景，所以改成四盞從四面八方照向星球的點光源。
           decay: 0 = 不隨距離變暗；distance: 25 = 超過 25 公尺就照不到 -->
      <a-entity id="lamplighter_ambient">
        <a-entity position="7 4 7"
                  light="type: point; color: #FFFFFF; intensity: 0.14; distance: 25; decay: 0"></a-entity>
        <a-entity position="7 -10 -7"
                  light="type: point; color: #FFFFFF; intensity: 0.14; distance: 25; decay: 0"></a-entity>
        <a-entity position="-7 4 -7"
                  light="type: point; color: #FFFFFF; intensity: 0.14; distance: 25; decay: 0"></a-entity>
        <a-entity position="-7 -10 7"
                  light="type: point; color: #FFFFFF; intensity: 0.14; distance: 25; decay: 0"></a-entity>
      </a-entity>

      <!-- 1. 星球本體：半徑 3 公尺 -->
      <!-- repeat="U V" 代表水平與垂直方向的拼貼次數。數值越大，地磚越小 -->
      <a-sphere id="lamplighter_planet" radius="3" position="0 -3 0"
        src="url(${BASE}stoneroad.png)"
        repeat="6 3"
        roughness="1">
      </a-sphere>

      <!-- 2. 路燈模型 -->
      <a-entity id="lamplighter_lamp" gltf-model="url(${BASE}old_english_street_lamp_.obj.glb)"
                position="0 0 0" scale="0.4 0.4 0.4">

        <!-- 3. 點燈動畫光源（本來就只照附近，保留原樣）
             亮度從 0 到 2.5 來回循環，週期 3 秒。
             加上 decay="0"：新版 A-Frame 的點光源預設會隨距離快速變暗，
             這樣設才接近組員在 1.4 版看到的亮度 -->
        <a-light id="lamplighter_lamp-light" type="point" color="#FFAA20" distance="35" decay="0" position="0 8.5 0"
                 animation="property: light.intensity; from: 0.0; to: 2.5; dir: alternate; loop: true; dur: 3000; easing: easeInOutQuad">
        </a-light>

      </a-entity>

      <!-- 4. 星球日夜交替光源（日光）
           原本是平行光，會照到整個場景（地球、B612 都會跟著忽明忽暗），
           改成繞著星球轉的點光源：轉到哪一側，哪一側就是白天 -->
      <a-entity id="lamplighter_sun-pivot" position="0 -3 0"
        animation="property: rotation; from: 0 0 0; to: 0 0 360; loop: true; dur: 6000; easing: linear">
        <a-entity id="lamplighter_sun" position="0 15 0"
                  light="type: point; color: #FFF4E0; intensity: 1.5; distance: 30; decay: 0"></a-entity>
      </a-entity>

      <!-- 5. 點燈人模型 -->
      <a-entity id="lamplighter_lamplighter" gltf-model="url(${BASE}lamplighter.glb)"
                position="0 0.5 -1.7" scale="1 1 1" rotation="-25 0 0"></a-entity>

      <a-entity id="lamplighter_prince-pivot" position="0 -4.8 0" rotation="0 0 -25">

        <!-- 6. 磚塊造景模型 -->
        <a-entity id="lamplighter_bricks" gltf-model="url(${BASE}medieval_bricks_wall.glb)"
                  position="0 4.4 1" scale="0.8 0.8 2.6" rotation="-10 -90 -20"></a-entity>

        <!-- 7. 小王子模型 -->
        <a-entity id="lamplighter_prince" gltf-model="url(${BASE}the_little_prince/scene.gltf)"
            position="-1 4.45 -1"
            rotation="0 -60 20"
            scale="0.5 0.5 0.5">
        </a-entity>
      </a-entity>

    </a-entity>
`;

  AFRAME.registerComponent('lamplighter-planet', {
    init: function () {
      if (this.el.querySelector('#lamplighter_root')) return; // 已經放過就不重複放
      this.el.insertAdjacentHTML('beforeend', LAMPLIGHTER_PLANET_HTML);
    }
  });
})();
