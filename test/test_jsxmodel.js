// Set up an XBoardModel
//		size 5x5
//		square size 10 mm (default)
//		offset/position 0,0
//		line thickness 0.15mm

test("XClue", function() {
	raises(
		function() { xc = new XClue(); },
		"Creating XClue with no argument should raise error."
	);
	raises(
		function() { xc = new XClue(5); },
		"XClue constructor should raise an error if argument is not an object."
	);
	raises(
		function() { xc = new XClue({y:0,d:"v"}); },
		"XClue constructor should raise an error if either x, y or d argument is missing."
	);
	raises(
		function() { xc = new XClue({x:1,d:"v"}); },
		"XClue constructor should raise an error if either x, y or d argument is missing."
	);
	raises(
		function() { xc = new XClue({x:1,y:0}); },
		"XClue constructor should raise an error if either x, y or d argument is missing."
	);
	raises(
		function() { xc = new XClue({x:1,y:0,d:"v",h:1}); },
		"XClue constructor should raise an error if h argument is not a string."
	);
	raises(
		function() { xc = new XClue({x:1,y:0,d:"x",h:"FOO"}); },
		"XClue constructor should raise an error if d argument is not h or v."
	);
	raises(
		function() { xc = new XClue({x:2,y:0,d:"v",h:"FOO"}); },
		"XClue constructor should raise an error if x or y is not 0 or 1."
	);
	raises(
		function() { xc = new XClue({x:0,y:2,d:"v",h:"FOO"}); },
		"XClue constructor should raise an error if x or y is not 0 or 1."
	);
	raises(
		function() { xc = new XClue({x:-1,y:0,d:"v",h:"FOO"}); },
		"XClue constructor should raise an error if x or y is not 0 or 1."
	);
	raises(
		function() { xc = new XClue({x:0,y:-1,d:"v",h:"FOO"}); },
		"XClue constructor should raise an error if x or y is not 0 or 1."
	);
	var xc = new XClue({x:1,y:0,d:"v",h:"BRUKE\nHEST"});
	ok(xc instanceof XClue);
	equal(xc.numLines(),2);
	equal(xc.getText(),"BRUKE\nHEST");
	deepEqual(xc.getLines(),["BRUKE","HEST"]);
	equal(xc.getSolutionX(),1);
	equal(xc.getSolutionY(),0);
	equal(xc.getSolutionDirection(),"v");
	var xc = new XClue({x:1,y:0,d:"h"});
	equal(xc.getText(),"[N/A]");
});

test("XSquare", function() {
	var xs = new XSquare();
	ok(xs instanceof XSquare);
	equal(xs.className,"XSquare");
})

test("EmptySquare", function() {
	var xes = new EmptySquare();
	equal(xes.className,"EmptySquare");
	ok(xes instanceof XSquare);
	ok(xes instanceof EmptySquare);
})

test("LetterSquare", function() {
	var config = new XConfig({
		squareSize: 10, // mm
		ppmm: 4.5, // pixels per mm
		fontSizeSolution: 40 * this.ppmm/6,
		fontSizeClue: 13 * this.ppmm/6,
		screenFillColor: "#fff",
		screenCursorFillColor: "#acf",
		screenCursorLineOpacity: .4,
		screenStrokeColor: "#000",
		strokeWidth: 0.2, // mm
		alphabet: /[a-zæøå]/, // regexp
	});
	// Create LetterSquare object
	raises(
		function() { new LetterSquare(); },
		"Creating LetterSquare with no argument should raise error."
	);
	raises(
		function() { new LetterSquare( {foo:"bar"} ); },
		"Creating LetterSquare without both 'config' and 'letter' argument should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:"b"} ); },
		"Creating LetterSquare without both 'config' and 'letter' argument should raise error."
	);
	raises(
		function() { new LetterSquare( {config:config} ); },
		"Creating LetterSquare without both 'config' and 'letter' argument should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:1,config:config} ); },
		"Creating LetterSquare with 'letter' argument that's not a string should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:[1],config:config} ); },
		"Creating LetterSquare with 'letter' argument that's not a string should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:"abcdef",config:config} ); },
		"Creating LetterSquare with 'letter' argument as a string longer than 1 character should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:"%",config:config} ); },
		"Creating LetterSquare with 'letter' argument as a string with non-letter character should raise error."
	);
	raises(
		function() { new LetterSquare( {letter:"a",config:"foo"} ); },
		"Creating LetterSquare with 'config' argument that's not an XConfig object should raise error."
	);
	var xls = new LetterSquare({letter:"A",config:config});
	ok(xls instanceof LetterSquare);
	ok(xls instanceof XSquare);
	equal(xls.className,"LetterSquare");
	equal(xls.getLetter(),"A");
});



// Postponing ClueSquare testing until it's clear how they should work with the rest of the code.

// test("ClueSquare", function() {
// 	var cs = new ClueSquare();
// 	ok(cs instanceof ClueSquare,"cs is an instance of ClueSquare");
// 	equal(cs.numLines(),0,"Should be 0 lines in clue square so far");
// 	raises(
// 		function() { cs.addClue("foo"); },
// 		"Should throw an error if argument not an XClue"
// 	);
// 	ok(cs.addClue(new XClue({x:1,y:0,d:"v",h:"BRUKE\nHEST"})),"Adding an XClue");
// 	equal(cs.numLines(),2,"Should be 2 lines so far");
// 	ok(cs.addClue(new XClue({x:0,y:1,d:"v",h:"BELEGG"})),"Adding another XClue");
// 	equal(cs.numLines(),3,"Should be 3 lines now");
// 	equal(cs.getClues().length,2,"Should be 2 clues");
// });
