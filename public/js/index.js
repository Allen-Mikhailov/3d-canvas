import { Bars, createKey, IconButton, IconButtonSelectGroup, Events } from "./bars.js"

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

    "scale_x": 1,
    "scale_y": 1,
    "scale_z": 1
  }
}

const data_key = "objects:0.0"

let objects 

const saved_objects = localStorage.getItem(data_key)
if (saved_objects)
{
  objects = JSON.parse(saved_objects)
  console.log("found existing data", objects)
} else {
  objects = {
    "fake key": extend(default_object(), {
      "type": "canvas",
    }),
    "fake key2": extend(default_object(), {
      "type": "canvas",
      "position_x": 3
    })
  }
}

let object_extras = {

}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const events = new Events()
const bars = new Bars(document.getElementById("root"))

const tools_select_group = new IconButtonSelectGroup("tool_select", events)
tools_select_group.addButton("select", "squares")
tools_select_group.addButton("translate", "transform")
tools_select_group.addButton("rotate", "rotate")
tools_select_group.addButton("scale", "scale")
bars.toolbar.addItem(tools_select_group)

const vision_select_group = new IconButtonSelectGroup("icon_select", events)
vision_select_group.addButton("lines", "lines")
vision_select_group.addButton("clear", "circle")
bars.toolbar.addItem(vision_select_group)

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
let in_view_mode = false

const selected_border_color   = 0xff0000
const unselected_border_color = 0x000000

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xffffff)

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

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
  1,  -1, 0,
  1,  1,  0,
  -1, 1,  0
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

function update_canvas_borders(key)
{
  const extras = object_extras[key]
  const mesh = extras.mesh

  const top = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion).multiplyScalar(mesh.scale.y);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(mesh.quaternion).multiplyScalar(mesh.scale.x);

  extras.top_border.quaternion.copy(mesh.quaternion); 
  extras.top_border.position.copy(mesh.position).add(top)
  extras.top_border.scale.set(mesh.scale.x, 1, 1)

  extras.bottom_border.quaternion.copy(mesh.quaternion); 
  extras.bottom_border.position.copy(mesh.position).sub(top)
  extras.bottom_border.scale.set(mesh.scale.x, 1, 1)

  extras.left_border.quaternion.copy(mesh.quaternion); 
  extras.left_border.position.copy(mesh.position).sub(right)
  extras.left_border.scale.set(1, mesh.scale.y, 1)

  extras.right_border.quaternion.copy(mesh.quaternion); 
  extras.right_border.position.copy(mesh.position).add(right)
  extras.right_border.scale.set(1, mesh.scale.y, 1)
}

transform_controls.addEventListener("objectChange", function(e) {
  update_canvas_borders(selected_object)
  read_object_transform(selected_object)
  hasUpdates = true
})

function read_object_transform(key)
{
  const object = objects[key]
  const extras = object_extras[key]

  object.position_x = extras.mesh.position.x
  object.position_y = extras.mesh.position.y
  object.position_z = extras.mesh.position.z

  object.rotation_x = extras.mesh.rotation.x
  object.rotation_y = extras.mesh.rotation.y
  object.rotation_z = extras.mesh.rotation.z

  object.scale_x =  extras.mesh.scale.x
  object.scale_y =  extras.mesh.scale.y
  object.scale_z =  extras.mesh.scale.z
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

  extras.mesh.scale.set(object.scale_x, object.scale_y, object.scale_z)
}

const vertical_line_geometry = new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0)])
const horizontal_line_geometry = new THREE.BufferGeometry().setFromPoints(
  [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)])

function add_canvas(key, object)
{
  const canvas = document.createElement("canvas")
  canvas.width = canvas_resolution
  canvas.height = canvas_resolution
  canvas.id = "canvas:"+key

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.MeshBasicMaterial( { map: texture, color: 0xffffff,transparent: true } );
  material.side = THREE.DoubleSide
  material.depthWrite = false
  const mesh = new THREE.Mesh(canvas_geometry, material);

  const rot = new THREE.Euler(0, 0, 0, "XYZ")

  if (object.image)
  {
    var img = new Image;
    img.src = object.image;
    img.onload = function () {
      const canvas_ctx = canvas.getContext("2d")
      canvas_ctx.drawImage(img, 0, 0);
      texture.needsUpdate = true
    }; 
  }

  // Borders
  const border_material = new THREE.LineBasicMaterial({ color: unselected_border_color })
  const top_border    = new THREE.Line(horizontal_line_geometry, border_material)
  const bottom_border = new THREE.Line(horizontal_line_geometry, border_material)
  const left_border   = new THREE.Line(vertical_line_geometry, border_material)
  const right_border  = new THREE.Line(vertical_line_geometry, border_material)

  scene.add(top_border)
  scene.add(bottom_border)
  scene.add(left_border)
  scene.add(right_border)
  
  const extras = {}

  extras.canvas = canvas
  extras.texture = texture
  extras.material = material
  extras.mesh = mesh

  extras.top_border = top_border
  extras.bottom_border = bottom_border
  extras.left_border = left_border
  extras.right_border = right_border

  extras.rot = rot

  extras.border_material = border_material

  object_extras[key] = extras

  update_object_transform(key)
  update_canvas_borders(key)

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
  console.log("update_selected", new_select, new_tool)
  tools_select_group.setSelected(new_tool)
  if (new_select != selected_object)
  {
    if (selected_object)
    {
      const border_material = object_extras[selected_object].border_material
      border_material.color.setHex(unselected_border_color)
    }

    if (new_select)
    {
      const border_material = object_extras[new_select].border_material
      border_material.color.setHex(selected_border_color)
      
      if (objects[new_select].type == "canvas")
      {
        // Transfering Canvas Data
        const draw_ctx = draw_canvas.getContext("2d")
        draw_ctx.clearRect(0, 0, canvas_resolution, canvas_resolution)
        draw_ctx.drawImage(object_extras[new_select].canvas, 0, 0)
      }
    }
  }

  tools_select_group.action = (name) => {
    update_selected(selected_object, name)
  }

  // Disable/Enable canvas
  draw_canvas.style.display = (new_select && objects[new_select].type == "canvas")?"block":"none"


  if (new_select)
  {
    if (TransformTools[new_tool])
    {
      transform_controls.attach(object_extras[new_select].mesh)
      transform_controls.setMode(new_tool)

      if (new_tool == "scale")
      {
        transform_controls.showZ = false;
      } else {
        transform_controls.showZ = true;
      }
    } else {
      transform_controls.detach()
    }
    
  } else {
    transform_controls.detach()
  }

  selected_object = new_select
  selected_tool = new_tool
}

bars.render()

update_selected(null, "select")

bars.main_content.appendChild(draw_canvas)
renderer.domElement.className = "scene-canvas"
bars.main_content.prepend(renderer.domElement)

function update_canvas_size()
{
  const rect = bars.main_content.getBoundingClientRect()

  const width = rect.width
  const height = rect.height
  camera.aspect = width / height
  renderer.setSize( width, height, false);
  camera.updateProjectionMatrix();
  composer.setSize(width, height);

  renderer.domElement.style.top = `${rect.top}px`
  renderer.domElement.style.left = `${rect.left}px`

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
  var x = Math.round((e.clientX - rect.left)/rect.width * canvas_resolution);
  var y = Math.round((e.clientY - rect.top)/rect.height * canvas_resolution); 

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
      if (selectTarget) {break}
    }

    if (x2d >= 0 && x2d <= 1 && y2d >= 0 && y2d <= 1) {
  
      drawing = true
      drawCircle(e)
    } else if (selectTarget) {
      // Select Color
      if (selectTarget != selected_object)
      {
        update_selected(selectTarget, "select")
      } else {
        update_selected(null, "select")
      }
  
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

document.addEventListener("keydown", function(e) {
  if (e.key == "r")
  {
    update_selected(selected_object, "rotate")
  } else if (e.key == "t") {
    update_selected(selected_object, "translate")
  } else if (e.key == "s") {
    update_selected(selected_object, "scale")
  } else if (e.key == "q") {
    update_selected(selected_object, "select")
  }

  if (e.key == "v")
  {
    in_view_mode = !in_view_mode
    x_axis_line.visible = !in_view_mode
    y_axis_line.visible = !in_view_mode
    z_axis_line.visible = !in_view_mode

    Object.keys(objects).map((key) => {
      const extras = object_extras[key]

      extras.top_border.visible = !in_view_mode
      extras.bottom_border.visible = !in_view_mode
      extras.left_border.visible = !in_view_mode
      extras.right_border.visible = !in_view_mode
    })
  }
})

update_selected(null, "select")

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

  Object.keys(objects).map((key) => {
    const obj = objects[key]
    const extras = object_extras[key]

    obj.image = extras.canvas.toDataURL()
  })

  localStorage.setItem(data_key, JSON.stringify(objects))

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