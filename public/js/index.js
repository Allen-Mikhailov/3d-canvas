import { Bars } from "./bars.js"
import * as THREE from "./threejs/three.js"
import { OrbitControls } from './threejs/OrbitControls.js';

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

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const renderer = new THREE.WebGLRenderer();

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
  renderer.render( scene, camera );
}

update_canvas_size()
bars.events.connect("main-content-resize", update_canvas_size)

var mouseDown = 0;
let drawing = false;

let drawColor = "#00aa00"
let brushRadius = 20
function drawCircle(e)
{
  if (!drawing) {return;}
  var rect = draw_canvas.getBoundingClientRect();
  var x = Math.round((e.clientX - rect.left)/rect.width * canvasScale);
  var y = Math.round((e.clientY - rect.top)/rect.height * canvasScale); 

  cfx.fillStyle = drawCircle
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x, y, brushRadius, 0, Math.PI*2)
  ctx.fill()
  ctx.closePath()

  texture.needsUpdate = true
  hasUpdates = true
}

document.body.onmousedown = function(e) { 
  mouseDown = true;



  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( pointer, camera );
  var intersects = raycaster.intersectObject(scene, true);
  let foundSelectTarget

  drawing = true
  drawCircle(e)
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