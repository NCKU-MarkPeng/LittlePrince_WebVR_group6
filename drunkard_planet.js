/* =====================================================================
   drunkard-planet.js — 酒鬼星球（小行星 327）
   ---------------------------------------------------------------------
   用法：
     1. 把這個檔案放在 index.html 同一個資料夾
     2. 在 <head> 裡、A-Frame 那行下面加（aframe-extras 讓酒鬼的動畫會動）：
          <script src="https://cdn.jsdelivr.net/npm/aframe-extras@7.5.0/dist/aframe-extras.min.js"></script>
          <script src="drunkard-planet.js"></script>
     3. 在 planet-drunkard 上加 drunkard-planet，裡面留空：
          <a-entity id="planet-drunkard" position="..." drunkard-planet></a-entity>

   模型檔：路徑是相對於 index.html（不是相對於這個 js 檔），
   預設在 index.html 旁邊的 assets/models/ 裡；放別的地方就改下面的 BASE。

   跟原本組員的版本相比：
     - 刪掉天空、背景色、攝影機、smooth-movement
     - 原本的 <a-assets> 改成直接在物件上寫檔案路徑（url(...)）
     - 會照到整個場景的環境光、平行光，改成只照星球附近的點光源
     - 酒瓶產生器（procedural-bottle）、星星、漂浮粒子、所有動畫都保留
     - 所有 id 都是 drunkard_ 開頭
   ===================================================================== */
(function () {
  if (!window.AFRAME) {
    console.error('[drunkard-planet] 請把 drunkard-planet.js 放在載入 A-Frame 的那一行之後');
    return;
  }

  const BASE = './';

  /* ===== 燈光亮度（改這裡就好） =====
     組員原本：白色環境光 0.25、暖黃平行光 1.5。
     你的場景已經有全場景的宇宙底光 0.15，所以這裡的底光設 0.10，
     加起來跟組員原本的 0.25 差不多。 */
  const AMBIENT_INTENSITY = 0.10;  // 四盞底光，每盞的亮度
  const SUN_INTENSITY = 1.5;       // 取代平行光的暖黃主光
  const BOTTOM_INTENSITY = 0.6;    // 從下方往上照的補光，比主光 1.5 弱

   /* ===================== 0. 隱藏模型裡的零件 =====================
     用法：hide-parts="names: Object_3, Object_5"
     模型載入後，把名字對得上的零件藏起來（連同它底下的子零件） */
  if (!AFRAME.components['hide-parts']) {
        AFRAME.registerComponent('hide-parts', {
            schema: { names: { type: 'array', default: [] } },
            init: function () {
                this.apply = this.apply.bind(this);
                this.el.addEventListener('model-loaded', this.apply);
                if (this.el.getObject3D('mesh')) this.apply();
            },
            update: function () { if (this.el.getObject3D('mesh')) this.apply(); },
            apply: function () {
                const root = this.el.getObject3D('mesh');
                if (!root) return;
                const want = this.data.names.map(n => n.trim()).filter(Boolean);
                const found = [];
                root.traverse(o => {
                if (want.includes(o.name)) { o.visible = false; found.push(o.name); }
                });
                const missing = want.filter(n => !found.includes(n));
                if (missing.length) console.warn('[hide-parts] 找不到這些零件：', missing.join(', '));
            },
            remove: function () { this.el.removeEventListener('model-loaded', this.apply); }
        });
    }

  /* ===================== 1. 酒瓶產生器（組員原本的元件） ===================== */
  if (!AFRAME.components['procedural-bottle']) {
    AFRAME.registerComponent('procedural-bottle', {

        schema: {
            style: {default: 'realistic'},
            glass: {default: '#54212b'},
            label: {default: '#d8bd91'}
        },

        init: function () {

            const group = new THREE.Group();

            const glassMat = new THREE.MeshStandardMaterial({
                color: this.data.glass,
                roughness: 0.25,
                metalness: 0.15
                });

            const labelMat = new THREE.MeshStandardMaterial({
            color: this.data.label,
            roughness: 0.7
            });

            const corkMat = new THREE.MeshStandardMaterial({
            color: '#a77b4e'
            });

            function add(geometry, material, x, y, z, sx=1, sy=1, sz=1) {
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, y, z);
                mesh.scale.set(sx, sy, sz);
                group.add(mesh);
            }

            if (this.data.style === 'realistic') {

            // Bottle body
            add(
                new THREE.CylinderGeometry(0.13, 0.13, 0.45, 20),
                glassMat, 0, 0.05, 0
            );

            // Shoulder
            add(
                new THREE.CylinderGeometry(0.065, 0.13, 0.16, 20),
                glassMat, 0, 0.355, 0
            );

            // Neck
            add(
                new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16),
                glassMat, 0, 0.525, 0
            );

            // Cork
            add(
                new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
                corkMat, 0, 0.655, 0
            );

            // Label
            add(
                new THREE.CylinderGeometry(0.132, 0.132, 0.15, 20),
                labelMat, 0, 0.05, 0
            );

            } else {

                // Cartoon bottle body
                add(
                    new THREE.SphereGeometry(1, 20, 16),
                    glassMat, 0, 0, 0,
                    0.18, 0.23, 0.15
                );

                // Cartoon shoulder
                add(
                    new THREE.SphereGeometry(1, 16, 12),
                    glassMat, 0, 0.17, 0,
                    0.12, 0.12, 0.12
                );

                // Crooked neck
                const neck = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.045, 0.07, 0.17, 12),
                    glassMat
                );

                neck.position.set(0.045, 0.31, 0);
                neck.rotation.z = -0.25;
                group.add(neck);

                // Cork
                add(
                    new THREE.CylinderGeometry(0.04, 0.04, 0.07, 12),
                    corkMat, 0.065, 0.43, 0
                );

            // Cartoon label
                add(
                    new THREE.SphereGeometry(1, 16, 12),
                    labelMat, 0, -0.02, 0,
                    0.183, 0.09, 0.155
                );
            }

            this.el.object3D.add(group);
        }
    });
}

  /* ===================== 2. 酒鬼星球本體 =====================
     drunkard_root 把整組往上移 2.44 公尺，讓浮島的中心剛好在 planet-drunkard 的位置；
     裡面所有東西的相對位置都跟原本一樣 */
  const DRUNKARD_PLANET_HTML = /* html */ `
  <a-entity id="drunkard_root" position="0 2.44 0">

    <!-- ===== 燈光：只照星球附近 =====
         decay: 0 = 不隨距離變暗；distance = 超過這個距離就照不到，不會影響其他星球 -->
    <a-entity id="drunkard_lights">
      <!-- 取代白色環境光：四盞點光源從四面八方照向浮島 -->
      <a-entity position="9.2 6.8 9.2"
                light="type: point; color: #ffffff; intensity: ${AMBIENT_INTENSITY}; distance: 112.5; decay: 0"></a-entity>
      <a-entity position="9.2 -11.6 -9.2"
                light="type: point; color: #ffffff; intensity: ${AMBIENT_INTENSITY}; distance: 112.5; decay: 0"></a-entity>
      <a-entity position="-9.2 6.8 -9.2"
                light="type: point; color: #ffffff; intensity: ${AMBIENT_INTENSITY}; distance: 112.5; decay: 0"></a-entity>
      <a-entity position="-9.2 -11.6 9.2"
                light="type: point; color: #ffffff; intensity: ${AMBIENT_INTENSITY}; distance: 112.5; decay: 0"></a-entity>
      <!-- 取代暖黃平行光：放在原本光線來的方向（左上前方），離浮島中心 25 公尺 -->
      <a-entity id="drunkard_sun-light" position="-9.8 17.1 12.2"
                light="type: point; color: #ffd49a; intensity: ${SUN_INTENSITY}; distance: 137.5; decay: 0"></a-entity>

                      <!-- 底部補光：在浮島中心正下方往上照，讓下面的酒瓶和島底不會太暗
           淡藍色跟上方的暖黃主光做冷暖對比；只照得到朝下的面，不會把上面洗白 -->
      <a-entity id="drunkard_bottom-light" position="0 -10.44 0"
                light="type: point; color: #c8d4ff; intensity: ${BOTTOM_INTENSITY}; distance: 60; decay: 0"></a-entity>
    </a-entity>

      <!-- 星星 -->
    <a-entity>

      <a-sphere position="-8 5 -12" radius="0.06" color="white"></a-sphere>
      <a-sphere position="6 7 -15" radius="0.08" color="white"></a-sphere>
      <a-sphere position="9 2 -10" radius="0.05" color="white"></a-sphere>
      <a-sphere position="-5 8 -18" radius="0.07" color="white"></a-sphere>
      <a-sphere position="2 4 -8" radius="0.05" color="white"></a-sphere>
      <a-sphere position="-3 3 -16" radius="0.05" color="white"></a-sphere>
      <a-sphere position="10 6 -20" radius="0.06" color="white"></a-sphere>
      <a-sphere position="-10 1 -15" radius="0.07" color="white"></a-sphere>

    </a-entity>

    <a-entity
      id="drunkard_floating-island"
      gltf-model="url(${BASE}assets/models/asteroid/scene.gltf)"
      hide-parts="names: Object_3, Object_5"
      position="0 -2 0"
      scale="0.9 0.9 0.9"
      rotation="0 0 0">
    </a-entity>

    <!-- WINE ORBIT -->
<!-- CUSTOM WINE BOTTLE -->

<a-entity id="drunkard_custom-wine-bottle">

  <!-- Bottle body -->
  <a-cylinder
    radius="0.13"
    height="0.55"
    color="#54212b"
    position="0 0.32 0">
  </a-cylinder>

  <!-- Bottle shoulder -->
  <a-cone
    radius-bottom="0.13"
    radius-top="0.065"
    height="0.16"
    color="#54212b"
    position="0 0.675 0">
  </a-cone>

  <!-- Bottle neck -->
  <a-cylinder
    radius="0.065"
    height="0.18"
    color="#54212b"
    position="0 0.84 0">
  </a-cylinder>

  <!-- Cork -->
  <a-cylinder
    radius="0.055"
    height="0.09"
    color="#b18a58"
    position="0 0.975 0">
  </a-cylinder>

  <!-- Label -->
  <a-cylinder
    radius="0.132"
    height="0.17"
    color="#d8bd91"
    position="0 0.32 0">
  </a-cylinder>

</a-entity>
<!-- MULTIPLE WINE ORBITS -->

<!-- ================================= -->
<!-- CUSTOM WINE BOTTLE ORBIT SYSTEM -->
<!-- ================================= -->

<a-entity id="drunkard_wine-system" position="0 -1.9 0">

  <!-- ORBIT 1: HORIZONTAL -->

  <a-entity
    animation="
      property: rotation;
      to: 0 360 0;
      dur: 18000;
      easing: linear;
      loop: true">

    <a-entity
      procedural-bottle="style: realistic; glass: #54212b; label: #d8bd91"
      position="2.3 0.2 0"
      rotation="15 0 30"
      scale="0.75 0.75 0.75">
    </a-entity>

    <a-entity
      procedural-bottle="style: cartoon; glass: #285b42; label: #e4c98b"
      position="-2.3 -0.2 0"
      rotation="0 0 -25"
      scale="0.8 0.8 0.8">
    </a-entity>

    <a-entity
      procedural-bottle="style: realistic; glass: #263e65; label: #d4c5a0"
      position="0 0.4 2.3"
      rotation="25 0 40"
      scale="0.65 0.65 0.65">
    </a-entity>

    <a-entity
      procedural-bottle="style: cartoon; glass: #9a542e; label: #e8d8a8"
      position="0 -0.35 -2.3"
      rotation="-20 0 15"
      scale="0.7 0.7 0.7">
    </a-entity>

  </a-entity>


  <!-- ORBIT 2: DIAGONAL -->

  <a-entity
    rotation="45 0 35"
    animation="
      property: rotation;
      to: 45 360 35;
      dur: 23000;
      easing: linear;
      loop: true">

    <a-entity
      procedural-bottle="style: realistic; glass: #315b40; label: #d8bd91"
      position="2.5 0 0"
      rotation="20 0 45"
      scale="0.65 0.65 0.65">
    </a-entity>

    <a-entity
      procedural-bottle="style: cartoon; glass: #7d3046; label: #e5c58a"
      position="-2.5 0.2 0"
      rotation="0 0 35"
      scale="0.8 0.8 0.8">
    </a-entity>

    <a-entity
      procedural-bottle="style: realistic; glass: #4b4931; label: #c8b17d"
      position="0 0 -2.5"
      rotation="45 0 -20"
      scale="0.7 0.7 0.7">
    </a-entity>

    <a-entity
      procedural-bottle="style: cartoon; glass: #285a72; label: #e5d4a3"
      position="0 0 2.5"
      rotation="-30 0 25"
      scale="0.75 0.75 0.75">
    </a-entity>

  </a-entity>


  <!-- ORBIT 3: STEEP DIAGONAL -->

  <a-entity
    rotation="-35 0 -50"
    animation="
      property: rotation;
      to: -35 360 -50;
      dur: 28000;
      easing: linear;
      loop: true">

    <a-entity
      procedural-bottle="style: cartoon; glass: #a65c32; label: #e9d19c"
      position="2.8 0.3 0"
      rotation="35 0 60"
      scale="0.65 0.65 0.65">
    </a-entity>

    <a-entity
      procedural-bottle="style: realistic; glass: #392d62; label: #d8bd91"
      position="-2.8 -0.3 0"
      rotation="-35 0 20"
      scale="0.7 0.7 0.7">
    </a-entity>

    <a-entity
      procedural-bottle="style: cartoon; glass: #6c7131; label: #e7d19c"
      position="0 0 1.85"
      rotation="45 0 45"
      scale="0.8 0.8 0.8">
    </a-entity>

    <a-entity
      procedural-bottle="style: realistic; glass: #713c38; label: #d8bd91"
      position="0 0 -1.85"
      rotation="0 0 -45"
      scale="0.65 0.65 0.65">
    </a-entity>

  </a-entity>

</a-entity>
    <!-- ================================= -->
    <!-- 6. WINE MODEL 1 -->
    <!-- ================================= -->

    <a-entity
      id="drunkard_wine-bottles"
      gltf-model="url(${BASE}assets/models/wine/scene.gltf)"
      position="0.091 -1.900 -0.178"
      rotation="0 0 0"
      scale="0.076 0.076 0.076">
    </a-entity>


    <!-- ================================= -->
    <!-- 7. WINE MODEL 2 -->
    <!-- ================================= -->

    <a-entity
      id="drunkard_wine2-model"
      gltf-model="url(${BASE}assets/models/wine%202/scene.gltf)"
      position="0.409 -1.901 0"
      rotation="0 0 0"
      scale="0.146 0.146 0.146">
    </a-entity>


    <!-- ================================= -->
    <!-- 8. LITTLE PRINCE -->
    <!-- ================================= -->

    <a-entity
      id="drunkard_little-prince"
      gltf-model="url(${BASE}assets/models/the_little_prince/scene.gltf)"
      position="0.225 -1.945 0.016"
      scale="0.05 0.05 0.05"
      rotation="0 180 0">
    </a-entity>


    <!-- ================================= -->
<!-- ================================= -->
<!-- 9. DRUNK MAN -->
<!-- ================================= -->

<a-entity
     id="drunkard_drunk-man"
  gltf-model="url(${BASE}assets/models/drunkard/drunkard_v2.glb)"
  animation-mixer="clip: *; loop: repeat"
  position="0.180 -1.898 -0.148"
  rotation="5.884 14.361 3.009"
  scale="0.082 0.082 0.082"
  visible="true">
</a-entity>

    <!-- 漂浮粒子 -->
<a-entity id="drunkard_floating-particles">

  <a-sphere
    position="-2 1 -1"
    radius="0.025"
    color="#b9caff"
    animation="
      property: position;
      to: -2 2 -1;
      dur: 5000;
      dir: alternate;
      loop: true">
  </a-sphere>

  <a-sphere
    position="2 0 -2"
    radius="0.035"
    color="#a18bff"
    animation="
      property: position;
      to: 2 1.5 -2;
      dur: 6500;
      dir: alternate;
      loop: true">
  </a-sphere>

  <a-sphere
    position="1 2 1"
    radius="0.02"
    color="white"
    animation="
      property: position;
      to: 1 3 1;
      dur: 4000;
      dir: alternate;
      loop: true">
  </a-sphere>

</a-entity>

  </a-entity>
`;

  AFRAME.registerComponent('drunkard-planet', {
    init: function () {
      if (this.el.querySelector('#drunkard_root')) return; // 已經放過就不重複放
      this.el.insertAdjacentHTML('beforeend', DRUNKARD_PLANET_HTML);
    }
  });
})();
