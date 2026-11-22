/* =====================================================================
   altitude-fade.js — 依攝影機高度調整燈光亮度
   ---------------------------------------------------------------------
   用法：
     1. 在 <head> 裡、A-Frame 那行下面加：
          <script src="altitude-fade.js"></script>
     2. 在要漸暗的燈上加 altitude-fade：
          <a-entity light="type: ambient; intensity: 0.35" altitude-fade></a-entity>

   攝影機高度低於 from 時，燈是原本的亮度；
   從 from 飛到 to 之間慢慢變暗；高於 to 時剩下原本亮度 × min（預設 0 = 全關）。

   選項（都可以不寫）：
     altitude-fade="from: 30; to: 100; min: 0"
   ===================================================================== */
(function () {
  if (!window.AFRAME) {
    console.error('[altitude-fade] 請把 altitude-fade.js 放在載入 A-Frame 的那一行之後');
    return;
  }

  AFRAME.registerComponent('altitude-fade', {
    schema: {
      from: { default: 30 },   // 從這個高度開始變暗（公尺）
      to:   { default: 100 },  // 到這個高度變到最暗
      min:  { default: 0 }     // 最暗時剩下原本亮度的幾成（0 = 全關）
    },

    init: function () {
      this.camPos = new THREE.Vector3();
      this.baseIntensity = null;
    },

    tick: function () {
      const light = this.el.getObject3D('light');
      const camera = this.el.sceneEl.camera;
      if (!light || !camera) return;

      // 原本的亮度以 light 屬性裡寫的為準，之後在面板或程式裡改了也會跟著更新
      const data = this.el.getAttribute('light');
      this.baseIntensity = data && data.intensity != null ? data.intensity : light.intensity;

      camera.getWorldPosition(this.camPos);
      const d = this.data;
      let t = d.to > d.from ? (this.camPos.y - d.from) / (d.to - d.from) : (this.camPos.y >= d.to ? 1 : 0);
      t = Math.min(Math.max(t, 0), 1);
      const smooth = t * t * (3 - 2 * t);              // 起步和收尾都平緩
      const factor = 1 - (1 - d.min) * smooth;

      light.intensity = this.baseIntensity * factor;
    }
  });
})();
