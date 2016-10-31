(function () {
    window.onload = function () {
        console.log("LOAD1");
        start();
    };
})();
var smoke, count = 0;
function start() {
    function render() {
        // console.log('scene',scene)
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        controls.update();
        // console.log(camera.position)
    }
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
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
        controls.keys = [65, 83, 68];
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
class Particle {
    constructor(object) {
        this.weight = 1; // grams
        if (!object) {
            let geometry = new THREE.SphereBufferGeometry(5, 5, 5);
            let material = null;
            this.object = new THREE.Mesh(geometry, material);
        }
        else {
            this.object = object;
        }
    }
}
class Smoke {
    constructor() {
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
    addToScene(scene) {
        scene.add(this.smoke);
    }
    animate() {
        this.particles.vertices.forEach((particle) => {
            count++;
            particle.y += 0.1;
            if (particle.y >= 230) {
                particle.y = Math.random() * 16;
                particle.x = Math.random() * 32 - 16;
                particle.z = Math.random() * 32 - 16;
            }
        });
        this.particles.__dirtyVertices = true;
        this.particles.verticesNeedUpdate = true;
    }
}
class Smoke2D {
    constructor() {
        this.N = 30;
        this.accuracy = 100000;
        this.smokeMaterial = new THREE.PointsMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            size: 0.1,
            color: 0x111111
        });
        this.scenes = [];
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
        this.engine = new Smoke2DEngine(this.N);
        this.engine.input_dens[10] = 10;
        this.engine.input_u[10] = 10;
        this.engine.input_v[10] = 10;
        this.engine.input_dens[this.engine.IX(20, 20)] = 10;
        this.engine.input_u[this.engine.IX(20, 20)] = 10;
        this.engine.input_v[this.engine.IX(20, 20)] = 10;
        this.engine.input_dens[this.engine.IX(1, 20)] = 100;
        this.engine.input_u[this.engine.IX(1, 20)] = 0;
        this.engine.input_v[this.engine.IX(1, 20)] = 10;
    }
    addToScene(scene) {
        this.scenes.push(scene);
        scene.add(this.smoke);
    }
    simulate() {
        this.engine.simulate(() => {
            let sumAll = this.engine.dens.reduce((sum, curr) => {
                return sum + Math.floor(curr * 100000);
            });
            let perOne = this.accuracy / sumAll;
            // console.log(sumAll,perOne);
            let particleIndex = 0;
            for (let i = 1; i <= this.engine.N; i++) {
                for (let j = 1; j <= this.engine.N; j++) {
                    let val = this.engine.dens[this.engine.IX(i, j)];
                    let count = Math.floor(Math.floor(val * 100000) * perOne);
                    // console.log(particleIndex,this.particles.vertices.length,count);
                    // console.log(this.particles.vertices);
                    debugger;
                    for (let k = 0; k < count && particleIndex < this.particles.vertices.length; k++) {
                        this.particles.vertices[particleIndex].x = Math.random() + i;
                        this.particles.vertices[particleIndex].y = 0;
                        this.particles.vertices[particleIndex].z = Math.random() + j;
                        particleIndex++;
                    }
                }
            }
            this.particles.__dirtyVertices = true;
            this.particles.verticesNeedUpdate = true;
        });
    }
}
class Smoke2DEngine {
    constructor(N) {
        this._N = 3;
        this.visc = 1;
        this.diff = 1;
        this.dt = 1;
        this.simulating = false;
        this.N = N || this.N;
        this.adjustArrays();
        this.input_clear();
    }
    get N() { return this._N; }
    set N(N) { this._N = N; }
    get size() { return Math.pow(this.N + 2, 2); }
    IX(x, y) {
        return Smoke2DEngine.IX(this.N, x, y);
    }
    static IX(N, x, y) {
        return x + (N + 2) * y;
    }
    IXrev(index) {
        return Smoke2DEngine.IXrev(this.N, index);
    }
    static IXrev(N, index) {
        let x = index % (N + 2);
        let y = (index - x) / (N + 2);
        return { x, y };
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
    simulate(callback) {
        if (this.simulating)
            return;
        this.simulating = true;
        this.simulation_step(callback);
    }
    simulation_step(callback) {
        if (!this.simulating)
            return;
        this.get_from_input();
        // console.log(1,this.dens);
        Smoke2DEngine.vel_step(this.N, this.u, this.v, this.u_prev, this.v_prev, this.visc, this.dt);
        // console.log(2,this.dens);
        Smoke2DEngine.dens_step(this.N, this.dens, this.dens_prev, this.u, this.v, this.diff, this.dt);
        // console.log(3,this.dens);
        if (typeof callback === 'function')
            callback();
        setTimeout(this.simulation_step.bind(this, callback), 25);
    }
    static swap_objects(a, b) {
        let clean = (obj) => {
            for (let member in obj)
                delete obj[member];
            if (Array.isArray(obj)) {
                obj.length = 0;
            }
        };
        let tmp = new Object();
        Object.assign(tmp, a);
        clean(a);
        Object.assign(a, b);
        clean(b);
        Object.assign(b, tmp);
    }
    static add_source(N, x, s, dt) {
        let size = Math.pow(N + 2, 2);
        s.forEach((value, index) => {
            x[index] += dt * value;
        });
    }
    static diffuse(N, b, x, x0, diff, dt) {
        let i, j, k;
        let a = dt * diff * N * N;
        for (k = 0; k < 20; k++) {
            for (i = 1; i <= N; i++) {
                for (j = 1; j <= N; j++) {
                    x[Smoke2DEngine.IX(N, i, j)] =
                        (x0[Smoke2DEngine.IX(N, i, j)] +
                            a * (x[Smoke2DEngine.IX(N, i - 1, j)] + x[Smoke2DEngine.IX(N, i + 1, j)] + x[Smoke2DEngine.IX(N, i, j - 1)] + x[Smoke2DEngine.IX(N, i, j + 1)])) / (1 + 4 * a);
                }
            }
            Smoke2DEngine.set_bnd(N, b, x);
        }
    }
    static advect(N, b, d, d0, u, v, dt) {
        let i, j, i0, j0, i1, j1;
        let x, y, s0, t0, s1, t1, dt0;
        let oob = val => {
            if (val < 0.5)
                return 0.5;
            if (val > N + 0.5)
                return N + 0.5;
            return val;
        };
        dt0 = dt * N;
        for (i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                x = i - dt0 * u[Smoke2DEngine.IX(N, i, j)];
                y = j - dt0 * v[Smoke2DEngine.IX(N, i, j)];
                x = oob(x);
                i0 = Math.floor(x);
                i1 = i0 + 1;
                y = oob(y);
                j0 = Math.floor(y);
                j1 = j0 + 1;
                s1 = x - i0;
                s0 = 1 - s1;
                t1 = y - j0;
                t0 = 1 - t1;
                d[Smoke2DEngine.IX(N, i, j)] =
                    s0 * (t0 * d0[Smoke2DEngine.IX(N, i0, j0)] + t1 * d0[Smoke2DEngine.IX(N, i0, j1)]) +
                        s1 * (t0 * d0[Smoke2DEngine.IX(N, i1, j0)] + t1 * d0[Smoke2DEngine.IX(N, i1, j1)]);
            }
        }
        Smoke2DEngine.set_bnd(N, b, d);
    }
    static dens_step(N, x, x0, u, v, diff, dt) {
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
    static vel_step(N, u, v, u0, v0, visc, dt) {
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
    static project(N, u, v, p, div) {
        let i, j, k;
        let h = 1 / N;
        for (i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                div[Smoke2DEngine.IX(N, i, j)] = -0.5 * h * (u[Smoke2DEngine.IX(N, i + 1, j)] - u[Smoke2DEngine.IX(N, i - 1, j)] +
                    v[Smoke2DEngine.IX(N, i, j + 1)] - v[Smoke2DEngine.IX(N, i, j - 1)]);
                p[Smoke2DEngine.IX(N, i, j)] = 0;
            }
        }
        Smoke2DEngine.set_bnd(N, 0, div);
        Smoke2DEngine.set_bnd(N, 0, p);
        for (k = 0; k < 20; k++) {
            for (i = 1; i <= N; i++) {
                for (j = 1; j <= N; j++) {
                    p[Smoke2DEngine.IX(N, i, j)] = (div[Smoke2DEngine.IX(N, i, j)] +
                        p[Smoke2DEngine.IX(N, i - 1, j)] +
                        p[Smoke2DEngine.IX(N, i + 1, j)] +
                        p[Smoke2DEngine.IX(N, i, j - 1)] +
                        p[Smoke2DEngine.IX(N, i, j + 1)]) / 4;
                }
            }
            Smoke2DEngine.set_bnd(N, 0, p);
        }
        for (i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                u[Smoke2DEngine.IX(N, i, j)] -= 0.5 * (p[Smoke2DEngine.IX(N, i + 1, j)] - p[Smoke2DEngine.IX(N, i - 1, j)]) / h;
                v[Smoke2DEngine.IX(N, i, j)] -= 0.5 * (p[Smoke2DEngine.IX(N, i, j + 1)] - p[Smoke2DEngine.IX(N, i, j - 1)]) / h;
            }
        }
        Smoke2DEngine.set_bnd(N, 1, u);
        Smoke2DEngine.set_bnd(N, 2, v);
    }
    static set_bnd(N, b, x) {
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
//# sourceMappingURL=index.js.map