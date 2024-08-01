import './style.css'
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

// Камера
const canvas = document.querySelector('canvas');
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000);
const scene = new THREE.Scene();
camera.position.x = Math.PI / 2;
camera.position.z = Math.PI * 1.5;
camera.position.y = Math.PI;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

let character, mixer, clock = new THREE.Clock();

new RGBELoader().load('skyes.hdr', texture => {
  const gen = new THREE.PMREMGenerator(renderer)
  const envMap = gen.fromEquirectangular(texture).texture
  texture.dispose()
  gen.dispose()
  scene.environment = envMap
  scene.background = envMap
});

new GLTFLoader().load('model.glb', function (gltf) {
  character = gltf.scene;  // character 3D object is loaded
  // character.scale.set(2, 2, 2);
  character.position.x = 0;
  character.position.y = 0;
  console.log("added", character)
  console.log("animations", gltf.animations)

  mixer = new THREE.AnimationMixer(character);
  let runAnimationEffect = gltf.animations.find(clip => clip.name === 'run');
  if (runAnimationEffect) {
    let clip = mixer.clipAction(runAnimationEffect);
    clip.play();
  }

  character.castShadow = true;
  character.receiveShadow = false;

  scene.add(character);

}, function (xhr) {
  console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
}, function (error) {
  console.error(error);
});

function animate() {
  if (mixer) mixer.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Window sizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}, false);

animate();
