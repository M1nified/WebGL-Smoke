class Smoke3DEngine {

  private _N: number = 3;
  get N() { return this._N; }
  set N(N) { this._N = N; }
  get size() { return Math.pow(this.N + 2, 3); }
  IX(x: number, y: number, z: number) { // flatten 2D -> 1D
    return Smoke3DEngine.IX(this.N, x, y, z);
  }
  static IX(N: number, x: number, y: number, z: number) {
    return x + (N + 2) * y + Math.pow(N + 2, 2) * z;
  }
  IXrev(index: number) {
    return Smoke3DEngine.IXrev(this.N, index);
  }
  static IXrev(N: number, index: number) {
    let x = index % (N + 2);
    let y = (index - x) / (N + 2);
    let z = (index - x - y) / (N + 2);
    return { x, y, z };
  }

  visc: number = 1;
  diff: number = 1;
  dt: number = 1;

  u: number[];
  v: number[];
  w: number[];
  u_prev: number[];
  v_prev: number[];
  w_prev: number[];

  dens: number[];
  dens_prev: number[];

  input_dens: number[];
  input_u: number[];
  input_v: number[];
  input_w: number[];

  simulating: boolean = false;

  constructor(N?: number) {
    this.N = N || this.N;
    this.adjustArrays();
    this.input_clear();
  }
  adjustArrays() {
    this.u = new Array(this.size).fill(0);
    this.v = new Array(this.size).fill(0);
    this.w = new Array(this.size).fill(0);
    this.u_prev = new Array(this.size).fill(0);
    this.v_prev = new Array(this.size).fill(0);
    this.w_prev = new Array(this.size).fill(0);
    this.dens = new Array(this.size).fill(0);
    this.dens_prev = new Array(this.size).fill(0);
  }

  input_clear() {
    this.input_dens = new Array(this.size).fill(0);
    this.input_u = new Array(this.size).fill(0);
    this.input_v = new Array(this.size).fill(0);
    this.input_w = new Array(this.size).fill(0);
  }

  get_from_input() {
    Object.assign(this.dens_prev, this.input_dens);
    Object.assign(this.u_prev, this.input_u);
    Object.assign(this.v_prev, this.input_v);
  }

  simulate(callback?: Function) {
    if (this.simulating) return;
    this.simulating = true;
    this.simulation_step(callback);
  }
  simulation_step(callback?: Function) {
    if (!this.simulating) return;
    this.get_from_input();
    // console.log(1,this.dens);
    Smoke3DEngine.vel_step(this.N, this.u, this.v, this.w, this.u_prev, this.v_prev, this.w_prev, this.visc, this.dt);
    // console.log(2,this.dens);
    Smoke3DEngine.dens_step(this.N, this.dens, this.dens_prev, this.u, this.v, this.w, this.diff, this.dt);
    // console.log(3,this.dens);
    if (typeof callback === 'function') callback();
    setTimeout(this.simulation_step.bind(this, callback), 100);
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
    let size = Math.pow(N + 2, 2);
    s.forEach((value, index) => {
      x[index] += dt * value;
    })
  }

  static diffuse(N: number, b: number, x: number[], x0: number[], diff: number, dt: number) {
    let i, j, k, l;
    let a = dt * diff * N * N;

    for (k = 0; k < 20; k++) {
      for (i = 1; i <= N; i++) {
        for (j = 1; j <= N; j++) {
          for (l = 1; l <= N; l++) {
            x[Smoke3DEngine.IX(N, i, j, l)] =
              (
                x0[Smoke3DEngine.IX(N, i, j, l)] +
                a * (
                  x[Smoke3DEngine.IX(N, i - 1, j, l)] + x[Smoke3DEngine.IX(N, i + 1, j, l)] +
                  x[Smoke3DEngine.IX(N, i, j - 1, l)] + x[Smoke3DEngine.IX(N, i, j + 1, l)] +
                  x[Smoke3DEngine.IX(N, i, j, l - 1)] + x[Smoke3DEngine.IX(N, i, j, l + 1)]
                )
              ) / (1 + 6 * a);
          }
        }
      }
      Smoke3DEngine.set_bnd(N, b, x);
    }
  }

  static advect(N: number, b: number, d: number[], d0: number[], u: number[], v: number[], w: number[], dt: number) {
    let i, j, l, i0, j0, l0, i1, j1, l1;
    let x, y, z, s0, t0, w0, s1, t1, w1, dt0;
    let oob = val => {
      if (val < 0.5) return 0.5;
      if (val > N + 0.5) return N + 0.5;
      return val;
    }
    dt0 = dt * N;
    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        for (l = 1; l <= N; l++) {
          x = i - dt0 * u[Smoke3DEngine.IX(N, i, j, l)];
          y = j - dt0 * v[Smoke3DEngine.IX(N, i, j, l)];
          z = l - dt0 * w[Smoke3DEngine.IX(N, i, j, l)];
          x = oob(x); i0 = Math.floor(x); i1 = i0 + 1;
          y = oob(y); j0 = Math.floor(y); j1 = j0 + 1;
          z = oob(z); l0 = Math.floor(z); l1 = l0 + 1;
          s1 = x - i0; s0 = 1 - s1;
          t1 = y - j0; t0 = 1 - t1;
          w1 = z - l0; w0 = 1 - w1;

          d[Smoke3DEngine.IX(N, i, j, l)] = //TODO
            s0 * (
              t0 * d0[Smoke3DEngine.IX(N, i0, j0, l0)] + t1 * d0[Smoke3DEngine.IX(N, i0, j1, l0)]
            ) +
            s1 * (
              t0 * d0[Smoke3DEngine.IX(N, i1, j0, l0)] + t1 * d0[Smoke3DEngine.IX(N, i1, j1, l0)]
            );
        }
      }
    }
    Smoke3DEngine.set_bnd(N, b, d);
  }

  static dens_step(N: number, x: number[], x0: number[], u: number[], v: number[], w: number[], diff: number, dt: number) {
    Smoke3DEngine.add_source(N, x, x0, dt);
    // console.log(21,x);
    Smoke3DEngine.swap_objects(x0, x);
    // console.log(22,x);
    Smoke3DEngine.diffuse(N, 0, x, x0, diff, dt);
    // console.log(23,x);
    Smoke3DEngine.swap_objects(x0, x);
    // console.log(24,x);
    Smoke3DEngine.advect(N, 0, x, x0, u, v, w, dt);
    // console.log(25,x);
  }

  static vel_step(N: number, u: number[], v: number[], w: number[], u0: number[], v0: number[], w0: number[], visc: number, dt: number) {
    Smoke3DEngine.add_source(N, u, u0, dt);
    Smoke3DEngine.add_source(N, v, v0, dt);
    Smoke3DEngine.swap_objects(u0, u);
    Smoke3DEngine.diffuse(N, 1, u, u0, visc, dt);
    Smoke3DEngine.swap_objects(v0, v);
    Smoke3DEngine.diffuse(N, 2, v, v0, visc, dt);
    Smoke3DEngine.project(N, u, v, w, u0, v0);
    Smoke3DEngine.swap_objects(u0, u);
    Smoke3DEngine.swap_objects(v0, v);
    Smoke3DEngine.advect(N, 1, u, u0, u0, v0, w0, dt);
    Smoke3DEngine.advect(N, 2, v, v0, u0, v0, w0, dt);
    Smoke3DEngine.advect(N, 3, w, w0, u0, v0, w0, dt);
    Smoke3DEngine.project(N, u, v, w, u0, v0);
  }

  static project(N: number, u: number[], v: number[], w: number[], p: number[], div: number[]) {
    let i, j, k, l;
    let h = 1 / N;

    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        for (l = 1; l <= N; l++) {
          div[Smoke3DEngine.IX(N, i, j, l)] = -0.5 * h * (
            u[Smoke3DEngine.IX(N, i + 1, j, l)] - u[Smoke3DEngine.IX(N, i - 1, j, l)] +
            v[Smoke3DEngine.IX(N, i, j + 1, l)] - v[Smoke3DEngine.IX(N, i, j - 1, l)] +
            w[Smoke3DEngine.IX(N, i, j, l + 1)] - w[Smoke3DEngine.IX(N, i, j, l - 1)]
          );
          p[Smoke3DEngine.IX(N, i, j, l)] = 0;
        }
      }
    }
    Smoke3DEngine.set_bnd(N, 0, div);
    Smoke3DEngine.set_bnd(N, 0, p);

    for (k = 0; k < 20; k++) {
      for (i = 1; i <= N; i++) {
        for (j = 1; j <= N; j++) {
          for (l = 1; l <= N; l++) {
            p[Smoke3DEngine.IX(N, i, j, l)] = (
              div[Smoke3DEngine.IX(N, i, j, l)] +
              p[Smoke3DEngine.IX(N, i - 1, j, l)] +
              p[Smoke3DEngine.IX(N, i + 1, j, l)] +
              p[Smoke3DEngine.IX(N, i, j - 1, l)] +
              p[Smoke3DEngine.IX(N, i, j + 1, l)] +
              p[Smoke3DEngine.IX(N, i, j, l - 1)] +
              p[Smoke3DEngine.IX(N, i, j, l + 1)]
            ) / 6;
          }
        }
      }
      Smoke3DEngine.set_bnd(N, 0, p);
    }

    for (i = 1; i <= N; i++) {
      for (j = 1; j <= N; j++) {
        for (l = 1; l <= N; l++) {
          u[Smoke3DEngine.IX(N, i, j, l)] -= 0.5 * (
            p[Smoke3DEngine.IX(N, i + 1, j, l)] - p[Smoke3DEngine.IX(N, i - 1, j, l)]
          ) / h;
          v[Smoke3DEngine.IX(N, i, j, l)] -= 0.5 * (
            p[Smoke3DEngine.IX(N, i, j + 1, l)] - p[Smoke3DEngine.IX(N, i, j - 1, l)]
          ) / h;
          w[Smoke3DEngine.IX(N, i, j, l)] -= 0.5 * (
            p[Smoke3DEngine.IX(N, i, j, l + 1)] - p[Smoke3DEngine.IX(N, i, j, l - 1)]
          ) / h;
        }
      }
    }
    Smoke3DEngine.set_bnd(N, 1, u);
    Smoke3DEngine.set_bnd(N, 2, v);
    Smoke3DEngine.set_bnd(N, 3, w);
  }

  static set_bnd(N: number, b: number, x: number[]) {
    for (let i = 1; i <= N; i++) {
      x[Smoke3DEngine.IX(N, 0, i, 0)] = b == 1 ? -x[Smoke3DEngine.IX(N, 1, i, 1)] : x[Smoke3DEngine.IX(N, 1, i, 1)];
      x[Smoke3DEngine.IX(N, N + 1, i, 0)] = b == 1 ? -x[Smoke3DEngine.IX(N, N, i, N)] : x[Smoke3DEngine.IX(N, N, i, N)];
      x[Smoke3DEngine.IX(N, i, 0, 0)] = b == 2 ? -x[Smoke3DEngine.IX(N, i, N, N)] : x[Smoke3DEngine.IX(N, i, N, N)];
      x[Smoke3DEngine.IX(N, i, N + 1, 0)] = b == 2 ? -x[Smoke3DEngine.IX(N, i, N, N)] : x[Smoke3DEngine.IX(N, i, N, N)];
    }
    x[Smoke3DEngine.IX(N, 0, 0, 0)] = 0.5 * (x[Smoke3DEngine.IX(N, 1, 0, 0)] + x[Smoke3DEngine.IX(N, 0, 1, 0)]);
    x[Smoke3DEngine.IX(N, 0, N + 1, 0)] = 0.5 * (x[Smoke3DEngine.IX(N, 1, N + 1, 1)] + x[Smoke3DEngine.IX(N, 0, N, 1)]);
    x[Smoke3DEngine.IX(N, N + 1, 0, 0)] = 0.5 * (x[Smoke3DEngine.IX(N, N, 0, 0)] + x[Smoke3DEngine.IX(N, N + 1, 1, 1)]);
    x[Smoke3DEngine.IX(N, N + 1, N + 1, N + 1)] = 0.5 * (x[Smoke3DEngine.IX(N, N, N + 1, N)] + x[Smoke3DEngine.IX(N, N + 1, N, N + 1)]);
  }
}