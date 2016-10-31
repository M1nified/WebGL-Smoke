class Smoke{

  public particles; 
  public smoke;

  constructor(){
    this.particles = new THREE.Geometry;
    for (var i = 0; i < 30000; i++) {
        var particle = new THREE.Vector3(Math.random() * 32 - 16, Math.random() * 230, Math.random() * 32 - 16);
        this.particles.vertices.push(particle);
    }
    let smokeMaterial = new THREE.PointsMaterial({ 
      // map: smokeTexture,
      transparent: true, 
      blending: THREE.AdditiveBlending, 
      size: 0.1, 
      color: 0x111111
    });

    this.smoke = new THREE.Points(this.particles, smokeMaterial);
    this.smoke.sortParticles = true;
    this.smoke.position.x = 0;
  }
  public addToScene(scene){
    scene.add(this.smoke);
  }
  public animate(){
    this.particles.vertices.forEach((particle)=>{
      count++;
      particle.y += 0.1;
      if(particle.y >= 230){
        particle.y = Math.random() * 16;
        particle.x = Math.random() * 32 - 16;
        particle.z = Math.random() * 32 - 16;
      }
    });
    this.particles.__dirtyVertices = true;
    this.particles.verticesNeedUpdate = true;
  }
}