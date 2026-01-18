import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

// Initialize GSAP plugins
gsap.registerPlugin(ScrollTrigger, SplitText);

/* LENIS SETUP */
const lenis = new Lenis();
function raf(time) {
    lenis.raf(time);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);

/* CONFIGURATION */
const CONFIG = {
    color: "#ebf5df",
    spread: 0.5,
    speed: 2,
};

const canvas = document.querySelector(".hero-canvas");
const hero = document.querySelector(".hero");

/* UTILS */
function hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res
        ? {
            r: parseInt(res[1], 16) / 255,
            g: parseInt(res[2], 16) / 255,
            b: parseInt(res[3], 16) / 255,
        }
        : { r: 1, g: 1, b: 1 };
}

const rgb = hexToRgb(CONFIG.color);

/* ASYNC SHADER LOADING & INITIALIZATION */
async function initApp() {
    // Load external GLSL files
    const vertexShader = await fetch('./shaders/vertex.glsl').then(res => res.text());
    const fragmentShader = await fetch('./shaders/fragment.glsl').then(res => res.text());

    /* THREE SCENE SETUP */
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
    });

    /* MESH & SHADER MATERIAL */
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        vertexShader, 
        fragmentShader, 
        uniforms: {
            uProgress: { value: 0 },
            uResolution: {
                value: new THREE.Vector2(hero.offsetWidth, hero.offsetHeight),
            },
            uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
            uSpread: { value: CONFIG.spread },
        },
        transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    /* RESIZE LOGIC (Defined and called after mesh exists) */
    function resize() {
        const w = hero.offsetWidth;
        const h = hero.offsetHeight;
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Safely update uniforms now that material/mesh are initialized
        material.uniforms.uResolution.value.set(w, h);
    }
    
    // Initial call and listener attachment
    resize();
    window.addEventListener("resize", resize);

    /* ANIMATION LOOP */
    let scrollProgress = 0;

    function animate() {
        material.uniforms.uProgress.value = scrollProgress;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    /* SCROLL BINDING */
    lenis.on("scroll", ({ scroll }) => {
        const maxScroll = hero.offsetHeight - window.innerHeight;
        scrollProgress = Math.min((scroll / maxScroll) * CONFIG.speed, 1.1);
    });

    /* TEXT ANIMATION (GSAP) */
    const heroH2 = document.querySelector(".hero-content h2");
    const split = new SplitText(heroH2, { type: "words" });
    const words = split.words;

    gsap.set(words, { opacity: 0 });

    ScrollTrigger.create({
        trigger: ".hero-content",
        start: "top 25%",
        end: "bottom 100%",
        onUpdate(self) {
            const progress = self.progress;
            const total = words.length;

            words.forEach((word, i) => {
                const a = i / total;
                const b = (i + 1) / total;

                let opacity = 0;
                if (progress >= b) opacity = 1;
                else if (progress >= a) {
                    opacity = (progress - a) / (b - a);
                }

                gsap.to(word, {
                    opacity,
                    duration: 0.1,
                    overwrite: true,
                });
            });
        },
    });
}

// Start the application
initApp();