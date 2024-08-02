import './style.css'
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

/*
  BASIC COMPONENTS 
*/
const fov = 50;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;

const canvas = document.querySelector('canvas');
const camera = new THREE.PerspectiveCamera(
  fov,
  aspect,
  near,
  far
);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas });
const controls = new OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);

const character3DModel = {
  id: "humanoid",
  animationEffectType: "run",
  object: null
}
const lightingPower = 16;
const lightingColor = 0xffdc73;

let mixer,
  clock = new THREE.Clock();

/*
  SETUP
*/
camera.position.x = Math.PI;
camera.position.z = Math.PI * 1.5;
camera.position.y = Math.PI / 2;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/*
  PROGRAM FUNCTIONS
*/
function setMouse2DPosition(clientX, clientY) {
  // calculate mouse position in normalized device coordinates (-1 to +1) for both components
  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;
}

function detectRayCollision() {
  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersected = raycaster.intersectObjects(
    scene.children.filter(mesh => {
      return mesh.name === character3DModel.id
    })
  )?.length > 0;

  return intersected;
}

function onHDRMapLoaded(texture) {
  const gen = new THREE.PMREMGenerator(renderer);
  const envMap = gen.fromEquirectangular(texture).texture;
  texture.dispose();
  gen.dispose();
  scene.environment = envMap;
  scene.background = envMap;
}

function onModelLoaded(gltf) {
  character3DModel.object = gltf.scene;  // character 3D object is loaded
  character3DModel.object.name = character3DModel.id;
  character3DModel.object.position.x = 0;
  character3DModel.object.position.y = 0;
  character3DModel.object.position.z = 0;
  console.log("gltf > model loaded", character3DModel);

  mixer = new THREE.AnimationMixer(character3DModel.object);
  let activeAnimationEffect = gltf.animations.find(clip => clip.name === character3DModel.animationEffectType);
  if (activeAnimationEffect) {
    let clip = mixer.clipAction(activeAnimationEffect);
    clip.play();
  }

  character3DModel.object.castShadow = true;
  character3DModel.object.receiveShadow = true;

  scene.add(character3DModel.object);
}

function onMouseClick(event) {
  setMouse2DPosition(event.clientX, event.clientY);

  if (detectRayCollision()) {
    if (!character3DModel.object.scale.equals(new THREE.Vector3(2, 2, 2))) {
      character3DModel.object.scale.multiplyScalar(2);
      canvas.style.cursor = "zoom-out";
    } else {
      character3DModel.object.scale.set(1, 1, 1);
      canvas.style.cursor = "default";
    }
  }

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Frame processing
function renderFrame() {
  if (mixer) mixer.update(clock.getDelta());    // running animation 

  controls.update();
  renderer.render(scene, camera);
}

// Event Handlers
window.addEventListener('click', onMouseClick, false);
window.addEventListener('resize', onWindowResize, false);

/*
  MAIN THREAD
*/
const light = new THREE.DirectionalLight(lightingColor, lightingPower);   // Light
light.castShadow = true;
scene.add(light)

new RGBELoader().load('skyes.hdr', onHDRMapLoaded);
new GLTFLoader().load('model.glb', onModelLoaded, function (xhr) {
  console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
}, function (error) {
  alert(error)
});

renderer.setAnimationLoop(renderFrame);
