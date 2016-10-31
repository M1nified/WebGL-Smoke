class Particle {
  public object;
  public weight = 1; // grams
  constructor(object?) {
    if (!object) {
      let geometry = new THREE.SphereBufferGeometry(5, 5, 5);
      let material = null;
      this.object = new THREE.Mesh(geometry, material);
    } else {
      this.object = object;
    }
  }
}