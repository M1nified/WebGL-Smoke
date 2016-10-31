class Smoke2DEngine {

  private _N: number = 3;
  get N() { return this._N; }
  set N(N) { this._N = N; }
  get size() { return Math.pow(this.N + 2,2); }
  IX(x: number, y: number) { // flatten 2D -> 1D
    return Smoke2DEngine.IX(this.N,x,y);
  }
  static IX(N: number, x: number, y: number) {
    return x + (N + 2) * y;
  }

  visc:number = 1;
  diff:number = 1;
  dt:number = 1;

  u: number[];
  v: number[];
  u_prev: number[];
  v_prev: number[];

  dens: number[];
  dens_prev: number[];

  input_dens: number[];
  input_u: number[];
  input_v: number[];

  simulating: boolean = false;

  constructor(N?: number) {
    this.N = N || this.N;
    this.adjustArrays();
    this.input_clear();
  }
  adjustArrays() {
    this.u = new Array(this.size).fill(0);
    this.v = new Array(this.size).fill(0);
    this.u_prev = new Array(this.size).fill(0);
    this.v_prev = new Array(this.size).fill(0);
    this.dens = new Array(this.size).fill(0);
    this.dens_prev = new Array(this.size).fill(0);
  }

  input_clear() {
    this.input_dens = new Array(this.size).fill(0);
    this.input_u = new Array(this.size).fill(0);
    this.input_v = new Array(this.size).fill(0);
  }

  get_from_input() {
    Object.assign(this.dens_prev, this.input_dens);
    Object.assign(this.u_prev, this.input_u);
    Object.assign(this.v_prev, this.input_v);
  }

  simulate(callback?:Function) {
    if (this.simulating) return;
    this.simulating = true;
    this.simulation_step(callback);
  }
  simulation_step(callback?:Function) {
    if (!this.simulating) return;
    this.get_from_input();
    // console.log(1,this.dens);
    Smoke2DEngine.vel_step(this.N, this.u, this.v, this.u_prev, this.v_prev, this.visc, this.dt);
    // console.log(2,this.dens);
    Smoke2DEngine.dens_step(this.N, this.dens, this.dens_prev, this.u, this.v, this.diff, this.dt);
    // console.log(3,this.dens);
    if(typeof callback === 'function') callback();
    setTimeout(this.simulation_step.bind(this,callback), 1000);
  }

  static swap_objects(a: Object, b: Object) {
    let clean = (obj: Object) => {
      for (let member in obj) delete obj[member];
      if (Array.isArray(obj)) {
        obj.length = 0;
      }
    }
    let tmp = new Object();
    Object.assign(tmp, a);
    clean(a);
    Object.assign(a, b);
    clean(b);
    Object.assign(b, tmp);
  }

  static add_source(N: number, x: number[], s: number[], dt: number) {
    let size = Math.pow(N+2,2);
    s.forEach((value, index) => {
      x[index] += dt * value;
    })
  }

  static diffuse(N: number, b: number, x: number[], x0: number[], diff: number, dt: number) {
    let i, j, k;
    let a = dt * diff * N * N;

    for (k = 0; k < 20; k++) {
      for (i = 1; i <= N; i++) {
        for (j = 1; j <= N; j++) {
          x[Smoke2DEngine.IX(N, i, j)] =
            (
              x0[Smoke2DEngine.IX(N, i, j)] +
              a * (
                x[Smoke2DEngine.IX(N, i - 1, j)] + x[Smoke2DEngine.IX(N, i + 1, j)] + x[Smoke2DEngine.IX(N, i, j - 1)] + x[Smoke2DEngine.IX(N, i, j + 1)]
              )
            ) / (1 + 4 * a);
        }
      }
      Smoke2DEngine.set_bnd(N, b, x);
    }
  }

  static advect(N: number, b: number, d: number[], d0: number[], u: number[], v: number[], dt: number) {
    let i, j, i0, j0, i1, j1;
    let x, y, s0, t0, s1, t1, dt0;
    let oob = val => {
      if (val < 0.5) return 0.5;
      if (val > N + 0.5) return N + 0.5;
      return val;
    }
    dt0 = dt * N;
    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        x = i - dt0 * u[Smoke2DEngine.IX(N, i, j)];
        y = j - dt0 * v[Smoke2DEngine.IX(N, i, j)];
        x = oob(x); i0 = Math.floor(x); i1 = i0 + 1;
        y = oob(y); j0 = Math.floor(y); j1 = j0 + 1;
        s1 = x - i0; s0 = 1 - s1; t1 = y - j0; t0 = 1 - t1;
        d[Smoke2DEngine.IX(N, i, j)] =
          s0 * (
            t0 * d0[Smoke2DEngine.IX(N, i0, j0)] + t1 * d0[Smoke2DEngine.IX(N, i0, j1)]
          ) +
          s1 * (
            t0 * d0[Smoke2DEngine.IX(N, i1, j0)] + t1 * d0[Smoke2DEngine.IX(N, i1, j1)]
          );
      }
    }
    Smoke2DEngine.set_bnd(N, b, d);
  }

  static dens_step(N: number, x: number[], x0: number[], u: number[], v: number[], diff: number, dt: number) {
    Smoke2DEngine.add_source(N, x, x0, dt);
    // console.log(21,x);
    Smoke2DEngine.swap_objects(x0, x);
    // console.log(22,x);
    Smoke2DEngine.diffuse(N, 0, x, x0, diff, dt);
    // console.log(23,x);
    Smoke2DEngine.swap_objects(x0, x);
    // console.log(24,x);
    Smoke2DEngine.advect(N, 0, x, x0, u, v, dt);
    // console.log(25,x);
  }

  static vel_step(N: number, u: number[], v: number[], u0: number[], v0: number[], visc: number, dt: number) {
    Smoke2DEngine.add_source(N, u, u0, dt);
    Smoke2DEngine.add_source(N, v, v0, dt);
    Smoke2DEngine.swap_objects(u0, u);
    Smoke2DEngine.diffuse(N, 1, u, u0, visc, dt);
    Smoke2DEngine.swap_objects(v0, v);
    Smoke2DEngine.diffuse(N, 2, v, v0, visc, dt);
    Smoke2DEngine.project(N, u, v, u0, v0);
    Smoke2DEngine.swap_objects(u0, u);
    Smoke2DEngine.swap_objects(v0, v);
    Smoke2DEngine.advect(N, 1, u, u0, u0, v0, dt);
    Smoke2DEngine.advect(N, 2, v, v0, u0, v0, dt);
    Smoke2DEngine.project(N, u, v, u0, v0);
  }

  static project(N: number, u: number[], v: number[], p: number[], div: number[]) {
    let i, j, k;
    let h = 1 / N;

    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        div[Smoke2DEngine.IX(N, i, j)] = -0.5 * h * (
          u[Smoke2DEngine.IX(N, i + 1, j)] - u[Smoke2DEngine.IX(N, i - 1, j)] +
          v[Smoke2DEngine.IX(N, i, j + 1)] - v[Smoke2DEngine.IX(N, i, j - 1)]
        );
        p[Smoke2DEngine.IX(N, i, j)] = 0;
      }
    }
    Smoke2DEngine.set_bnd(N, 0, div);
    Smoke2DEngine.set_bnd(N, 0, p);

    for (k = 0; k < 20; k++) {
      for (i = 1; i <= N; i++) {
        for (j = 1; j <= N; j++) {
          p[Smoke2DEngine.IX(N, i, j)] = (
            div[Smoke2DEngine.IX(N, i, j)] +
            p[Smoke2DEngine.IX(N, i - 1, j)] +
            p[Smoke2DEngine.IX(N, i + 1, j)] +
            p[Smoke2DEngine.IX(N, i, j - 1)] +
            p[Smoke2DEngine.IX(N, i, j + 1)]
          ) / 4;
        }
      }
      Smoke2DEngine.set_bnd(N, 0, p);
    }

    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        u[Smoke2DEngine.IX(N, i, j)] -= 0.5 * (
          p[Smoke2DEngine.IX(N, i + 1, j)] - p[Smoke2DEngine.IX(N, i - 1, j)]
        ) / h;
        v[Smoke2DEngine.IX(N, i, j)] -= 0.5 * (
          p[Smoke2DEngine.IX(N, i, j + 1)] - p[Smoke2DEngine.IX(N, i, j - 1)]
        ) / h;
      }
    }
    Smoke2DEngine.set_bnd(N, 1, u);
    Smoke2DEngine.set_bnd(N, 2, v);
  }

  static set_bnd(N: number, b: number, x: number[]) {
    for (let i = 1; i <= N; i++) {
      x[Smoke2DEngine.IX(N, 0, i)] = b == 1 ? -x[Smoke2DEngine.IX(N, 1, i)] : x[Smoke2DEngine.IX(N, 1, i)];
      x[Smoke2DEngine.IX(N, N + 1, i)] = b == 1 ? -x[Smoke2DEngine.IX(N, N, i)] : x[Smoke2DEngine.IX(N, N, i)];
      x[Smoke2DEngine.IX(N, i, 0)] = b == 2 ? -x[Smoke2DEngine.IX(N, i, 1)] : x[Smoke2DEngine.IX(N, i, 1)];
      x[Smoke2DEngine.IX(N, i, N + 1)] = b == 2 ? -x[Smoke2DEngine.IX(N, i, N)] : x[Smoke2DEngine.IX(N, i, N)];
    }
    x[Smoke2DEngine.IX(N, 0, 0)] = 0.5 * (x[Smoke2DEngine.IX(N, 1, 0)] + x[Smoke2DEngine.IX(N, 0, 1)]);
    x[Smoke2DEngine.IX(N, 0, N + 1)] = 0.5 * (x[Smoke2DEngine.IX(N, 1, N + 1)] + x[Smoke2DEngine.IX(N, 0, N)]);
    x[Smoke2DEngine.IX(N, N + 1, 0)] = 0.5 * (x[Smoke2DEngine.IX(N, N, 0)] + x[Smoke2DEngine.IX(N, N + 1, 1)]);
    x[Smoke2DEngine.IX(N, N + 1, N + 1)] = 0.5 * (x[Smoke2DEngine.IX(N, N, N + 1)] + x[Smoke2DEngine.IX(N, N + 1, N)]);
  }
}