/* =====================================================================
   camera-director.js — 運鏡導演框架
   ---------------------------------------------------------------------
   兩種模式：
   - 自由模式：WASD 移動、Q/E 下降/上升、Shift 加速、滑鼠拖曳轉頭、滾輪 zoom
   - 導演模式：照關鍵影格播放。路徑自動跑，到「停」的格子暫停，
               暫停時可以轉頭、zoom，按 Space 才前往下一段
   快捷鍵：
     C 新增關鍵影格（用目前視角）   Space 下一段（自由模式時：飛回上次停的格子）
     P 從第一格開始
     F 回到自由模式                 H 隱藏/顯示面板   R 重設 zoom
   資料：
   - 正式版本放在 index.html 的 window.DIRECTOR_KEYFRAMES
   - 在面板裡的修改會暫存在瀏覽器（重新整理不會消失），
     調好後按「匯出」，把產生的程式碼貼回 index.html
   ===================================================================== */
(function () {
  const STORAGE_KEY = 'camera-director-draft-v1';
  const DEFAULT_FOV = 80;

  /* ---------- 小工具 ---------- */
  const EASES = {
    sine:   t => -(Math.cos(Math.PI * t) - 1) / 2,
    quad:   t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    cubic:  t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    linear: t => t
  };
  const EASE_LABELS = { sine: '柔和', quad: '中等', cubic: '強烈', linear: '等速' };
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const round = (v, n) => Math.round(v * Math.pow(10, n)) / Math.pow(10, n);
  const clone = o => JSON.parse(JSON.stringify(o));

  function smoothstep(a, b, x) {
    if (b <= a) return x >= b ? 1 : 0;
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // 一維 Catmull-Rom：讓轉頭角度、zoom 也像路徑一樣平滑
  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function spline1D(vals, u) {
    const n = vals.length;
    if (n === 1) return vals[0];
    const i = Math.min(Math.floor(u), n - 2);
    const t = u - i;
    return catmull(vals[Math.max(i - 1, 0)], vals[i], vals[i + 1], vals[Math.min(i + 2, n - 1)], t);
  }

  // 慢動作文字格式："0.4-0.6x0.3; 0.8-0.9x0.5"
  // 意思是：這一段的 40%~60% 用 0.3 倍速、80%~90% 用 0.5 倍速
  function parseSlow(str) {
    if (!str) return [];
    return str.split(/[;；]/).map(s => s.trim()).filter(Boolean).map(s => {
      const m = s.match(/^([\d.]+)\s*-\s*([\d.]+)\s*[x×*]\s*([\d.]+)$/i);
      if (!m) return null;
      const from = clamp(+m[1], 0, 1), to = clamp(+m[2], 0, 1);
      return to > from ? { from, to, speed: clamp(+m[3], 0.02, 1) } : null;
    }).filter(Boolean);
  }
  const slowToStr = arr => (arr || []).map(z => `${z.from}-${z.to}x${z.speed}`).join('; ');

  /* ---------- 元件 ---------- */
  AFRAME.registerComponent('camera-director', {
    schema: {
      speed:           { default: 1.5 },    // 自由模式移動速度（公尺/秒）
      fastMultiplier:  { default: 4 },      // 按住 Shift 的倍數
      zoomSpeed:       { default: 0.0015 }, // 滾輪 zoom 靈敏度
      zoomSmooth:      { default: 10 },     // zoom 平滑程度（越大越快跟上）
      minFov:          { default: 8 },      // 最大放大（視野角度越小越放大）
      maxFov:          { default: 100 },
      settleTime:      { default: 1.0 },    // 按下一段時，回到關鍵影格視角的時間（秒）
      defaultDuration: { default: 4 }       // 新增關鍵影格的預設移動時間（秒）
    },

    init: function () {
      this.camEl = this.el.querySelector('[camera]');
      this.keys = {};
      this.mode = 'free';        // free | paused | settling | playing
      this.stopIndex = 0;        // 導演模式目前停在哪一格
      this.fov = DEFAULT_FOV;
      this.targetFov = DEFAULT_FOV;
      this.panelVisible = true;

      this.loadKeyframes();
      this.buildPanel();

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onWheel = this.onWheel.bind(this);
      this.onBlur = () => { this.keys = {}; };
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('wheel', this.onWheel, { passive: false });
      window.addEventListener('blur', this.onBlur);
    },

    remove: function () {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('wheel', this.onWheel);
      window.removeEventListener('blur', this.onBlur);
      if (this.panel) this.panel.remove();
    },

    /* ---------- 資料 ---------- */
    loadKeyframes: function () {
      const fromHtml = Array.isArray(window.DIRECTOR_KEYFRAMES) ? window.DIRECTOR_KEYFRAMES : [];
      this.htmlSignature = JSON.stringify(fromHtml);
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { draft = null; }
      // 暫存會記住它是從哪個 index.html 版本改出來的；
      // index.html 改過（例如貼了新的匯出內容）就自動改用 index.html，避免舊暫存蓋掉新內容
      const valid = draft && Array.isArray(draft.kfs) && draft.base === this.htmlSignature;
      this.htmlChanged = !!draft && !valid;
      if (this.htmlChanged) { try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ } }
      this.source = valid ? 'draft' : 'html';
      this.kfs = clone(valid ? draft.kfs : fromHtml);
    },
    save: function () {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ base: this.htmlSignature, kfs: this.kfs }));
      } catch (e) { /* 存不了就算了 */ }
      this.source = 'draft';
      this.updateStatus();
    },
    discardDraft: function () {
      if (!confirm('放棄暫存的修改，改回 index.html 裡的版本？')) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      this.kfs = clone(Array.isArray(window.DIRECTOR_KEYFRAMES) ? window.DIRECTOR_KEYFRAMES : []);
      this.source = 'html';
      this.stopIndex = Math.min(this.stopIndex, Math.max(this.kfs.length - 1, 0));
      this.renderList();
    },

    /* ---------- 攝影機姿態 ---------- */
    lookControls: function () { return this.camEl && this.camEl.components['look-controls']; },
    getAngles: function () {
      const lc = this.lookControls();
      if (lc && lc.yawObject) return { yaw: toDeg(lc.yawObject.rotation.y), pitch: toDeg(lc.pitchObject.rotation.x) };
      const r = this.camEl.object3D.rotation;
      return { yaw: toDeg(r.y), pitch: toDeg(r.x) };
    },
    setAngles: function (yaw, pitch) {
      // 同時寫進 look-controls 的內部狀態，之後滑鼠轉頭才會從這個角度接續
      const lc = this.lookControls();
      if (lc && lc.yawObject) {
        lc.yawObject.rotation.y = toRad(yaw);
        lc.pitchObject.rotation.x = toRad(pitch);
      }
      const r = this.camEl.object3D.rotation;
      r.order = 'YXZ';
      r.set(toRad(pitch), toRad(yaw), 0);
    },
    setFov: function (v) {
      this.fov = v;
      const cam = this.camEl && this.camEl.getObject3D('camera');
      if (cam) { cam.fov = v; cam.updateProjectionMatrix(); }
    },
    getPose: function () {
      const p = this.el.object3D.position, a = this.getAngles();
      return { pos: [p.x, p.y, p.z], yaw: a.yaw, pitch: a.pitch, fov: this.fov };
    },
    applyPose: function (pose) {
      this.el.object3D.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
      this.setAngles(pose.yaw, pose.pitch);
      const f = pose.fov != null ? pose.fov : DEFAULT_FOV;
      this.setFov(f);
      this.targetFov = f;
    },
    poseForStorage: function () {
      const p = this.getPose();
      return {
        pos: p.pos.map(v => round(v, 3)),
        yaw: round(p.yaw, 1),
        pitch: round(p.pitch, 1),
        fov: round(p.fov, 1)
      };
    },

    /* ---------- 操作 ---------- */
    capture: function () {
      const kf = Object.assign({ name: '影格 ' + (this.kfs.length + 1) }, this.poseForStorage(), {
        duration: this.data.defaultDuration, stop: true, ease: 'sine', slow: []
      });
      this.kfs.push(kf);
      this.save();
      this.renderList();
      this.flash('已新增第 ' + this.kfs.length + ' 格');
    },
    overwrite: function (i) {
      Object.assign(this.kfs[i], this.poseForStorage());
      this.save();
      this.renderList();
      this.flash('第 ' + (i + 1) + ' 格已改成目前視角');
    },
    jumpTo: function (i) {
      if (!this.kfs[i]) return;
      this.applyPose(this.kfs[i]);
      this.stopIndex = i;
      this.mode = 'paused';
      this.renderList();
    },
    goFree: function () {
      this.mode = 'free';
      this.run = null;
      this.renderList();
    },
    playFromTop: function () {
      if (!this.kfs.length) { this.flash('還沒有關鍵影格，先按 C 新增'); return; }
      this.jumpTo(0);
    },
    // 從自由模式回到導演模式：平滑飛回上次停下的那一格，暫停在那裡
    resume: function () {
      if (!this.kfs.length) { this.flash('還沒有關鍵影格，先按 C 新增'); return; }
      const i = clamp(this.stopIndex, 0, this.kfs.length - 1);
      this.stopIndex = i;
      this.beginSettle(this.kfs[i], () => {
        this.mode = 'paused';
        this.renderList();
        this.flash('回到第 ' + (i + 1) + ' 格，按 Space 繼續播放');
      }, true);
    },
    next: function () {
      if (this.mode === 'free') { this.resume(); return; }
      if (this.mode !== 'paused') return;
      const i = this.stopIndex;
      if (i >= this.kfs.length - 1) { this.flash('已經是最後一格'); return; }
      let j = i + 1;
      while (j < this.kfs.length - 1 && !this.kfs[j].stop) j++;
      const run = this.buildRun(i, j);
      this.beginSettle(this.kfs[i], () => { this.run = run; this.mode = 'playing'; this.updateStatus(); });
    },

    /* ---------- 回到關鍵影格視角（暫停時轉頭、zoom 過的話） ---------- */
    // longTrip = true：距離遠的話回位時間拉長（從自由模式飛回來用），最多 4 秒
    beginSettle: function (target, onDone, longTrip) {
      const from = this.getPose();
      let ty = target.yaw;
      while (ty - from.yaw > 180) ty -= 360;
      while (ty - from.yaw < -180) ty += 360;
      const to = { pos: target.pos.slice(), yaw: ty, pitch: target.pitch, fov: target.fov != null ? target.fov : DEFAULT_FOV };
      const dp = Math.hypot(to.pos[0] - from.pos[0], to.pos[1] - from.pos[1], to.pos[2] - from.pos[2]);
      const diff = Math.abs(to.yaw - from.yaw) + Math.abs(to.pitch - from.pitch) + Math.abs(to.fov - from.fov) + dp * 10;
      if (diff < 0.05 || this.data.settleTime <= 0) { this.applyPose(to); onDone(); return; }
      const duration = longTrip ? clamp(dp / 20, this.data.settleTime, 4) : this.data.settleTime;
      this.settle = { t: 0, from, to, onDone, duration };
      this.mode = 'settling';
      this.updateStatus();
    },

    /* ---------- 建立一趟路徑（從一個「停」到下一個「停」） ---------- */
    buildRun: function (i, j) {
      const pts = this.kfs.slice(i, j + 1);
      const n = pts.length;
      const curve = new THREE.CatmullRomCurve3(pts.map(k => new THREE.Vector3(k.pos[0], k.pos[1], k.pos[2])), false, 'centripetal');

      // 轉頭角度取最短方向
      const yaws = [pts[0].yaw];
      for (let m = 1; m < n; m++) {
        let y = pts[m].yaw;
        while (y - yaws[m - 1] > 180) y -= 360;
        while (y - yaws[m - 1] < -180) y += 360;
        yaws.push(y);
      }
      const pitches = pts.map(k => k.pitch);
      const fovs = pts.map(k => (k.fov != null ? k.fov : DEFAULT_FOV));

      // 每段的時間（第 m 格的 duration = 從上一格到這一格花的時間）
      const durs = pts.slice(1).map(k => Math.max(0.05, +k.duration || this.data.defaultDuration));
      const cum = [0];
      durs.forEach(d => cum.push(cum[cum.length - 1] + d));
      const T = cum[cum.length - 1];

      // 慢動作區：換算到整趟的時間軸上，進出時漸變
      const zones = [];
      pts.slice(1).forEach((k, m) => {
        (k.slow || []).forEach(z => {
          zones.push({ a: cum[m] + z.from * durs[m], b: cum[m] + z.to * durs[m], speed: z.speed });
        });
      });
      const speedAt = tau => {
        let s = 1;
        zones.forEach(z => {
          const r = (z.b - z.a) * 0.25; // 前後各 25% 用來漸變
          const w = smoothstep(z.a, z.a + r, tau) * (1 - smoothstep(z.b - r, z.b, tau));
          s = Math.min(s, 1 - (1 - z.speed) * w);
        });
        return s;
      };

      // 建表：實際經過時間 ↔ 路徑時間（慢動作的地方要花比較久）
      const N = 2000;
      const rs = new Float32Array(N + 1);
      for (let m = 1; m <= N; m++) {
        const t0 = ((m - 1) / N) * T, t1 = (m / N) * T;
        rs[m] = rs[m - 1] + (t1 - t0) / speedAt((t0 + t1) / 2);
      }

      return {
        i, j, n, curve, yaws, pitches, fovs, cum, T, rs, N,
        R: rs[N],
        ease: EASES[pts[n - 1].ease] || EASES.sine,
        t: 0
      };
    },

    evalRun: function (run) {
      const x = clamp(run.t / run.R, 0, 1);
      const r = run.ease(x) * run.R;
      let lo = 0, hi = run.N;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (run.rs[mid] < r) lo = mid; else hi = mid; }
      const frac = (r - run.rs[lo]) / ((run.rs[hi] - run.rs[lo]) || 1);
      const tau = ((lo + frac) / run.N) * run.T;

      let s = 0;
      while (s < run.cum.length - 2 && tau > run.cum[s + 1]) s++;
      const local = clamp((tau - run.cum[s]) / (run.cum[s + 1] - run.cum[s]), 0, 1);
      const u = s + local;

      const p = run.curve.getPoint(u / (run.n - 1));
      return {
        pos: [p.x, p.y, p.z],
        yaw: spline1D(run.yaws, u),
        pitch: spline1D(run.pitches, u),
        fov: spline1D(run.fovs, u)
      };
    },

    /* ---------- 每一幀 ---------- */
    tick: function (time, dtMs) {
      if (!this.camEl) return;
      const dt = Math.min((dtMs || 16) / 1000, 0.1);

      if (this.mode === 'free') {
        this.moveFree(dt);
        this.smoothFov(dt);
      } else if (this.mode === 'paused') {
        this.smoothFov(dt);
      } else if (this.mode === 'settling') {
        const s = this.settle;
        s.t += dt;
        const e = EASES.sine(clamp(s.t / s.duration, 0, 1));
        const lerp = (a, b) => a + (b - a) * e;
        this.el.object3D.position.set(lerp(s.from.pos[0], s.to.pos[0]), lerp(s.from.pos[1], s.to.pos[1]), lerp(s.from.pos[2], s.to.pos[2]));
        this.setAngles(lerp(s.from.yaw, s.to.yaw), lerp(s.from.pitch, s.to.pitch));
        this.setFov(lerp(s.from.fov, s.to.fov));
        this.targetFov = this.fov;
        if (s.t >= s.duration) { this.settle = null; s.onDone(); }
      } else if (this.mode === 'playing') {
        const run = this.run;
        run.t += dt;
        const pose = this.evalRun(run);
        this.el.object3D.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
        this.setAngles(pose.yaw, pose.pitch);
        this.setFov(pose.fov);
        this.targetFov = pose.fov;
        if (run.t >= run.R) {
          this.run = null;
          this.jumpTo(run.j);
        }
      }

      this._statusTimer = (this._statusTimer || 0) + dt;
      if (this._statusTimer > 0.2) { this._statusTimer = 0; this.updateStatus(); }
    },

    moveFree: function (dt) {
      const k = this.keys;
      const f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
      const s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
      const u = (k.KeyE ? 1 : 0) - (k.KeyQ ? 1 : 0);
      if (!f && !s && !u) return;
      const fast = k.ShiftLeft || k.ShiftRight;
      const step = this.data.speed * (fast ? this.data.fastMultiplier : 1) * dt;
      const yaw = toRad(this.getAngles().yaw);
      const p = this.el.object3D.position;
      // 前後左右只在水平面移動，上下用 Q/E，才能精準停在小王子視線高度
      p.x += (-Math.sin(yaw) * f + Math.cos(yaw) * s) * step;
      p.z += (-Math.cos(yaw) * f - Math.sin(yaw) * s) * step;
      p.y += u * step;
    },

    smoothFov: function (dt) {
      if (Math.abs(this.targetFov - this.fov) < 0.01) return;
      this.setFov(this.fov + (this.targetFov - this.fov) * (1 - Math.exp(-dt * this.data.zoomSmooth)));
    },

    /* ---------- 輸入 ---------- */
    isTyping: function (e) {
      const t = e.target;
      return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
    },
    onKeyDown: function (e) {
      if (this.isTyping(e)) return;
      this.keys[e.code] = true;
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyC': this.capture(); break;
        case 'Space': e.preventDefault(); this.next(); break;
        case 'KeyP': this.playFromTop(); break;
        case 'KeyF': this.goFree(); break;
        case 'KeyH': this.togglePanel(); break;
        case 'KeyR': this.resetZoom(); break;
        default: return;
      }
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    },
    onKeyUp: function (e) { this.keys[e.code] = false; },
    onWheel: function (e) {
      if (this.panel && this.panel.contains(e.target)) return; // 在面板上滾動 = 捲動列表
      if (this.mode === 'playing' || this.mode === 'settling') return;
      e.preventDefault();
      this.targetFov = clamp(this.targetFov * Math.exp(e.deltaY * this.data.zoomSpeed), this.data.minFov, this.data.maxFov);
    },
    resetZoom: function () {
      const kf = this.kfs[this.stopIndex];
      this.targetFov = this.mode === 'paused' && kf ? (kf.fov != null ? kf.fov : DEFAULT_FOV) : DEFAULT_FOV;
    },

    /* ---------- 面板 ---------- */
    buildPanel: function () {
      const panel = document.createElement('div');
      panel.id = 'director-panel';
      panel.style.cssText = [
        'position:fixed', 'top:12px', 'right:12px', 'width:400px', 'max-height:calc(100vh - 24px)',
        'overflow:auto', 'background:rgba(12,16,32,0.88)', 'color:#e8e8f0', 'font:12px/1.5 system-ui,sans-serif',
        'border-radius:10px', 'padding:10px 12px', 'z-index:10000', 'box-shadow:0 4px 20px rgba(0,0,0,0.4)'
      ].join(';');
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b style="font-size:14px">運鏡導演</b>
          <span data-role="status" style="color:#9fb3ff"></span>
        </div>
        <div data-role="toolbar" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px"></div>
        <div style="color:#8890a8;margin-bottom:8px">
          自由模式：WASD 移動、Q/E 下/上、Shift 加速、拖曳轉頭、滾輪 zoom<br>
          C 新增　Space 下一段（自由模式時 = 回到上次停的格子）　P 從頭　F 自由模式　H 隱藏面板　R 重設 zoom
        </div>
        <div data-role="list"></div>
        <div data-role="flash" style="margin-top:6px;color:#ffd479;min-height:18px"></div>`;
      document.body.appendChild(panel);
      this.panel = panel;
      this.statusEl = panel.querySelector('[data-role=status]');
      this.listEl = panel.querySelector('[data-role=list]');
      this.flashEl = panel.querySelector('[data-role=flash]');

      const bar = panel.querySelector('[data-role=toolbar]');
      [
        ['自由模式 F', () => this.goFree()],
        ['從頭 P', () => this.playFromTop()],
        ['下一段／回導演 Space', () => this.next()],
        ['新增 C', () => this.capture()],
        ['匯出', () => this.showExport()],
        ['還原成 index.html 版', () => this.discardDraft()],
        ['隱藏 H', () => this.togglePanel()]
      ].forEach(([label, fn]) => bar.appendChild(this.button(label, fn)));

      this.renderList();
    },

    button: function (label, fn, title) {
      const b = document.createElement('button');
      b.textContent = label;
      if (title) b.title = title;
      b.style.cssText = 'background:#2a3358;color:#e8e8f0;border:1px solid #3d4878;border-radius:5px;padding:2px 7px;cursor:pointer;font-size:12px';
      b.addEventListener('click', e => { e.stopPropagation(); fn(); b.blur(); });
      return b;
    },

    renderList: function () {
      if (!this.listEl) return;
      this.listEl.innerHTML = '';
      if (!this.kfs.length) {
        this.listEl.innerHTML = '<div style="color:#8890a8">還沒有關鍵影格。在自由模式飛到想要的位置，按 C 新增。</div>';
        this.updateStatus();
        return;
      }
      const inputCss = 'background:#1a2040;color:#e8e8f0;border:1px solid #3d4878;border-radius:4px;padding:1px 4px;font-size:12px';
      this.kfs.forEach((kf, i) => {
        const current = this.mode !== 'free' && i === this.stopIndex;
        const row = document.createElement('div');
        row.style.cssText = `border:1px solid ${current ? '#ffd479' : '#2d3560'};border-radius:6px;padding:5px 6px;margin-bottom:5px;background:${kf.stop || i === 0 || i === this.kfs.length - 1 ? 'rgba(60,75,140,0.25)' : 'transparent'}`;

        // 第一行：編號、名稱、停、操作按鈕
        const l1 = document.createElement('div');
        l1.style.cssText = 'display:flex;align-items:center;gap:4px;flex-wrap:wrap';
        const idx = document.createElement('b');
        idx.textContent = '#' + (i + 1);
        idx.style.minWidth = '24px';
        const name = document.createElement('input');
        name.value = kf.name || '';
        name.style.cssText = inputCss + ';width:90px';
        name.addEventListener('change', () => { kf.name = name.value; this.save(); });
        const stopLabel = document.createElement('label');
        stopLabel.style.cssText = 'display:flex;align-items:center;gap:2px';
        stopLabel.title = '到這一格要不要暫停（第一格和最後一格一定會停）';
        const stop = document.createElement('input');
        stop.type = 'checkbox';
        stop.checked = !!kf.stop;
        stop.addEventListener('change', () => { kf.stop = stop.checked; this.save(); this.renderList(); });
        stopLabel.append(stop, document.createTextNode('停'));
        l1.append(idx, name, stopLabel,
          this.button('跳到', () => this.jumpTo(i), '瞬間移到這格的視角（導演模式暫停在這裡）'),
          this.button('▶', () => { this.jumpTo(i); this.next(); }, '從這格開始播到下一個「停」'),
          this.button('⟳', () => this.overwrite(i), '用目前的視角覆蓋這一格'),
          this.button('↑', () => this.move(i, -1)),
          this.button('↓', () => this.move(i, 1)),
          this.button('✕', () => this.removeAt(i)));

        // 第二行：時間、緩動、慢動作
        const l2 = document.createElement('div');
        l2.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;color:#b8c0dc';
        const dur = document.createElement('input');
        dur.type = 'number'; dur.step = '0.5'; dur.min = '0.1';
        dur.value = kf.duration != null ? kf.duration : this.data.defaultDuration;
        dur.disabled = i === 0;
        dur.title = '從上一格移動到這一格花幾秒';
        dur.style.cssText = inputCss + ';width:46px' + (i === 0 ? ';opacity:0.4' : '');
        dur.addEventListener('change', () => { kf.duration = Math.max(0.1, +dur.value || this.data.defaultDuration); this.save(); });
        const ease = document.createElement('select');
        ease.style.cssText = inputCss;
        ease.title = '這一趟（從上一個「停」到這一格）的起步/停下感覺，只對「停」的格子有效';
        Object.keys(EASES).forEach(key => {
          const o = document.createElement('option');
          o.value = key; o.textContent = EASE_LABELS[key];
          if ((kf.ease || 'sine') === key) o.selected = true;
          ease.appendChild(o);
        });
        ease.addEventListener('change', () => { kf.ease = ease.value; this.save(); });
        const slow = document.createElement('input');
        slow.value = slowToStr(kf.slow);
        slow.placeholder = '慢動作 例：0.4-0.6x0.3';
        slow.disabled = i === 0;
        slow.title = '從上一格到這一格之間的慢動作。0.4-0.6x0.3 = 這段 40%~60% 用 0.3 倍速；多段用分號隔開';
        slow.style.cssText = inputCss + ';flex:1;min-width:120px' + (i === 0 ? ';opacity:0.4' : '');
        slow.addEventListener('change', () => { kf.slow = parseSlow(slow.value); slow.value = slowToStr(kf.slow); this.save(); });
        l2.append(document.createTextNode('時間'), dur, document.createTextNode('秒'), ease, slow);

        row.append(l1, l2);
        this.listEl.appendChild(row);
      });
      this.updateStatus();
    },

    move: function (i, d) {
      const j = i + d;
      if (j < 0 || j >= this.kfs.length) return;
      [this.kfs[i], this.kfs[j]] = [this.kfs[j], this.kfs[i]];
      if (this.stopIndex === i) this.stopIndex = j;
      else if (this.stopIndex === j) this.stopIndex = i;
      this.save();
      this.renderList();
    },
    removeAt: function (i) {
      if (!confirm('刪除第 ' + (i + 1) + ' 格「' + (this.kfs[i].name || '') + '」？')) return;
      this.kfs.splice(i, 1);
      if (this.stopIndex >= this.kfs.length) this.stopIndex = Math.max(this.kfs.length - 1, 0);
      if (!this.kfs.length && this.mode !== 'free') this.mode = 'free';
      this.save();
      this.renderList();
    },

    updateStatus: function () {
      if (!this.statusEl) return;
      const modeText = {
        free: '自由模式',
        paused: '暫停在第 ' + (this.stopIndex + 1) + ' 格',
        settling: '回到起點視角…',
        playing: '播放中…'
      }[this.mode];
      const src = this.source === 'draft' ? '（暫存中）' : '';
      this.statusEl.textContent = `${modeText}｜zoom ${round(this.fov, 1)}°${src}`;
    },

    flash: function (msg) {
      if (!this.flashEl) return;
      this.flashEl.textContent = msg;
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => { this.flashEl.textContent = ''; }, 2500);
    },

    togglePanel: function () {
      this.panelVisible = !this.panelVisible;
      this.panel.style.display = this.panelVisible ? 'block' : 'none';
    },

    showExport: function () {
      const lines = this.kfs.map(k => '  ' + JSON.stringify({
        name: k.name, pos: k.pos, yaw: k.yaw, pitch: k.pitch, fov: k.fov,
        duration: k.duration, stop: !!k.stop, ease: k.ease || 'sine', slow: k.slow || []
      }));
      const code = '<script>\nwindow.DIRECTOR_KEYFRAMES = [\n' + lines.join(',\n') + '\n];\n</' + 'script>';

      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;align-items:center;justify-content:center';
      const box = document.createElement('div');
      box.style.cssText = 'background:#12182e;color:#e8e8f0;padding:14px;border-radius:10px;width:min(760px,92vw);font:12px system-ui,sans-serif';
      box.innerHTML = '<b style="font-size:14px">匯出關鍵影格</b><div style="color:#8890a8;margin:4px 0 8px">把這段貼到 index.html，取代原本的 window.DIRECTOR_KEYFRAMES 那段 &lt;script&gt;</div>';
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.readOnly = true;
      ta.style.cssText = 'width:100%;height:50vh;background:#0b1020;color:#cfe3ff;border:1px solid #3d4878;border-radius:6px;font:12px/1.4 monospace;padding:8px;box-sizing:border-box';
      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;margin-top:8px';
      btns.append(
        this.button('複製', () => {
          ta.select();
          const ok = () => this.flash('已複製，貼到 index.html');
          if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, () => { document.execCommand('copy'); ok(); });
          else { document.execCommand('copy'); ok(); }
        }),
        this.button('關閉', () => overlay.remove())
      );
      box.append(ta, btns);
      overlay.appendChild(box);
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }
  });
})();
