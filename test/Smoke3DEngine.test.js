
describe('Smoke3DEngine', () => {
  
  describe('static IX', () => {
    
    it('should flatted 3D array cooradinates to 1D', () => {
      expect(Smoke3DEngine.IX(1,0,0,0)).toBe(0);
      expect(Smoke3DEngine.IX(1,1,1,1)).toBe(13);
      expect(Smoke3DEngine.IX(1,1,1,0)).toBe(4);
    });
      
  });

  
  describe('static IXrev', () => {
    
    it('should return cooradinates for given index', () => {
      expect(Smoke3DEngine.IXrev(1,0)).toEqual({x:0,y:0,z:0});
    });
      
  });
    
    
});
  