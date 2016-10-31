class Smoke2D {
  N: number = 10;

  public particles;
  public smoke;

  public engine: Smoke2DEngine;
  public smokeMaterial = new THREE.PointsMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    size: 20,
    color: 0x111111
  });

  public scenes = [];

  constructor() {
    this.particles = new THREE.Geometry;

    this.replaceSmokePoints();

    this.engine = new Smoke2DEngine(this.N);
    this.engine.input_dens[10] = 10;
    this.engine.input_u[10] = 10;
    this.engine.input_v[10] = 10;
  }
  public addToScene(scene) {
    this.scenes.push(scene);
    scene.add(this.smoke);
  }
  public replaceSmokePoints() {
    let smoke_prev = this.smoke;
    this.smoke = new THREE.Points(this.particles, this.smokeMaterial);
    this.smoke.sortParticles = true;
    this.smoke.position.x = 0;
    this.smoke.name = new Date().toString();
    return smoke_prev;
  }
  public simulate() {
    this.engine.simulate(() => {
      // this.particles.verticles = [];
      let particles_prev = this.particles;
      this.particles = new THREE.Geometry;
      for (let i = 1; i <= this.engine.N; i++) {
        for (let j = 1; j <= this.engine.N; j++) {
          let val = this.engine.dens[this.engine.IX(i, j)];
          this.spawn(Math.floor(val * 100000), i, j);
        }
      }
      this.particles.__dirtyVertices = true;
      this.particles.verticesNeedUpdate = true;
      let smoke_prev = this.replaceSmokePoints();
      this.scenes.forEach((scene) => {
        // console.log('remove', scene);
        scene.remove(smoke_prev);
        scene.add(this.smoke);
      })
    })
  }
  public spawn(count: number, x: number, y: number) {
    // console.log(count, x, y)
    this.particles.vertices.push(new Array(count).fill(0).map(() => {
      return new THREE.Vector3(
        Math.random() + x - 16,
        0,
        Math.random() + y - 16
      )
    }
    ))
  }
}