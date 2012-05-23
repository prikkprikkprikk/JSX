// Set up an XBoardModel
//		size 5x5
//		square size 10 mm (default)
//		offset/position 0,0
//		line thickness 0.15mm

test("LetterSquare", function() {
	// Create LetterSquare object
	var xls = new LetterSquare("A");
	ok(xls instanceof LetterSquare);
	ok(xls instanceof XSquare);
	equal(xls.getLetter(),"A");
});

test("XClue", function() {
	raises(
		function() { cs = new XClue(); },
		"Creating XClue with no argument should raise error"
	);
	raises(
		function() { cs = new XClue(5); },
		"XClue constructor should raise an error if argument is not an array."
	);
	var xc = new XClue({x:1,y:0,d:"v",h:"BRUKE\nHEST"});
	ok(xc instanceof XClue);
	equal(xc.numLines(),2);
	equal(xc.getText(),"BRUKE\nHEST");
	deepEqual(xc.getLines(),["BRUKE","HEST"]);
	equal(xc.getSolutionX(),1);
	equal(xc.getSolutionY(),0);
	equal(xc.getSolutionDirection(),"v");
});

test("ClueSquare", function() {
	var cs = new ClueSquare();
	ok(cs instanceof ClueSquare,"cs is an instance of ClueSquare");
	equal(cs.numLines(),0,"Should be 0 lines in clue square so far");
	raises(
		function() { cs.addClue("foo"); },
		"Should throw an error if argument not an XClue"
	);
	ok(cs.addClue(new XClue({x:1,y:0,d:"v",h:"BRUKE\nHEST"})),"Adding an XClue");
	equal(cs.numLines(),2,"Should be 2 lines so far");
	ok(cs.addClue(new XClue({x:0,y:1,d:"v",h:"BELEGG"})),"Adding another XClue");
	equal(cs.numLines(),3);
	equal(cs.getClues().length,2);
});
