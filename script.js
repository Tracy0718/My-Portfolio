(() => {
    const THEME_STORAGE_KEY = 'yb_theme_mode_v1';
    const ANIM_STORAGE_KEY = 'yb_theme_anim_v1';

    const themeModes = [
        { id: 'neo-cyan', dataTheme: 'default', canvasThemeClass: 'theme-particles' },
        { id: 'aurora-violet', dataTheme: 'aurora', canvasThemeClass: 'theme-parallax' },
        { id: 'midnight-royal', dataTheme: 'midnight', canvasThemeClass: 'theme-grid' }
    ];

    let currentModeIndex = 0;
    let three = null;
    let themeAnimMode = 'classic'; // classic | cinematic
    let longPressConsumed = false;

    function getCanvasEl() {
        return document.getElementById('three-canvas');
    }

    function applyMode(mode) {
        document.body.dataset.theme = mode.dataTheme;

        const canvas = getCanvasEl();
        if (canvas) {
            canvas.classList.add('active');
            canvas.classList.remove('theme-particles', 'theme-parallax', 'theme-grid');
            canvas.classList.add(mode.canvasThemeClass);
        }

        if (three?.material) {
            const color =
                mode.dataTheme === 'aurora' ? 0xbf00ff :
                mode.dataTheme === 'midnight' ? 0x38bdf8 :
                0x00d4ff;
            three.material.color.setHex(color);
            if (three.material.uniforms?.uTime) {
                three.material.uniforms.uTime.value = 0;
            }
        }

        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode.id);
        } catch {
            // ignore storage errors
        }
    }

    function getAnimModeLabel() {
        return themeAnimMode === 'cinematic' ? 'Mind‑blowing' : 'Classic';
    }

    function showToast(text) {
        const existing = document.querySelector('.theme-toast');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'theme-toast';
        el.textContent = text;
        document.body.appendChild(el);

        if (window.gsap) {
            gsap.fromTo(el, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
            gsap.to(el, { opacity: 0, y: -6, duration: 0.35, ease: 'power2.in', delay: 2.2, onComplete: () => el.remove() });
        } else {
            setTimeout(() => el.remove(), 2600);
        }
    }

    function setAnimMode(next) {
        themeAnimMode = next;
        try {
            localStorage.setItem(ANIM_STORAGE_KEY, themeAnimMode);
        } catch {
            // ignore
        }
        showToast(`Theme switch: ${getAnimModeLabel()}`);
    }

    function loadSavedAnimMode() {
        try {
            const saved = localStorage.getItem(ANIM_STORAGE_KEY);
            return saved === 'cinematic' ? 'cinematic' : 'classic';
        } catch {
            return 'classic';
        }
    }

    function loadSavedMode() {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            const idx = themeModes.findIndex(m => m.id === saved);
            return idx >= 0 ? idx : 0;
        } catch {
            return 0;
        }
    }

    function buildOverlay(mode) {
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';

        // Slightly different overlay feel per theme
        const bg =
            mode.dataTheme === 'aurora' ? 'radial-gradient(circle at 20% 20%, rgba(167,139,250,0.55) 0%, transparent 55%), radial-gradient(circle at 80% 60%, rgba(0,212,255,0.45) 0%, transparent 55%), linear-gradient(180deg, rgba(3,7,18,0.0), rgba(3,7,18,0.85))' :
            mode.dataTheme === 'midnight' ? 'radial-gradient(circle at 30% 30%, rgba(56,189,248,0.5) 0%, transparent 55%), radial-gradient(circle at 70% 65%, rgba(167,139,250,0.38) 0%, transparent 55%), linear-gradient(180deg, rgba(2,6,23,0.0), rgba(2,6,23,0.88))' :
            'radial-gradient(circle at 30% 30%, rgba(0,212,255,0.5) 0%, transparent 55%), radial-gradient(circle at 70% 65%, rgba(124,58,237,0.35) 0%, transparent 55%), linear-gradient(180deg, rgba(3,7,18,0.0), rgba(3,7,18,0.85))';

        overlay.style.background = bg;
        document.body.appendChild(overlay);
        return overlay;
    }

    function animateThreeBurst() {
        if (!three?.material || !three?.points) return;
        if (!window.gsap) return;

        gsap.killTweensOf(three.material);
        gsap.killTweensOf(three.points.rotation);

        const baseSize = 1.15;
        gsap.fromTo(three.material, { size: baseSize * 0.75, opacity: 0.55 }, { size: baseSize * 1.6, opacity: 0.9, duration: 0.35, ease: 'power2.out' });
        gsap.to(three.material, { size: baseSize, opacity: 0.75, duration: 0.6, ease: 'power2.inOut', delay: 0.35 });

        gsap.to(three.points.rotation, { y: three.points.rotation.y + Math.PI * 0.35, x: three.points.rotation.x + 0.18, duration: 0.65, ease: 'power3.out' });
    }

    function cinematicSwitch(toMode) {
        if (!window.gsap) {
            applyMode(toMode);
            return;
        }

        const overlay = buildOverlay(toMode);
        const tl = gsap.timeline({
            defaults: { ease: 'power2.out' },
            onComplete: () => overlay.remove()
        });

        document.body.classList.add('theme-switching');

        tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.22 });
        tl.fromTo(overlay, { scale: 0.98, filter: 'blur(14px)' }, { scale: 1.02, filter: 'blur(0px)', duration: 0.45 }, 0);
        tl.to(document.body, { filter: 'saturate(1.15) contrast(1.06)', duration: 0.25 }, 0);

        tl.add(() => applyMode(toMode), 0.18);
        tl.add(() => animateThreeBurst(), 0.2);

        tl.to(overlay, { opacity: 0, duration: 0.45 }, 0.35);
        tl.to(document.body, { filter: 'saturate(1) contrast(1)', duration: 0.45 }, 0.35);
        tl.add(() => document.body.classList.remove('theme-switching'), 0.9);
    }

    function nextMode() {
        currentModeIndex = (currentModeIndex + 1) % themeModes.length;
        const next = themeModes[currentModeIndex];

        if (themeAnimMode === 'cinematic') {
            cinematicSwitch(next);
        } else {
            applyMode(next);
            animateThreeBurst();
        }
    }

    function initTheme() {
        currentModeIndex = loadSavedMode();
        themeAnimMode = loadSavedAnimMode();
        applyMode(themeModes[currentModeIndex]);
    }

    function createThreeBackground() {
        const canvasHost = getCanvasEl();
        if (!canvasHost) return;
        if (three) return;

        if (!window.THREE) {
            // No Three.js available; still keep CSS theme switching working
            return;
        }

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvasHost.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 70;

        const count = 2200;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3 + 0] = (Math.random() - 0.5) * 220;
            positions[i3 + 1] = (Math.random() - 0.5) * 120;
            positions[i3 + 2] = (Math.random() - 0.5) * 160;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00d4ff,
            size: 1.15,
            transparent: true,
            opacity: 0.8,
            depthWrite: false
            ,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        let raf = 0;
        const start = performance.now();

        const animate = () => {
            raf = requestAnimationFrame(animate);
            const t = (performance.now() - start) * 0.00025;
            points.rotation.y = t * 0.85;
            points.rotation.x = Math.sin(t * 0.7) * 0.12;

            // Subtle twinkle: modulate opacity with a sinusoid
            const twinkle = 0.62 + 0.38 * Math.sin(t * 7.2);
            material.opacity = 0.55 + 0.45 * twinkle;

            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        three = { renderer, scene, camera, points, material, raf, onResize };
    }

    function spawnGlowOrbs() {
        if (document.querySelectorAll('.glow-orb').length > 0) return;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        const body = document.body;
        const orbs = [
            { cls: 'orb-1', w: 420, h: 420, top: '8%', left: '10%', delay: '0s', bg: 'rgba(0, 212, 255, 0.18)' },
            { cls: 'orb-2', w: 320, h: 320, top: '55%', right: '12%', delay: '-3s', bg: 'rgba(124, 58, 237, 0.18)' },
            { cls: 'orb-3', w: 360, h: 360, bottom: '18%', left: '28%', delay: '-6s', bg: 'rgba(6, 182, 212, 0.14)' },
        ];

        orbs.forEach((o) => {
            const el = document.createElement('div');
            el.className = `glow-orb ${o.cls}`;
            el.style.width = `${o.w}px`;
            el.style.height = `${o.h}px`;
            if (o.top) el.style.top = o.top;
            if (o.left) el.style.left = o.left;
            if (o.right) el.style.right = o.right;
            if (o.bottom) el.style.bottom = o.bottom;
            el.style.animationDelay = o.delay;
            el.style.background = o.bg;
            body.appendChild(el);
        });
    }

    function ensureScrollProgress() {
        if (document.getElementById('scroll-progress')) return;
        const bar = document.createElement('div');
        bar.id = 'scroll-progress';
        document.body.appendChild(bar);

        const update = () => {
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.transform = `scaleX(${Math.min(1, Math.max(0, pct / 100))})`;
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    // Public API (used by HTML onclick + preloader)
    window.switchTheme = () => {
        if (longPressConsumed) {
            longPressConsumed = false;
            return;
        }
        nextMode();
    };
    window.triggerThemeSwitch = window.switchTheme;
    window.initThreeJS = () => {
        initTheme();
        createThreeBackground();
    };

    // Init immediately (and preloader will also call initThreeJS)
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        createThreeBackground();

        // Premium UI enhancements (tilt, shine, cursor glow, scroll reveals)
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Cursor glow
        if (!reduceMotion && !document.querySelector('.cursor-glow')) {
            const glow = document.createElement('div');
            glow.className = 'cursor-glow';
            document.body.appendChild(glow);

            let tx = -9999, ty = -9999;
            let cx = -9999, cy = -9999;

            const onMove = (e) => {
                tx = e.clientX - 260;
                ty = e.clientY - 260;
            };
            window.addEventListener('pointermove', onMove, { passive: true });

            const tick = () => {
                cx += (tx - cx) * 0.12;
                cy += (ty - cy) * 0.12;
                glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }

        spawnGlowOrbs();
        ensureScrollProgress();

        // 3D tilt for cards
        if (!reduceMotion) {
            const tiltSelectors = [
                '.project-card',
                '.info-card',
                '.about-card',
                '.education-card',
                '.contact-card',
                '.contact-form',
                '.contact-sent-modal-inner',
                '.home-project-card',
                '.home-badge',
                '.home-social a',
                '.home-social',
                '.home-section-head',
                '.home-cta-row',
                '.home-cta-actions',
                '.home-center',
                '.home-cta-card',
                '.home-journey-panel'
            ];

            const tiltEls = Array.from(document.querySelectorAll(tiltSelectors.join(',')));
            tiltEls.forEach((el) => {
                el.classList.add('tilt-card');

                const onEnter = () => el.classList.add('tilt-active');
                const onLeave = () => {
                    el.classList.remove('tilt-active');
                    el.style.setProperty('--rx', '0deg');
                    el.style.setProperty('--ry', '0deg');
                    el.style.setProperty('--mx', '50%');
                    el.style.setProperty('--my', '50%');
                };

                const onMove = (e) => {
                    const r = el.getBoundingClientRect();
                    const px = (e.clientX - r.left) / r.width;
                    const py = (e.clientY - r.top) / r.height;

                    const ry = (px - 0.5) * 12; // left/right
                    const rx = -(py - 0.5) * 10; // up/down

                    el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
                    el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
                    el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
                    el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
                };

                el.addEventListener('pointerenter', onEnter);
                el.addEventListener('pointerleave', onLeave);
                el.addEventListener('pointermove', onMove);
            });
        }

        // Scroll-triggered reveals (global, subtle)
        if (!reduceMotion && window.gsap && window.ScrollTrigger) {
            gsap.utils.toArray([
                '.page-hero',
                '.hero-section',
                '.section-title',
                '.info-card',
                '.project-card',
                '.education-card',
                '.contact-card',
                '.contact-form',
                '.get-in-touch-header',
                '.home-journey-panel'
            ]).forEach((el) => {
                if (el.classList.contains('gsap-reveal')) return;
                el.classList.add('gsap-reveal');
                gsap.fromTo(el, { y: 22, opacity: 0 }, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
                });
            });
        }

        const btn = document.querySelector('.theme-toggle-fixed');
        if (btn) {
            let timer = 0;

            const start = () => {
                longPressConsumed = false;
                timer = window.setTimeout(() => {
                    longPressConsumed = true;
                    setAnimMode(themeAnimMode === 'cinematic' ? 'classic' : 'cinematic');
                }, 600);
            };

            const end = () => {
                if (timer) window.clearTimeout(timer);
                timer = 0;
            };

            btn.addEventListener('pointerdown', start);
            btn.addEventListener('pointerup', end);
            btn.addEventListener('pointercancel', end);
            btn.addEventListener('pointerleave', end);
        }
    });
})();
