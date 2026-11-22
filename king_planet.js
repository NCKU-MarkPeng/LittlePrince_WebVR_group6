/* =====================================================================
   king-planet.js — 國王星（小行星 325）
   ---------------------------------------------------------------------
   用法：
     1. 把這個檔案放在 index.html 同一個資料夾
     2. 在 <head> 裡、A-Frame 那行下面加：
          <script src="king-planet.js"></script>
     3. 在 planet-king 上加 king-planet，裡面留空：
          <a-entity id="planet-king" position="..." king-planet></a-entity>

   這個檔案做兩件事：
     - grand-king-textures：用程式畫出星球表面和五塊告示牌的貼圖
     - king-planet：把下面整串國王星的 HTML 塞進掛著它的物件裡
   國王星的內容要改，就改下面 KING_PLANET_HTML 裡的 HTML。
   所有 id 都是 king_ 開頭，不會跟其他星球撞名。
   ===================================================================== */
(function () {
  if (!window.AFRAME) {
    console.error('[king-planet] 請把 king-planet.js 放在載入 A-Frame 的那一行之後');
    return;
  }

  /* ===================== 1. 貼圖元件 ===================== */
      // 程式化生成高精細銀河星空、巨型星球地貌與多個故事劇情告示牌貼圖
      AFRAME.registerComponent("grand-king-textures", {
        init: function () {
          // 2. 生成巨型紫色星球的細膩岩石、金礦脈與隕石坑貼圖
          const pCanvas = document.createElement("canvas");
          pCanvas.width = 512;
          pCanvas.height = 256;
          const ctx = pCanvas.getContext("2d");

          ctx.fillStyle = "#3C096C";
          ctx.fillRect(0, 0, 512, 256);

          for (let y = 0; y < 256; y += 10) {
            ctx.fillStyle = y % 20 === 0 ? "#5A189A" : "#240046";
            ctx.globalAlpha = 0.35;
            ctx.fillRect(0, y, 512, 6);
          }

          for (let i = 0; i < 180; i++) {
            ctx.fillStyle = i % 2 === 0 ? "#7B2CBF" : "#10002B";
            ctx.globalAlpha = 0.22;
            ctx.beginPath();
            ctx.arc(
              Math.random() * 512,
              Math.random() * 256,
              3 + Math.random() * 12,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          for (let i = 0; i < 36; i++) {
            const cx = Math.random() * 512;
            const cy = Math.random() * 256;
            const cr = 5 + Math.random() * 13;
            ctx.strokeStyle = "#E0AAFF";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.42;
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#10002B";
            ctx.globalAlpha = 0.38;
            ctx.beginPath();
            ctx.arc(cx, cy, cr * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
          document
            .querySelector("#king_planet-core")
            .setAttribute("material", "src", pCanvas.toDataURL());

          // 3. 通用劇情羊皮紙/告示牌貼圖生成器
          function createPlaqueTexture(
            bgColor,
            borderColor,
            title,
            line1,
            line2,
            line3,
            hasSeal
          ) {
            const c = document.createElement("canvas");
            c.width = 256;
            c.height = 256;
            const x = c.getContext("2d");
            x.fillStyle = bgColor;
            x.fillRect(0, 0, 256, 256);
            x.strokeStyle = borderColor;
            x.lineWidth = 10;
            x.strokeRect(6, 6, 244, 244);

            x.fillStyle = "#2B1508";
            x.font = "bold 19px Georgia";
            x.textAlign = "center";
            x.fillText(title, 128, 48);

            x.font = "14px Georgia";
            x.fillText(line1, 128, 92);
            x.fillText(line2, 128, 124);
            x.fillText(line3, 128, 156);

            if (hasSeal) {
              x.fillStyle = "#D00000";
              x.beginPath();
              x.arc(128, 205, 22, 0, Math.PI * 2);
              x.fill();
            }
            return c.toDataURL();
          }

          // 貼圖 A：司法大臣委任詔書
          document
            .querySelector("#king_decree-paper")
            .setAttribute(
              "material",
              "src",
              createPlaqueTexture(
                "#F5EBE0",
                "#D4A373",
                "ROYAL DECREE",
                "Position: Minister of Justice",
                "Subjects to Judge: 0",
                "(Except 1 Old Rat)",
                true
              )
            );

          // 貼圖 B：禁止打哈欠皇家法令牌
          document
            .querySelector("#king_yawn-sign")
            .setAttribute(
              "material",
              "src",
              createPlaqueTexture(
                "#FFF3B0",
                "#B00000",
                "ROYAL ORDER #1",
                "Yawning is FORBIDDEN",
                "in the King's presence!",
                "...Now I order you to yawn.",
                false
              )
            );

          // 貼圖 C：老老鼠死刑/特赦輪迴牌
          document
            .querySelector("#king_rat-sign")
            .setAttribute(
              "material",
              "src",
              createPlaqueTexture(
                "#E0AAFF",
                "#FFD700",
                "THE ONLY SUBJECT",
                "1. Condemn Rat to Death",
                "2. Pardon Rat Immediately",
                "(We must economize him!)",
                false
              )
            );

          // 貼圖 D：命令星星閃爍星圖牌
          document
            .querySelector("#king_star-sign")
            .setAttribute(
              "material",
              "src",
              createPlaqueTexture(
                "#CAF0F8",
                "#0077B6",
                "ROYAL ORDER #2",
                '"I command the stars',
                'to twinkle and obey!"',
                "Total Stars Ruled: Billions",
                false
              )
            );

          // 貼圖 E：將軍變成海鳥荒謬命令牌
          document
            .querySelector("#king_general-sign")
            .setAttribute(
              "material",
              "src",
              createPlaqueTexture(
                "#F8EDEB",
                "#9D0208",
                "REASONABLE RULE",
                '"If I order a General to',
                "turn into a seabird and he",
                'refuses, the fault is MINE."',
                false
              )
            );
        },
      });

  /* ===================== 2. 國王星本體 =====================
     king_root 把整組往回移，讓星球中心剛好在 planet-king 的位置 */
  const KING_PLANET_HTML = /* html */ `
    <a-entity id="king_root" position="0 4.2 11" grand-king-textures>
      <!-- ===== 國王星的燈光（取代原本的環境光、平行光，只照國王星附近） =====
           decay: 0 = 不隨距離變暗，亮度跟原本的燈一樣；distance = 超過這個距離就照不到
           這樣光不會跑到地球、B612 或其他星球上。數值都可以再調 -->
      <a-entity id="king_lights">
        <!-- 取代環境光（#E0D7FF, 0.7）：四盞點光源從四面八方照，模擬均勻的底光 -->
        <a-entity id="king_ambient-1" position="11.5 7.3 0.5"
                  light="type: point; color: #E0D7FF; intensity: 0.65; distance: 45; decay: 0"></a-entity>
        <a-entity id="king_ambient-2" position="11.5 -15.7 -22.5"
                  light="type: point; color: #E0D7FF; intensity: 0.65; distance: 45; decay: 0"></a-entity>
        <a-entity id="king_ambient-3" position="-11.5 7.3 -22.5"
                  light="type: point; color: #E0D7FF; intensity: 0.65; distance: 45; decay: 0"></a-entity>
        <a-entity id="king_ambient-4" position="-11.5 -15.7 0.5"
                  light="type: point; color: #E0D7FF; intensity: 0.65; distance: 45; decay: 0"></a-entity>
        <!-- 取代橘色平行光（#FF9E00, 0.9）：放在原本光線來的方向（左上方），再拉遠一點 -->
        <a-entity id="king_sun-light" position="-15.6 14.3 -9.7"
                  light="type: point; color: #FF9E00; intensity: 0.9; distance: 45; decay: 0"></a-entity>
        <!-- 原本的金色點光源，位置不變；加上 decay: 0，在新版 A-Frame 裡亮度才接近原本 -->
        <a-entity id="king_gold-light" position="0 6 -9"
                  light="type: point; color: #FFD700; intensity: 1.1; distance: 24; decay: 0"></a-entity>
      </a-entity>

      <!-- 【天體劇情：國王命令太陽在 7:40 PM 下山 & 統治星辰】 -->
      <a-entity id="king_sun-and-stars">
        <a-entity
          position="-10.5 6.2 -15"
          animation="property: position; from: -10.5 7.2 -15; to: -10.5 3.2 -15; dir: alternate; loop: true; dur: 5200; easing: easeInOutSine"
        >
          <a-sphere
            radius="1.25"
            color="#FF6D00"
            material="emissive: #FF9100; emissiveIntensity: 1"
          ></a-sphere>
          <a-sphere
            radius="1.6"
            color="#FFB703"
            material="opacity: 0.25; transparent: true"
          ></a-sphere>
          <a-ring
            rotation="0 25 0"
            radius-inner="1.75"
            radius-outer="1.85"
            color="#FFD166"
            material="side: double; opacity: 0.4; transparent: true"
          ></a-ring>
        </a-entity>

        <a-octahedron
          position="-5.5 7.8 -12"
          radius="0.35"
          color="#FFD700"
          material="emissive: #FFD700; emissiveIntensity: 0.9"
          animation="property: scale; from: 0.8 0.8 0.8; to: 1.4 1.4 1.4; dir: alternate; loop: true; dur: 1200"
        ></a-octahedron>
        <a-octahedron
          position="6.2 8.2 -13"
          radius="0.4"
          color="#FFE135"
          material="emissive: #FFE135; emissiveIntensity: 0.9"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear"
        ></a-octahedron>
        <a-octahedron
          position="2.5 9.2 -14"
          radius="0.3"
          color="#FFF3B0"
          material="emissive: #FFF3B0; emissiveIntensity: 0.85"
        ></a-octahedron>
      </a-entity>

      <!-- ========================================================= -->
      <!-- 2. 【超巨型核心星球：小行星 B-325】 (半徑擴大至 6.5！)      -->
      <!-- ========================================================= -->
      <a-entity id="king_asteroid-325" position="0 -4.2 -11">
        <!-- 星球主體 (半徑 6.5) 與外層紫金大氣光暈 -->
        <a-sphere
          id="king_planet-core"
          position="0 0 0"
          radius="6.5"
          segments-width="48"
          segments-height="24"
        ></a-sphere>
        <a-sphere
          position="0 0 0"
          radius="6.85"
          color="#C77DFF"
          material="opacity: 0.14; transparent: true; side: back"
        ></a-sphere>

        <!-- 三層皇家行星光環 + 雙衛星與碎金隕石帶 -->
        <a-ring
          position="0 0 0"
          rotation="78 12 0"
          radius-inner="7.5"
          radius-outer="8.2"
          color="#FFD700"
          material="side: double; opacity: 0.52; transparent: true; emissive: #FFD700; emissiveIntensity: 0.35"
        ></a-ring>
        <a-ring
          position="0 0 0"
          rotation="78 12 0"
          radius-inner="8.4"
          radius-outer="9.0"
          color="#E0AAFF"
          material="side: double; opacity: 0.35; transparent: true; emissive: #9D4EDD; emissiveIntensity: 0.3"
        ></a-ring>
        <a-ring
          position="0 0 0"
          rotation="78 12 0"
          radius-inner="9.2"
          radius-outer="9.45"
          color="#90E0EF"
          material="side: double; opacity: 0.22; transparent: true"
        ></a-ring>

        <a-entity
          position="0 0 0"
          rotation="12 0 -12"
          animation="property: rotation; to: 12 360 -12; loop: true; dur: 24000; easing: linear"
        >
          <a-sphere
            position="8.8 0.4 0"
            radius="0.28"
            color="#FFD700"
            material="emissive: #FFD700; emissiveIntensity: 0.45"
          ></a-sphere>
          <a-sphere
            position="-8.9 -0.3 0.5"
            radius="0.2"
            color="#E0AAFF"
            material="emissive: #C77DFF; emissiveIntensity: 0.45"
          ></a-sphere>
          <a-octahedron
            position="6.2 0.2 6.3"
            radius="0.14"
            color="#FFD700"
          ></a-octahedron>
          <a-octahedron
            position="-6.3 -0.2 -6.2"
            radius="0.15"
            color="#FFD700"
          ></a-octahedron>
        </a-entity>

        <!-- 地表紫水晶礦簇與立體隕石坑環 -->
        <a-entity position="-4.8 3.8 2.0" rotation="0 20 45">
          <a-cone
            position="0 0.45 0"
            radius-bottom="0.25"
            radius-top="0.01"
            height="0.95"
            segments-radial="6"
            color="#E0AAFF"
            material="emissive: #9D4EDD; emissiveIntensity: 0.45"
          ></a-cone>
          <a-cone
            position="0.22 0.3 0.12"
            rotation="0 0 -22"
            radius-bottom="0.18"
            radius-top="0.01"
            height="0.7"
            segments-radial="6"
            color="#C77DFF"
          ></a-cone>
        </a-entity>
        <a-entity position="5.0 3.6 1.6" rotation="10 -15 -48">
          <a-cone
            position="0 0.42 0"
            radius-bottom="0.24"
            radius-top="0.01"
            height="0.88"
            segments-radial="6"
            color="#E0AAFF"
            material="emissive: #9D4EDD; emissiveIntensity: 0.45"
          ></a-cone>
          <a-cone
            position="-0.2 0.28 0.12"
            rotation="0 0 25"
            radius-bottom="0.16"
            radius-top="0.01"
            height="0.62"
            segments-radial="6"
            color="#C77DFF"
          ></a-cone>
        </a-entity>
        <a-torus
          position="3.2 2.4 5.0"
          rotation="35 32 0"
          radius="0.55"
          radius-tubular="0.07"
          color="#5A189A"
        ></a-torus>
        <a-torus
          position="-3.3 2.2 5.1"
          rotation="40 -32 0"
          radius="0.48"
          radius-tubular="0.065"
          color="#5A189A"
        ></a-torus>

        <!-- ========================================================= -->
        <!-- 【地面劇情 1：中央皇家宮殿、太陽日晷牆與動態國王＋小王子】    -->
        <!-- ========================================================= -->
        <!-- 貼合半徑 6.5 星球頂端的宮殿基座 (y = 6.45) -->
        <a-entity position="0 6.45 0">
          <!-- 超長豪華鑲金邊紅地毯 -->
          <a-box
            position="0 0.04 0.7"
            width="1.5"
            height="0.06"
            depth="4.8"
            color="#9D0208"
          ></a-box>
          <a-box
            position="-0.78 0.045 0.7"
            width="0.09"
            height="0.065"
            depth="4.8"
            color="#FFD700"
          ></a-box>
          <a-box
            position="0.78 0.045 0.7"
            width="0.09"
            height="0.065"
            depth="4.8"
            color="#FFD700"
          ></a-box>

          <!-- 紅地毯兩側皇家金柱與天鵝絨圍欄繩 (三段式) -->
          <a-cylinder
            position="-0.95 0.25 0.1"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="-0.95 0.52 0.1"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="-0.95 0.22 1.3"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="-0.95 0.49 1.3"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="-0.95 0.18 2.5"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="-0.95 0.45 2.5"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="-0.95 0.36 1.3"
            rotation="88 0 0"
            radius="0.02"
            height="2.4"
            color="#D00000"
          ></a-cylinder>

          <a-cylinder
            position="0.95 0.25 0.1"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="0.95 0.52 0.1"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="0.95 0.22 1.3"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="0.95 0.49 1.3"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="0.95 0.18 2.5"
            radius="0.045"
            height="0.5"
            color="#FFD700"
          ></a-cylinder>
          <a-sphere
            position="0.95 0.45 2.5"
            radius="0.07"
            color="#E63946"
          ></a-sphere>
          <a-cylinder
            position="0.95 0.36 1.3"
            rotation="88 0 0"
            radius="0.02"
            height="2.4"
            color="#D00000"
          ></a-cylinder>

          <!-- 雙層黃金王座台階 -->
          <a-box
            position="0 0.1 -1.0"
            width="2.1"
            height="0.14"
            depth="1.35"
            color="#FFD700"
          ></a-box>
          <a-box
            position="0 0.22 -1.1"
            width="1.75"
            height="0.14"
            depth="1.05"
            color="#FFC300"
          ></a-box>

          <!-- 王座後方白色大理石柱廊 + 旋轉太陽浮雕星環 -->
          <a-entity position="0 0.1 -1.8">
            <a-cylinder
              position="-1.25 0.95 0"
              radius="0.12"
              height="1.9"
              color="#F8F9FA"
            ></a-cylinder>
            <a-cylinder
              position="-1.25 0.05 0"
              radius="0.18"
              height="0.12"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="-1.25 1.92 0"
              radius="0.18"
              height="0.12"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="1.25 0.95 0"
              radius="0.12"
              height="1.9"
              color="#F8F9FA"
            ></a-cylinder>
            <a-cylinder
              position="1.25 0.05 0"
              radius="0.18"
              height="0.12"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="1.25 1.92 0"
              radius="0.18"
              height="0.12"
              color="#FFD700"
            ></a-cylinder>
            <a-torus
              position="0 1.92 0"
              radius="1.25"
              radius-tubular="0.08"
              arc="180"
              color="#F8F9FA"
            ></a-torus>
            <!-- 拱門中央旋轉的黃金太陽星輪 -->
            <a-torus
              position="0 1.55 0.05"
              radius="0.55"
              radius-tubular="0.025"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.5"
              animation="property: rotation; to: 0 0 360; loop: true; dur: 15000; easing: linear"
            ></a-torus>
            <a-octahedron
              position="0 3.3 0"
              radius="0.18"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.75"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear"
            ></a-octahedron>
          </a-entity>

          <!-- 王座兩旁跳動的青銅火盆 -->
          <a-entity position="-1.25 0.15 -1.1">
            <a-cone
              radius-bottom="0.11"
              radius-top="0.24"
              height="0.42"
              color="#B08968"
            ></a-cone>
            <a-cone
              position="0 0.34 0"
              radius-bottom="0.15"
              radius-top="0.01"
              height="0.38"
              color="#FF6B00"
              material="emissive: #FF9E00; emissiveIntensity: 1"
              animation="property: scale; from: 0.9 0.85 0.9; to: 1.15 1.25 1.15; dir: alternate; loop: true; dur: 380"
            ></a-cone>
          </a-entity>
          <a-entity position="1.25 0.15 -1.1">
            <a-cone
              radius-bottom="0.11"
              radius-top="0.24"
              height="0.42"
              color="#B08968"
            ></a-cone>
            <a-cone
              position="0 0.34 0"
              radius-bottom="0.15"
              radius-top="0.01"
              height="0.38"
              color="#FF6B00"
              material="emissive: #FF9E00; emissiveIntensity: 1"
              animation="property: scale; from: 0.9 0.85 0.9; to: 1.15 1.25 1.15; dir: alternate; loop: true; dur: 420"
            ></a-cone>
          </a-entity>

          <!-- 華麗黃金王座 -->
          <a-entity id="king_royal-throne" position="0 0.28 -1.2">
            <a-box
              position="0 0.25 0"
              width="0.9"
              height="0.5"
              depth="0.72"
              color="#D00000"
            ></a-box>
            <a-box
              position="-0.52 0.42 0"
              width="0.15"
              height="0.65"
              depth="0.76"
              color="#FFD700"
            ></a-box>
            <a-box
              position="0.52 0.42 0"
              width="0.15"
              height="0.65"
              depth="0.76"
              color="#FFD700"
            ></a-box>
            <a-box
              position="0 1.0 -0.3"
              width="0.98"
              height="1.6"
              depth="0.16"
              color="#B00000"
            ></a-box>
            <a-torus
              position="0 1.85 -0.3"
              radius="0.28"
              radius-tubular="0.05"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.45"
            ></a-torus>
            <a-octahedron
              position="0 1.85 -0.3"
              radius="0.13"
              color="#9D4EDD"
              material="emissive: #C77DFF; emissiveIntensity: 0.85"
            ></a-octahedron>
          </a-entity>

          <!-- ========================================================= -->
          <!-- 【高精細・全動態國王角色】 (左右巡視點頭、揮舞權杖、翻閱法典) -->
          <!-- ========================================================= -->
          <a-entity id="king_the-king" position="0 0.28 -1.1">
            <!-- 三層立體波浪垂墜貂皮紅袍 (覆蓋整座台階) -->
            <a-cone
              position="0 0.65 0.15"
              radius-bottom="0.95"
              radius-top="0.24"
              height="1.25"
              color="#D00000"
            ></a-cone>
            <a-cone
              position="0 0.35 0.22"
              radius-bottom="1.05"
              radius-top="0.55"
              height="0.65"
              color="#B00000"
            ></a-cone>
            <!-- 白色貂皮滾邊與黑點斑紋 -->
            <a-torus
              position="0 0.06 0.22"
              rotation="90 0 0"
              radius="1.04"
              radius-tubular="0.06"
              color="#FFFDF9"
            ></a-torus>
            <a-torus
              position="0 1.12 0.06"
              rotation="85 0 0"
              radius="0.26"
              radius-tubular="0.06"
              color="#FFFDF9"
            ></a-torus>
            <a-sphere
              position="-0.38 0.52 0.62"
              radius="0.028"
              color="#111"
            ></a-sphere>
            <a-sphere
              position="0.38 0.52 0.62"
              radius="0.028"
              color="#111"
            ></a-sphere>
            <a-sphere
              position="0 0.40 0.74"
              radius="0.028"
              color="#111"
            ></a-sphere>
            <a-sphere
              position="-0.55 0.24 0.72"
              radius="0.028"
              color="#111"
            ></a-sphere>
            <a-sphere
              position="0.55 0.24 0.72"
              radius="0.028"
              color="#111"
            ></a-sphere>

            <!-- 胸前皇家金色十字勳章與披風金鏈 -->
            <a-torus
              position="0 0.96 0.22"
              rotation="40 0 0"
              radius="0.18"
              radius-tubular="0.015"
              color="#FFD700"
            ></a-torus>
            <a-octahedron
              position="0 0.85 0.34"
              radius="0.065"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.5"
            ></a-octahedron>
            <a-sphere
              position="0 0.85 0.39"
              radius="0.025"
              color="#E63946"
            ></a-sphere>

            <!-- 【動態頭部】：國王威嚴地左右轉頭巡視星球 + 微微點頭發號施令 -->
            <a-entity
              position="0 1.38 0.06"
              animation="property: rotation; from: -4 -22 0; to: 8 22 0; dir: alternate; loop: true; dur: 2600; easing: easeInOutSine"
            >
              <a-sphere
                position="0 0 0"
                radius="0.24"
                color="#FFDBAC"
              ></a-sphere>
              <a-box
                position="-0.08 0.08 0.22"
                rotation="0 0 12"
                width="0.08"
                height="0.022"
                depth="0.02"
                color="#FFFFFF"
              ></a-box>
              <a-box
                position="0.08 0.08 0.22"
                rotation="0 0 -12"
                width="0.08"
                height="0.022"
                depth="0.02"
                color="#FFFFFF"
              ></a-box>
              <a-sphere
                position="-0.08 0.03 0.225"
                radius="0.024"
                color="#1D1E2C"
              ></a-sphere>
              <a-sphere
                position="0.08 0.03 0.225"
                radius="0.024"
                color="#1D1E2C"
              ></a-sphere>
              <a-sphere
                position="0 -0.02 0.25"
                radius="0.032"
                color="#F4A261"
              ></a-sphere>
              <a-sphere
                position="0 -0.14 0.19"
                radius="0.14"
                scale="1.35 1.05 0.8"
                color="#FFFFFF"
              ></a-sphere>
              <a-sphere
                position="-0.10 -0.08 0.22"
                rotation="0 0 22"
                radius="0.065"
                scale="1.6 0.65 0.65"
                color="#FFFFFF"
              ></a-sphere>
              <a-sphere
                position="0.10 -0.08 0.22"
                rotation="0 0 -22"
                radius="0.065"
                scale="1.6 0.65 0.65"
                color="#FFFFFF"
              ></a-sphere>

              <!-- 鑲嵌紅藍寶石的黃金皇冠 -->
              <a-cylinder
                position="0 0.24 0"
                radius="0.19"
                height="0.17"
                color="#FFD700"
                material="emissive: #FFD700; emissiveIntensity: 0.4"
              ></a-cylinder>
              <a-torus
                position="0 0.17 0"
                rotation="90 0 0"
                radius="0.195"
                radius-tubular="0.022"
                color="#FFC300"
              ></a-torus>
              <a-sphere
                position="0 0.24 0.19"
                radius="0.038"
                color="#E63946"
                material="emissive: #E63946; emissiveIntensity: 0.6"
              ></a-sphere>
              <a-sphere
                position="-0.14 0.24 0.13"
                radius="0.03"
                color="#00B4D8"
                material="emissive: #00B4D8; emissiveIntensity: 0.6"
              ></a-sphere>
              <a-sphere
                position="0.14 0.24 0.13"
                radius="0.03"
                color="#00B4D8"
                material="emissive: #00B4D8; emissiveIntensity: 0.6"
              ></a-sphere>
            </a-entity>

            <!-- 【動態左手】：捧着厚重的金色《宇宙法典》微微上下示意 -->
            <a-entity
              position="0.34 1.02 0.14"
              animation="property: rotation; from: 10 -10 -15; to: 25 -10 -15; dir: alternate; loop: true; dur: 1800"
            >
              <a-cylinder
                position="0 -0.15 0.1"
                rotation="45 0 0"
                radius="0.06"
                height="0.38"
                color="#D00000"
              ></a-cylinder>
              <a-sphere
                position="0 -0.30 0.24"
                radius="0.055"
                color="#FFDBAC"
              ></a-sphere>
              <a-box
                position="0 -0.26 0.34"
                rotation="25 0 0"
                width="0.28"
                height="0.08"
                depth="0.36"
                color="#5C4033"
              ></a-box>
              <a-box
                position="0 -0.25 0.34"
                rotation="25 0 0"
                width="0.25"
                height="0.06"
                depth="0.33"
                color="#FFFDF9"
              ></a-box>
              <a-octahedron
                position="0 -0.21 0.34"
                radius="0.035"
                color="#FFD700"
              ></a-octahedron>
            </a-entity>

            <!-- 【動態右手】：高舉黃金權杖對太陽與星星發號施令 + 金色星辰光束 -->
            <a-entity
              position="-0.34 1.05 0.14"
              animation="property: rotation; from: 10 15 25; to: 62 -20 48; dir: alternate; loop: true; dur: 1500; easing: easeInOutQuad"
            >
              <a-cylinder
                position="0 -0.16 0.12"
                rotation="45 0 0"
                radius="0.06"
                height="0.4"
                color="#D00000"
              ></a-cylinder>
              <a-sphere
                position="0 -0.32 0.26"
                radius="0.055"
                color="#FFDBAC"
              ></a-sphere>
              <a-cylinder
                position="0 -0.16 0.36"
                rotation="20 0 0"
                radius="0.022"
                height="0.76"
                color="#FFD700"
              ></a-cylinder>
              <a-sphere
                position="0 0.22 0.5"
                radius="0.065"
                color="#FFD700"
                material="emissive: #FFD700; emissiveIntensity: 0.9"
              ></a-sphere>
              <a-cone
                position="0 1.05 0.8"
                rotation="20 0 0"
                radius-bottom="0.32"
                radius-top="0.02"
                height="1.6"
                color="#FFD700"
                material="opacity: 0.24; transparent: true; emissive: #FFD700; emissiveIntensity: 0.55"
              ></a-cone>
            </a-entity>
          </a-entity>

          <!-- ========================================================= -->
          <!-- 【高精細角色：小王子】 (站在紅地毯中央仰望國王、托下巴思考) -->
          <!-- ========================================================= -->
          <a-entity
            id="king_little-prince"
            position="0 0.07 1.15"
            rotation="0 180 0"
            scale="1.22 1.22 1.22"
          >
            <!-- 雙腿與黑色小靴子 -->
            <a-cylinder
              position="-0.065 0.15 0"
              radius="0.045"
              height="0.28"
              color="#2D6A4F"
            ></a-cylinder>
            <a-cylinder
              position="0.065 0.15 0"
              radius="0.045"
              height="0.28"
              color="#2D6A4F"
            ></a-cylinder>
            <a-box
              position="-0.065 0.03 0.02"
              width="0.08"
              height="0.06"
              depth="0.12"
              color="#1B1B1B"
            ></a-box>
            <a-box
              position="0.065 0.03 0.02"
              width="0.08"
              height="0.06"
              depth="0.12"
              color="#1B1B1B"
            ></a-box>

            <!-- 綠色大衣外套 + 金色排扣 + 腰帶 -->
            <a-cone
              position="0 0.48 0"
              radius-bottom="0.19"
              radius-top="0.11"
              height="0.46"
              color="#3A7D44"
            ></a-cone>
            <a-cylinder
              position="0 0.42 0"
              radius="0.155"
              height="0.04"
              color="#222"
            ></a-cylinder>
            <a-sphere
              position="0 0.56 0.125"
              radius="0.015"
              color="#FFD700"
            ></a-sphere>
            <a-sphere
              position="0 0.49 0.145"
              radius="0.015"
              color="#FFD700"
            ></a-sphere>

            <!-- 左手自然下垂，右手彎曲托下巴思考 -->
            <a-cylinder
              position="-0.17 0.52 0.02"
              rotation="-10 0 -18"
              radius="0.038"
              height="0.3"
              color="#3A7D44"
            ></a-cylinder>
            <a-sphere
              position="-0.21 0.37 0.05"
              radius="0.038"
              color="#FFDBAC"
            ></a-sphere>
            <a-cylinder
              position="0.14 0.58 0.08"
              rotation="-55 0 25"
              radius="0.038"
              height="0.26"
              color="#3A7D44"
            ></a-cylinder>
            <a-sphere
              position="0.07 0.69 0.14"
              radius="0.038"
              color="#FFDBAC"
            ></a-sphere>

            <!-- 頭部 (仰望國王 + 微微歪頭思考) -->
            <a-entity
              position="0 0.84 0"
              animation="property: rotation; from: 10 0 -8; to: 16 0 8; dir: alternate; loop: true; dur: 2200"
            >
              <a-sphere
                position="0 0 0"
                radius="0.16"
                color="#FFDBAC"
              ></a-sphere>
              <a-sphere
                position="-0.055 0 0.145"
                radius="0.018"
                color="#1D1E2C"
              ></a-sphere>
              <a-sphere
                position="0.055 0 0.145"
                radius="0.018"
                color="#1D1E2C"
              ></a-sphere>
              <a-sphere
                position="-0.09 -0.04 0.125"
                radius="0.022"
                color="#FF8FA3"
                material="opacity: 0.7; transparent: true"
              ></a-sphere>
              <a-sphere
                position="0.09 -0.04 0.125"
                radius="0.022"
                color="#FF8FA3"
                material="opacity: 0.7; transparent: true"
              ></a-sphere>
              <!-- 立體金色捲髮 -->
              <a-sphere
                position="0 0.05 -0.02"
                radius="0.165"
                color="#FFD700"
              ></a-sphere>
              <a-sphere
                position="-0.09 0.10 0.06"
                radius="0.075"
                color="#FFE135"
              ></a-sphere>
              <a-sphere
                position="0.08 0.11 0.05"
                radius="0.08"
                color="#FFC300"
              ></a-sphere>
              <a-sphere
                position="0 0.13 0.08"
                radius="0.07"
                color="#FFE135"
              ></a-sphere>
              <a-sphere
                position="-0.12 0.03 -0.05"
                radius="0.075"
                color="#FFC300"
              ></a-sphere>
              <a-sphere
                position="0.12 0.03 -0.05"
                radius="0.075"
                color="#FFE135"
              ></a-sphere>
            </a-entity>

            <!-- 兩段式飄揚黃色長圍巾 -->
            <a-torus
              position="0 0.70 0"
              rotation="85 0 0"
              radius="0.125"
              radius-tubular="0.035"
              color="#FFE135"
            ></a-torus>
            <a-entity
              position="-0.12 0.68 -0.05"
              animation="property: rotation; from: 5 15 -15; to: 15 35 -30; dir: alternate; loop: true; dur: 850"
            >
              <a-box
                position="-0.14 -0.04 -0.05"
                width="0.28"
                height="0.065"
                depth="0.025"
                color="#FFE135"
              ></a-box>
              <a-box
                position="-0.32 -0.09 -0.08"
                rotation="0 15 -12"
                width="0.2"
                height="0.06"
                depth="0.025"
                color="#FFD700"
              ></a-box>
            </a-entity>
          </a-entity>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 2：禁止打哈欠皇家法令區】(左前方)               -->
        <!-- ========================================================= -->
        <a-entity
          id="king_yawning-decree-zone"
          position="-2.5 5.82 1.55"
          rotation="16 32 22"
        >
          <a-cylinder
            position="0 0.38 0"
            radius="0.038"
            height="0.76"
            color="#FFD700"
          ></a-cylinder>
          <a-cylinder
            position="0 0.02 0"
            radius="0.18"
            height="0.05"
            color="#FFD700"
          ></a-cylinder>
          <a-box
            position="0 0.84 -0.02"
            width="0.88"
            height="0.88"
            depth="0.04"
            color="#B00000"
          ></a-box>
          <a-plane
            id="king_yawn-sign"
            position="0 0.84 0.01"
            width="0.8"
            height="0.8"
          ></a-plane>
          <!-- 皇家計時沙漏 -->
          <a-entity position="0.65 0.2 0.1">
            <a-cylinder
              position="0 0.18 0"
              radius="0.12"
              height="0.03"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="0 -0.18 0"
              radius="0.12"
              height="0.03"
              color="#FFD700"
            ></a-cylinder>
            <a-cone
              position="0 0.09 0"
              radius-bottom="0.01"
              radius-top="0.1"
              height="0.18"
              color="#CAF0F8"
              material="opacity: 0.5; transparent: true"
            ></a-cone>
            <a-cone
              position="0 -0.09 0"
              radius-bottom="0.1"
              radius-top="0.01"
              height="0.18"
              color="#FFD166"
              material="opacity: 0.85; transparent: true"
            ></a-cone>
          </a-entity>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 3：7:40 PM 日落天文觀測與曆法台】(右前方)       -->
        <!-- ========================================================= -->
        <a-entity
          id="king_sunset-observatory"
          position="2.55 5.80 1.45"
          rotation="15 -35 -22"
        >
          <a-cylinder
            position="0 0.06 0"
            radius="0.75"
            height="0.12"
            color="#E0AAFF"
          ></a-cylinder>
          <!-- 黃銅天文望遠鏡 -->
          <a-entity position="-0.26 0.38 0.12">
            <a-cylinder
              position="0 -0.14 0"
              radius="0.035"
              height="0.32"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="0 0.06 0"
              rotation="35 45 0"
              radius="0.055"
              height="0.54"
              color="#FFC300"
            ></a-cylinder>
            <a-cylinder
              position="0.12 0.2 -0.12"
              rotation="35 45 0"
              radius="0.07"
              height="0.14"
              color="#B08968"
            ></a-cylinder>
          </a-entity>
          <!-- 曆書講台與旋轉金色渾天儀 -->
          <a-entity position="0.26 0.12 -0.08">
            <a-cylinder
              position="0 0.24 0"
              radius="0.13"
              height="0.48"
              color="#F8F9FA"
            ></a-cylinder>
            <a-box
              position="0 0.5 0"
              width="0.48"
              height="0.05"
              depth="0.38"
              rotation="20 0 0"
              color="#FFD700"
            ></a-box>
            <a-box
              position="-0.09 0.55 0.01"
              width="0.18"
              height="0.04"
              depth="0.26"
              rotation="20 0 8"
              color="#FFFDF9"
            ></a-box>
            <a-box
              position="0.09 0.55 0.01"
              width="0.18"
              height="0.04"
              depth="0.26"
              rotation="20 0 -8"
              color="#FFFDF9"
            ></a-box>
            <a-entity
              position="0 0.92 0"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 7000; easing: linear"
            >
              <a-torus
                radius="0.24"
                radius-tubular="0.016"
                color="#FFD700"
                material="emissive: #FFD700; emissiveIntensity: 0.5"
              ></a-torus>
              <a-torus
                rotation="60 45 0"
                radius="0.2"
                radius-tubular="0.014"
                color="#FF9E00"
              ></a-torus>
              <a-sphere
                radius="0.055"
                color="#FF6D00"
                material="emissive: #FF9100; emissiveIntensity: 1"
              ></a-sphere>
            </a-entity>
          </a-entity>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 4：空無一人的內閣長桌 & 司法大臣委任詔書】        -->
        <!-- ========================================================= -->
        <a-entity
          id="king_minister-of-justice-zone"
          position="0 6.02 2.35"
          rotation="21 0 0"
        >
          <a-box
            position="0 0.3 0"
            width="1.25"
            height="0.06"
            depth="0.6"
            color="#5C4033"
          ></a-box>
          <a-box
            position="0 0.335 0"
            width="1.05"
            height="0.02"
            depth="0.64"
            color="#9D0208"
          ></a-box>
          <a-cylinder
            position="-0.52 0.15 0"
            radius="0.038"
            height="0.3"
            color="#FFD700"
          ></a-cylinder>
          <a-cylinder
            position="0.52 0.15 0"
            radius="0.038"
            height="0.3"
            color="#FFD700"
          ></a-cylinder>

          <!-- 兩側空蕩蕩的大臣座椅 -->
          <a-box
            position="-0.85 0.16 0"
            width="0.3"
            height="0.26"
            depth="0.3"
            color="#D00000"
          ></a-box>
          <a-box
            position="-0.98 0.35 0"
            width="0.05"
            height="0.38"
            depth="0.3"
            color="#FFD700"
          ></a-box>
          <a-box
            position="0.85 0.16 0"
            width="0.3"
            height="0.26"
            depth="0.3"
            color="#D00000"
          ></a-box>
          <a-box
            position="0.98 0.35 0"
            width="0.05"
            height="0.38"
            depth="0.3"
            color="#FFD700"
          ></a-box>

          <!-- 司法大臣委任詔書 -->
          <a-plane
            id="king_decree-paper"
            position="-0.25 0.6 0"
            width="0.52"
            height="0.52"
            rotation="-12 10 0"
          ></a-plane>

          <!-- 空正義天平 -->
          <a-entity
            position="0.3 0.62 0"
            animation="property: rotation; from: 0 0 -7; to: 0 0 7; dir: alternate; loop: true; dur: 1600"
          >
            <a-cylinder
              position="0 -0.15 0"
              radius="0.016"
              height="0.3"
              color="#FFD700"
            ></a-cylinder>
            <a-cylinder
              position="0 0 0"
              rotation="0 0 90"
              radius="0.014"
              height="0.48"
              color="#FFD700"
            ></a-cylinder>
            <a-cone
              position="-0.22 -0.12 0"
              radius-bottom="0.08"
              radius-top="0.01"
              height="0.1"
              color="#FFD700"
              material="opacity: 0.75; transparent: true"
            ></a-cone>
            <a-cone
              position="0.22 -0.12 0"
              radius-bottom="0.08"
              radius-top="0.01"
              height="0.1"
              color="#FFD700"
              material="opacity: 0.75; transparent: true"
            ></a-cone>
          </a-entity>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 5：星球左後方「全星球唯一老老鼠審判庭」】        -->
        <!-- ========================================================= -->
        <a-entity
          id="king_old-rat-court"
          position="-3.2 5.42 -1.65"
          rotation="-16 50 28"
        >
          <a-dodecahedron
            position="-0.2 0.14 -0.15"
            radius="0.48"
            color="#3C096C"
          ></a-dodecahedron>
          <a-plane
            id="king_rat-sign"
            position="0.4 0.48 -0.2"
            width="0.65"
            height="0.65"
            rotation="0 -35 0"
          ></a-plane>
          <a-cylinder
            position="0.4 0.14 -0.2"
            radius="0.022"
            height="0.28"
            color="#FFD700"
          ></a-cylinder>

          <!-- 探頭探腦的小灰鼠 -->
          <a-entity
            position="0 0.05 0.18"
            animation="property: position; from: 0 0.05 0.18; to: 0.16 0.05 0.28; dir: alternate; loop: true; dur: 1500"
          >
            <a-sphere
              position="0 0.09 0"
              radius="0.11"
              scale="1.3 0.85 0.85"
              color="#ADB5BD"
            ></a-sphere>
            <a-sphere
              position="0.12 0.1 0"
              radius="0.07"
              scale="1.2 0.9 0.9"
              color="#CED4DA"
            ></a-sphere>
            <a-cylinder
              position="0.09 0.16 0.05"
              rotation="0 0 90"
              radius="0.032"
              height="0.012"
              color="#FFAFCC"
            ></a-cylinder>
            <a-cylinder
              position="0.09 0.16 -0.05"
              rotation="0 0 90"
              radius="0.032"
              height="0.012"
              color="#FFAFCC"
            ></a-cylinder>
            <a-sphere
              position="0.16 0.12 0.04"
              radius="0.013"
              color="#111"
            ></a-sphere>
            <a-sphere
              position="0.16 0.12 -0.04"
              radius="0.013"
              color="#111"
            ></a-sphere>
            <a-cylinder
              position="-0.19 0.08 0"
              rotation="0 0 75"
              radius="0.011"
              height="0.24"
              color="#FFAFCC"
            ></a-cylinder>
          </a-entity>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 6：右後方「命令星星閃爍」星圖指揮台】            -->
        <!-- ========================================================= -->
        <a-entity
          id="king_star-command-zone"
          position="3.2 5.42 -1.65"
          rotation="-16 -50 -28"
        >
          <a-cylinder
            position="0 0.12 0"
            radius="0.45"
            height="0.24"
            color="#240046"
          ></a-cylinder>
          <a-torus
            position="0 0.25 0"
            rotation="90 0 0"
            radius="0.42"
            radius-tubular="0.025"
            color="#FFD700"
          ></a-torus>
          <a-entity
            position="0 0.65 0"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 9000; easing: linear"
          >
            <a-octahedron
              position="0 0.15 0"
              radius="0.12"
              color="#00B4D8"
              material="emissive: #90E0EF; emissiveIntensity: 0.9"
            ></a-octahedron>
            <a-octahedron
              position="0.22 0 0.1"
              radius="0.07"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.9"
            ></a-octahedron>
            <a-octahedron
              position="-0.2 -0.05 -0.12"
              radius="0.08"
              color="#FFD700"
              material="emissive: #FFD700; emissiveIntensity: 0.9"
            ></a-octahedron>
          </a-entity>
          <a-plane
            id="king_star-sign"
            position="-0.45 0.48 -0.15"
            width="0.65"
            height="0.65"
            rotation="0 35 0"
          ></a-plane>
          <a-cylinder
            position="-0.45 0.14 -0.15"
            radius="0.022"
            height="0.28"
            color="#FFD700"
          ></a-cylinder>
        </a-entity>

        <!-- ========================================================= -->
        <!-- 【地面劇情 7：右側邊緣「將軍變成海鳥」空閱兵台】            -->
        <!-- ========================================================= -->
        <a-entity
          id="king_general-parade-zone"
          position="3.6 5.25 0.1"
          rotation="0 -90 -32"
        >
          <a-cylinder
            position="0 0.45 0"
            radius="0.03"
            height="0.9"
            color="#FFD700"
          ></a-cylinder>
          <a-box
            position="0 0.75 0"
            width="0.38"
            height="0.06"
            depth="0.08"
            color="#FFD700"
          ></a-box>
          <a-sphere
            position="0 0.95 0"
            radius="0.11"
            color="#ADB5BD"
          ></a-sphere>
          <a-cone
            position="0 1.12 0"
            radius-bottom="0.08"
            radius-top="0.01"
            height="0.18"
            color="#E63946"
          ></a-cone>
          <a-plane
            id="king_general-sign"
            position="0.52 0.48 0"
            width="0.65"
            height="0.65"
            rotation="0 -20 0"
          ></a-plane>
          <a-cylinder
            position="0.52 0.14 0"
            radius="0.022"
            height="0.28"
            color="#FFD700"
          ></a-cylinder>
        </a-entity>
      </a-entity>
    </a-entity>
`;

  AFRAME.registerComponent('king-planet', {
    init: function () {
      if (this.el.querySelector('#king_root')) return; // 已經放過就不重複放
      this.el.insertAdjacentHTML('beforeend', KING_PLANET_HTML);
    }
  });
})();
