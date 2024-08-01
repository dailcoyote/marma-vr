import './style.css'
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Камера
const canvas = document.querySelector('canvas');
const loader = new GLTFLoader();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  2000);
const scene = new THREE.Scene();
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

let character, mixer, clock = new THREE.Clock();

loader.load('model.glb', function (gltf) {
  character = gltf.scene;  // character 3D object is loaded
  // character.scale.set(2, 2, 2);
  // character.position.y = 4;
  console.log("added", character)
  console.log("animations", gltf.animations)
  
  mixer = new THREE.AnimationMixer(character);
  let runAnimationEffect = gltf.animations.find( clip => clip.name === 'run');
  let clip = mixer.clipAction(runAnimationEffect);
  clip.play();
  
  scene.add(character);

}, function (xhr) {
  console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
}, function (error) {

  console.error(error);

});

// Light

const light = new THREE.AmbientLight(0xd9ead3, 2);
scene.add(light);

function animate() {
  // add to the rendering loop
	if ( mixer ) mixer.update( clock.getDelta() );
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
