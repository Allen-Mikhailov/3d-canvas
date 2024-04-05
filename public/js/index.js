import { Bars } from "./bars.js"

import * as THREE from "./threejs/three.js"
import { OrbitControls } from './threejs/OrbitControls.js';
import { DragControls } from "./threejs/DragControls.js"

import { EffectComposer } from "./threejs/EffectComposer.js";
import { ShaderPass } from "./threejs/ShaderPass.js";
import { FXAAShader } from "./threejs/FXAAShader.js"
import { RenderPass } from "./threejs/RenderPass.js"
import { OutlinePass } from "./threejs/OutlinePass.js"

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const bars = new Bars(document.getElementById("root"))

const draw_canvas = document.createElement("canvas")
const ctx = draw_canvas.getContext("2d")

const canvasScale = 1000

draw_canvas.width = canvasScale;
draw_canvas.height = canvasScale;
draw_canvas.id = "drawcanvas"

ctx.fillStyle = "blue"

let hasUpdates = false

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const outlinePass= new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
      scene,
      camera
);
outlinePass.edgeStrength = 3.0;
outlinePass.edgeGlow = 1.0;
outlinePass.edgeThickness = 3.0;
outlinePass.pulsePeriod = 0;
outlinePass.usePatternTexture = false; // patter texture for an object mesh
outlinePass.visibleEdgeColor.set("#000000"); // set basic edge color
outlinePass.hiddenEdgeColor.set("#000000"); // set edge color when it hidden by other objects
composer.addPass(outlinePass);

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
effectFXAA.renderToScreen = true;
composer.addPass(effectFXAA);

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

// Axis
const x_axis_material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
const x_axis_geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-100, 0, 0), new THREE.Vector3(100, 0, 0)])
const x_axis_line = new THREE.Line( x_axis_geometry, x_axis_material );
scene.add(x_axis_line)

const y_axis_material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
const y_axis_geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -100, 0), new THREE.Vector3(0, 100, 0)])
const y_axis_line = new THREE.Line( y_axis_geometry, y_axis_material );
scene.add(y_axis_line)

const z_axis_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
const z_axis_geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -100), new THREE.Vector3(0, 0, 100)])
const z_axis_line = new THREE.Line( z_axis_geometry, z_axis_material );
scene.add(z_axis_line)

function getRelativePosition(x, y, element)
{
  const rect = element.getBoundingClientRect()
  return [(x-rect.left)/rect.width, (y-rect.top)/rect.height]
}

// Plane Test
function CreateSquare()
{
  const geometry = new THREE.BufferGeometry();

  const vertices = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0
  ];

  const indices = [
    0, 1, 2, // first triangle
    2, 3, 0 // second triangle
  ];

  const uvs = [
    0,0,
    1,0,
    1,1,
    0,1
  ];
  
  // Set the attribute on your  geometry
  geometry.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvs ), 2 ) );
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);

  return geometry
}

const plane_test_geometry = CreateSquare()
const texture = new THREE.CanvasTexture(draw_canvas)
const canvas_texture = new THREE.MeshBasicMaterial( { map: texture, color: 0xffffff,transparent: true } );
const mesh = new THREE.Mesh(plane_test_geometry, canvas_texture);
canvas_texture.side = THREE.DoubleSide
scene.add(mesh);

camera.position.z = 5;

bars.render()

bars.main_content.appendChild(renderer.domElement)
bars.main_content.appendChild(draw_canvas)
renderer.domElement.className = "scene-canvas"

let originalCanvas = localStorage.getItem("canvas")
if (originalCanvas)
{
  var img = new Image;
  img.src = originalCanvas;
  img.onload = function () {
      ctx.drawImage(img, 0, 0);
      texture.needsUpdate = true
  }; 
} else {
  ctx.fillRect(0, 0, 300, 300)
}

function update_canvas_size()
{
  const width = renderer.domElement.clientWidth
  const height = renderer.domElement.clientHeight
  camera.aspect = width / height
  renderer.setSize( width, height, false);
  camera.updateProjectionMatrix();
  composer.setSize(width, height);

    effectFXAA.uniforms["resolution"].value.set(
      1 / width,
      1 / height
    );
  renderer.render( scene, camera );
}

update_canvas_size()
bars.events.connect("main-content-resize", update_canvas_size)

var mouseDown = false;
let drawing = false;

let drawColor = "#00aa00"
let brushRadius = 20
function drawCircle(e)
{
  if (!drawing) {return;}
  var rect = draw_canvas.getBoundingClientRect();
  var x = Math.round((e.clientX - rect.left)/rect.width * canvasScale);
  var y = Math.round((e.clientY - rect.top)/rect.height * canvasScale); 

  ctx.fillStyle = drawColor
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x, y, brushRadius, 0, Math.PI*2)
  ctx.fill()
  ctx.closePath()

  texture.needsUpdate = true
  hasUpdates = true
}

let selectedCanvas

document.body.onmousedown = function(e) { 
  mouseDown = true;

  const [x3d, y3d] = getRelativePosition(e.clientX, e.clientY, renderer.domElement)
  const [x2d, y2d] = getRelativePosition(e.clientX, e.clientY, draw_canvas)

  pointer.x = ( x3d ) * 2 - 1;
	pointer.y = - ( y3d ) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
  var intersects = raycaster.intersectObject(scene, true);
  let selectTarget
  for (let i = 0; i < intersects.length; i++)
  {
    if (intersects[i].object == mesh)
    {
      selectTarget = mesh
    }
  }

  if (selectTarget)
  {
    // Select Color
    if (selectedCanvas == selectTarget) {return;}
    selectedCanvas = selectTarget

    outlinePass.selectedObjects = [selectedCanvas]

  } else if (x2d >= 0 && x2d <= 1 && y2d >= 0 && y2d <= 1) {

    if (x2d < 0 || x2d > 1 || y2d < 0 || y2d > 1) {return;}

    drawing = true
    drawCircle(e)
  } else {
    if (selectedCanvas)
    {
      outlinePass.selectedObjects = []
      selectedCanvas = null
    }
  }
}
document.body.onmouseup = function() {
  mouseDown = false;
  drawing = false;
}

draw_canvas.onmousemove = drawCircle

function animate() {
	requestAnimationFrame( animate );
  
  mesh.position.set(0, 0, 0);

  controls.update();

	renderer.render( scene, camera );
  composer.render();
}
animate();

{/* <>
      {head_bar}
      <HorizontalBorder/>
      <div className='container-horizontal'>
        {mini_side_bar}
        <VerticalBorder/>
        {side_bar}
        <VerticalBorder/>
        <div id='main-content-container'>
            <div id='tab-container'>
              {selectedTab && tabs[selectedTab]}
            </div>
            <HorizontalBorder/>
            {tabs_bar}
        </div>
      </div>
    </> */}

setInterval(() => {
  if (!hasUpdates) {return;}

  localStorage.setItem("canvas", draw_canvas.toDataURL());
  console.log("Saved canvas")

  hasUpdates = false
  
}, 5000)