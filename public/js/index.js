import { Bars } from "./bars.js"
import * as THREE from "./three.js"

const bars = new Bars(document.getElementById("root"))

const draw_canvas = document.createElement("canvas")
draw_canvas.id = "drawcanvas"

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

bars.render()

bars.main_content.appendChild(renderer.domElement)
bars.main_content.appendChild(draw_canvas)
renderer.domElement.className = "scene-canvas"

function update_canvas_size()
{
  const width = bars.main_content.clientWidth
  const height = bars.main_content.clientHeight
  camera.aspect = width / height
  renderer.setSize( width, height, false);
  camera.updateProjectionMatrix();
  renderer.render( scene, camera );
}

update_canvas_size()
bars.events.connect("main-content-resize", update_canvas_size)

function animate() {
	requestAnimationFrame( animate );
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
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