(function(){
  window.onload = function(){
    console.log("LOAD1");
    start();
  }
})();
var smoke,count=0;
function start(){

  function render() {
    console.log('scene',scene)
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    controls.update();
  }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  var geometry = new THREE.BoxGeometry( 10, 10, 10 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  camera.position.z = 100;
  camera.position.y = 100;


  setInterval(()=>{
  				cube.rotation.x += 0.01;
  				cube.rotation.y += 0.01;
  },10);

  {
    var controls = new THREE.TrackballControls(camera);
    controls.target.set( 0, 0, 0 )

    controls.rotateSpeed = 20;
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



  let s = new Smoke2D();
  s.addToScene(scene);
  s.simulate();



  render();


}
var v;