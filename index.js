import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


let scene, camera, renderer, particles, composer;
let clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,1,5000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setClearColor("#000000");
    renderer.setSize(window.innerWidth,window.innerHeight);

    // bloom effect
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.2, 0);
    // bloomPass.threshold = 0;
    // bloomPass.strength = 10;
    // bloomPass.radius = 40;
    composer.addPass(bloomPass);


    document.body.appendChild(renderer.domElement);

    let geometry = new THREE.BufferGeometry();
    let vertices = [];

    for (let i = 0; i < 2000; i++) {
        let x = (Math.random() - 0.5) * 5000;
        let y = (Math.random() - 0.5) * 5000;
        let z = (Math.random() - 0.5) * 5000;

        const sizeCoef = 10000;
        vertices.push(x + (Math.random() - 0.5) * sizeCoef, y + (Math.random() - 0.5) * sizeCoef, z + (Math.random() - 0.5) * sizeCoef);
        vertices.push(x + (Math.random() - 0.5) * sizeCoef, y + (Math.random() - 0.5) * sizeCoef, z + (Math.random() - 0.5) * sizeCoef);
        vertices.push(x + (Math.random() - 0.5) * sizeCoef, y + (Math.random() - 0.5) * sizeCoef, z + (Math.random() - 0.5) * sizeCoef);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    let vertexShader = `
    varying vec3 vUv;

    void main() {
        vUv = position;

        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition;
    }
    `;

    let fragmentShader = `
        uniform float u_time;
        varying vec3 vUv;

        void main() {
            float time = u_time * 0.4 + ((0.01 * vUv.x) + (0.01 * vUv.y)); // Slower and more varied in time
            float glow = sin(time * 3.0) * 0.5 + 0.5; // Slower base glow effect

            // Calmer flickering
            float flicker = sin(time * 20.0) * 0.5 + 0.5;
            flicker = pow(flicker, 2.0);

            // Combining the glow and flicker, and reducing overall intensity
            glow *= flicker * 0.1;

            gl_FragColor = vec4(vec3(glow), glow); // Using glow for the alpha component to mimic light emission
        }
    `;




    let uniforms = {
        u_time: { value: 0.0 }
    };

    let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    });

    particles = new THREE.Mesh(geometry, material);
    scene.add(particles);

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    window.addEventListener('mousemove', animateParticles);
}

function animateParticles(event) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;

    camera.position.z = 1000 - mouseX * 2;
    camera.position.x = mouseY;
    camera.position.y = mouseX;
    
}

function animate() {
    requestAnimationFrame(animate);
    composer.render();
    renderer.render(scene, camera);

    // Update uniforms over time
    particles.material.uniforms.u_time.value = clock.getElapsedTime();
}

init();
animate();
