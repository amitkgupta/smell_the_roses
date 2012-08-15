describe("Main", function() {
	describe("initial state", function() {
		it("should have the correct input fields", function() {
			console.log(map);
			initialize();
			console.log(map);
			expect(0).toEqual(1);
			
		});
		
		it("should have a map", function() {
			expect(1).toEqual(1);
		});
	});
});