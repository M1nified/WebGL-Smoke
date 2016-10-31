class Smoke3D {
  N: number = 15;
  accuracy = 1000;

  public particles;
  public smoke;

  public engine: Smoke3DEngine;
  public smokeMaterial = new THREE.PointsMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    size: 0.2,
    color: 0x110000
  });

  public scenes = [];

  constructor() {
    this.particles = new THREE.Geometry;
    let vertices = new Array(this.accuracy).fill(0).map(() => {
      return new THREE.Vector3(0, 0, 0);
    });
    this.particles.vertices = vertices;
    // this.particles.vertices.concat(vertices);

    this.smoke = new THREE.Points(this.particles, this.smokeMaterial);
    this.smoke.sortParticles = true;
    this.smoke.position.x = 10;
    this.smoke.name = new Date().toString();

    this.engine = new Smoke3DEngine(this.N);

    // this.engine.input_dens[10] = 10;
    // this.engine.input_u[10] = 10;
    // this.engine.input_v[10] = 10;
    // this.engine.input_w[10] = 10;

    this.engine.input_dens[this.engine.IX(15, 15, 0)] = 10;
    this.engine.input_u[this.engine.IX(15, 15, 0)] = 10;
    this.engine.input_v[this.engine.IX(15, 15, 0)] = 10;

    // this.engine.input_dens[this.engine.IX(1, 15, 0)] = 100;
    // this.engine.input_u[this.engine.IX(1, 15, 0)] = 0;
    // this.engine.input_v[this.engine.IX(1, 15, 0)] = 10;
  }
  public addToScene(scene) {
    this.scenes.push(scene);
    scene.add(this.smoke);
  }
  public simulate() {
    this.engine.simulate(() => {
      let sumAll = this.engine.dens.reduce((sum, curr) => {
        return sum + Math.floor(curr * 100000);
      });
      let perOne = this.accuracy / sumAll;
      // console.log(sumAll,perOne);

      let particleIndex = 0;
      for (let i = 1; i <= this.engine.N; i++) {
        for (let j = 1; j <= this.engine.N; j++) {
          for (let l = 1; l <= this.engine.N; l++) {
            let val = this.engine.dens[this.engine.IX(i, j, l)];
            let count = Math.floor(Math.floor(val * 100000) * perOne);

            // console.log(particleIndex,this.particles.vertices.length,count);
            // console.log(this.particles.vertices);
            // debugger;

            for (let k = 0; k < count && particleIndex < this.particles.vertices.length; k++) {
              this.particles.vertices[particleIndex].x = Math.random() + i;
              this.particles.vertices[particleIndex].y = Math.random() + l;
              this.particles.vertices[particleIndex].z = Math.random() + j;
              particleIndex++;
            }
          }
        }
      }
      this.particles.__dirtyVertices = true;
      this.particles.verticesNeedUpdate = true;
    })
  }
}