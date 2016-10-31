
describe('Smoke2DEngine', () => {


  describe('static swap_objects', () => {

    it('should swap objects and keep references', () => {
      let a = { name: 'A' },
        b = { name: 'B', info: 'some B\'s info' };
      Smoke2DEngine.swap_objects(a, b);
      expect(a).toEqual({ name: 'B', info: 'some B\'s info' });
      expect(b).toEqual({ name: 'A' });
    });

    
    it('should swap arrays and keep references', () => {
      let a = [1,2,3],
      b = [9,8,7,6,5];
      Smoke2DEngine.swap_objects(a,b);
      expect(a).toEqual([9,8,7,6,5]);
      expect(b).toEqual([1,2,3]);
    });
      

  });


  describe('static add_source', () => {

    it('should modify existing x array using given s array and dt', () => {
      let x = [1, 2, 3, 4, 5, 6],
        s = [9, 8, 7, 6, 5, 4];
      Smoke2DEngine.add_source(2, x, s, 2);
      expect(x).toEqual([19, 18, 17, 16, 15, 14]);
      expect(s).toEqual([9, 8, 7, 6, 5, 4]);
    });

  });

  
  describe('IX', () => {
    
    it('should flatten 2D array coordinates to 1D', () => {
      expect(Smoke2DEngine.IX(1,0,0)).toBe(0);
      expect(Smoke2DEngine.IX(1,1,0)).toBe(1);
      expect(Smoke2DEngine.IX(1,0,1)).toBe(3);
    });
      
  });
    
  describe('instance', () => {
    let i;
    
    beforeEach(() => {
      i = new Smoke2DEngine(2);
    });

    
    it('should have size', () => {
      // console.log(i.size)
      expect(i.size).toBe(16);
    });
      
      
    describe('constructor', () => {
      
      it('should create 0 filled arrays', () => {
        expect(i.u.length).toBe(16);
        expect(i.v.length).toBe(16);
        expect(i.u_prev.length).toBe(16);
        expect(i.v_prev.length).toBe(16);
        expect(i.dens.length).toBe(16);
        expect(i.dens_prev.length).toBe(16);
        expect(i.input_dens.length).toBe(16);
        expect(i.input_u.length).toBe(16);
        expect(i.input_v.length).toBe(16);

        i.u.forEach((val)=>{expect(val).toBe(0);});
        i.v.forEach((val)=>{expect(val).toBe(0);});
        i.u_prev.forEach((val)=>{expect(val).toBe(0);});
        i.v_prev.forEach((val)=>{expect(val).toBe(0);});
        i.dens.forEach((val)=>{expect(val).toBe(0);});
        i.dens_prev.forEach((val)=>{expect(val).toBe(0);});
        i.input_dens.forEach((val)=>{expect(val).toBe(0);});
        i.input_u.forEach((val)=>{expect(val).toBe(0);});
        i.input_v.forEach((val)=>{expect(val).toBe(0);});
      });
        
    });
        
  });
    
});
