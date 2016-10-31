(function(){
  window.onload = function(){
    console.log("LOAD1");
    start();
  }
})();
var smoke,count=0;
function start(){

  function render() {
    // console.log('scene',scene)
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    controls.update();
    // console.log(camera.position)
  }

  function createFloor() {
    let geometry = new THREE.PlaneGeometry(200, 200, 5, 5);
    // geometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI/2));
    let material = new THREE.MeshBasicMaterial({ color: 0xc1c1c1 });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position = new THREE.Vector3(0,0,0);
    return mesh;
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // var geometry = new THREE.BoxGeometry( 10, 10, 10 );
  // var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  // var cube = new THREE.Mesh( geometry, material );
  // scene.add( cube );
  // setInterval(()=>{
  // 				cube.rotation.x += 0.01;
  // 				cube.rotation.y += 0.01;
  // },10);

  camera.position.x = 50;
  camera.position.y = 20;
  camera.position.z = 30;



  {
    var controls = new THREE.TrackballControls(camera);
    // controls.target.set( 10, -10, 10 )

    controls.rotateSpeed = 1;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = true;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];
  }

  // smoke = new Smoke();
  // smoke.addToScene(scene);

  // setInterval(()=>{
  //   smoke.animate();
  // },50);

  scene.add(createFloor());



  let s = new Smoke3D();
  s.addToScene(scene);
  s.simulate();



  render();


}
var v;