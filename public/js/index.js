import { Bars, createKey } from "./bars.js"

import * as THREE from "./threejs/three.js"
import { OrbitControls } from './threejs/OrbitControls.js';
import { TransformControls } from "./threejs/TransformControls.js";

import { EffectComposer } from "./threejs/EffectComposer.js";
import { ShaderPass } from "./threejs/ShaderPass.js";
import { FXAAShader } from "./threejs/FXAAShader.js"
import { RenderPass } from "./threejs/RenderPass.js"
import { OutlinePass } from "./threejs/OutlinePass.js"

var extend = function (obj, ext) {
  for (var key in ext) if (ext.hasOwnProperty(key)) obj[key] = ext[key];
  return obj;
};

let default_object = () => {
  return {
    "position_x": 0,
    "position_y": 0,
    "position_z": 0,

    "rotation_x": 0,
    "rotation_y": 0,
    "rotation_z": 0,
  }
}

let objects = {
  "fake key": extend(default_object(), {
    "type": "canvas",
  })
}

let object_extras = {

}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const bars = new Bars(document.getElementById("root"))

const draw_canvas = document.createElement("canvas")
const ctx = draw_canvas.getContext("2d")

const canvas_resolution = 1000
const axis_length = 100000

draw_canvas.width = canvas_resolution;
draw_canvas.height = canvas_resolution;
draw_canvas.id = "drawcanvas"

ctx.fillStyle = "blue"

let hasUpdates = false
let selected_object
let selected_tool = "select"
let orbit_control = true

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xffffff)

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

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

const canvas_border_outline_pass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), //resolution parameter
  scene,
  camera
);
canvas_border_outline_pass.edgeStrength = 1.0;
canvas_border_outline_pass.edgeGlow = 0.0;
canvas_border_outline_pass.edgeThickness = 0.25;
canvas_border_outline_pass.pulsePeriod = 0;
canvas_border_outline_pass.usePatternTexture = false; // patter texture for an object mesh
canvas_border_outline_pass.visibleEdgeColor.set("#000000"); // set basic edge color
canvas_border_outline_pass.hiddenEdgeColor.set("#000000"); // set edge color when it hidden by other objects
composer.addPass(canvas_border_outline_pass);

const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
effectFXAA.renderToScreen = true;
composer.addPass(effectFXAA);

const orbit_controls = new OrbitControls( camera, renderer.domElement );
orbit_controls.update();

const transform_controls = new TransformControls(camera, renderer.domElement)
transform_controls.setMode("translate")
scene.add(transform_controls)

transform_controls.addEventListener("mouseDown", function(event) {
  orbit_control = false
  orbit_controls.enabled = false
})

transform_controls.addEventListener("mouseUp", function(event) {
  orbit_control = true
  orbit_controls.enabled = true
})


// Axis
const x_axis_material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
const x_axis_geometry = new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(-axis_length, 0, 0), new THREE.Vector3(axis_length, 0, 0)])
const x_axis_line = new THREE.Line( x_axis_geometry, x_axis_material );
scene.add(x_axis_line)

const y_axis_material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
const y_axis_geometry = new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(0, -axis_length, 0), new THREE.Vector3(0, axis_length, 0)])
const y_axis_line = new THREE.Line( y_axis_geometry, y_axis_material );
scene.add(y_axis_line)

const z_axis_material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
const z_axis_geometry = new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(0, 0, -axis_length), new THREE.Vector3(0, 0, axis_length)])
const z_axis_line = new THREE.Line( z_axis_geometry, z_axis_material );
scene.add(z_axis_line)

function getRelativePosition(x, y, element)
{
  const rect = element.getBoundingClientRect()
  return [(x-rect.left)/rect.width, (y-rect.top)/rect.height]
}

// Plane
const canvas_geometry = new THREE.BufferGeometry();

const canvas_geometry_vertices = [
  -1, -1, 0,
  1, -1, 0,
  1, 1, 0,
  -1, 1, 0
];

const canvas_geometry_indices = [
  0, 1, 2, // first triangle
  2, 3, 0 // second triangle
];

const canvas_geometry_uvs = [
  0,0,
  1,0,
  1,1,
  0,1
];

// Set the attribute on your  geometry
canvas_geometry.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( canvas_geometry_uvs ), 2 ) );
canvas_geometry.setAttribute('position', new THREE.Float32BufferAttribute(canvas_geometry_vertices, 3));
canvas_geometry.setIndex(canvas_geometry_indices);

function read_object_transform(key)
{

}

function update_object_transform(key)
{
  const object = objects[key]
  const extras = object_extras[key]

  extras.mesh.position.set(object.position_x, object.position_y, object.position_z)

  const rot = extras.rot
  rot._x = object.rotation_x
  rot._y = object.rotation_y
  rot._z = object.rotation_z
  extras.mesh.setRotationFromEuler(rot)
}

function add_canvas(key, object)
{
  const canvas = document.createElement("canvas")
  canvas.width = canvas_resolution
  canvas.height = canvas_resolution

  const texture = new THREE.CanvasTexture(draw_canvas)
  const material = new THREE.MeshBasicMaterial( { map: texture, color: 0xffffff,transparent: true } );
  material.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(canvas_geometry, material);

  canvas_border_outline_pass.selectedObjects.push(mesh)

  const pos = new THREE.Vector3(0, 0, 0)
  const rot = new THREE.Euler(0, 0, 0, "XYZ")

  if (object.image)
  {
    var img = new Image;
    img.src = object.image;
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        texture.needsUpdate = true
    }; 
  }
  
  const extras = {}

  extras.canvas = canvas
  extras.texture = texture
  extras.material = material
  extras.mesh = mesh

  extras.pos = pos
  extras.rot = rot

  object_extras[key] = extras

  update_object_transform(key)

  scene.add(mesh);
}

function create_canvas()
{
  const key = createKey()
}

Object.keys(objects).map((key) => {
  const object = objects[key]
  if (object.type == "canvas")
  {
    add_canvas(key, object)
  }
})

const TransformTools = {"translate": true, "rotate": true, "scale": true}
function update_selected(new_select, new_tool)
{
  console.log(new_select, selected_object)
  if (new_select != selected_object)
  {
    if (selected_object)
    {
      outlinePass.selectedObjects = []
      canvas_border_outline_pass.selectedObjects.push(object_extras[selected_object].mesh)
    }

    if (new_select)
    {
      const index = canvas_border_outline_pass.selectedObjects.indexOf(object_extras[new_select].mesh)
      canvas_border_outline_pass.selectedObjects.splice(index, 1)
      outlinePass.selectedObjects = [object_extras[new_select].mesh]
    }
  }


  if (new_select)
  {
    if (TransformTools[new_tool])
    {
      transform_controls.attach(object_extras[key].mesh)
    } else {
      transform_controls.detach()
    }
    
  } else {
    transform_controls.detach()
  }

  selected_object = new_select
}

bars.render()

bars.main_content.appendChild(renderer.domElement)
bars.main_content.appendChild(draw_canvas)
renderer.domElement.className = "scene-canvas"

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
function drawCircleRaw(ctx, x, y)
{
  ctx.fillStyle = drawColor
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.arc(x, y, brushRadius, 0, Math.PI*2)
  ctx.fill()
  ctx.closePath()
}

function drawCircle(e)
{
  if (!drawing) {return;}
  var rect = draw_canvas.getBoundingClientRect();
  var x = Math.round((e.clientX - rect.left)/rect.width * canvasScale);
  var y = Math.round((e.clientY - rect.top)/rect.height * canvasScale); 

  drawCircleRaw(ctx, x, y)

  const object = object_extras[selected_object]
  drawCircleRaw(object.canvas.getContext("2d"), x, y)
  object.texture.needsUpdate = true
  hasUpdates = true
}

document.body.onmousedown = function(e) { 
  mouseDown = true;

  if (selected_tool == "select")
  {
    const [x3d, y3d] = getRelativePosition(e.clientX, e.clientY, renderer.domElement)
    const [x2d, y2d] = getRelativePosition(e.clientX, e.clientY, draw_canvas)
  
    pointer.x = ( x3d ) * 2 - 1;
    pointer.y = - ( y3d ) * 2 + 1;
  
    raycaster.setFromCamera( pointer, camera );
    var intersects = raycaster.intersectObject(scene, true);
    let selectTarget
    for (let i = 0; i < intersects.length; i++)
    {
      Object.keys(object_extras).map(key => {
        if (object_extras[key].mesh == intersects[i].object)
        selectTarget = key
      })
    }
  
    if (selectTarget)
    {
      // Select Color
      if (selectTarget != selected_object)
      {
        update_selected(selectTarget, "select")
      } else {
        update_selected(null, "select")
      }
  
    } else if (x2d >= 0 && x2d <= 1 && y2d >= 0 && y2d <= 1) {
  
      drawing = true
      drawCircle(e)
    } else {
      if (selected_object)
      {
        update_selected(null, "select")
      }
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
  
  // mesh.position.set(0, 0, 0);

  // if (orbit_control)
  //   controls.update();

	renderer.render( scene, camera );
  composer.render();
}
animate();

// Autosave
setInterval(() => {
  if (!hasUpdates) {return;}

  localStorage.setItem("canvas", draw_canvas.toDataURL());
  console.log("Saved canvas")

  hasUpdates = false
  
}, 5000)

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