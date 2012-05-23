// Load configuration
var config = new XConfig();
var xcon = new XController();
// var xdata = new XGridModel();

/*
========== Configuration

*/
function XConfig() {
	this.squareSize = 10; // mm
//	this.ppmm = 6; // pixels per mm
	this.ppmm = 4.5; // pixels per mm
	this.fontSizeSolution = 40 * this.ppmm/6;
	this.fontSizeClue = 13 * this.ppmm/6;
	this.screenFillColor = "#fff";
	this.screenCursorFillColor = "#acf";
	this.screenCursorLineOpacity = .4
	this.screenStrokeColor = "#000";
	this.strokeWidth = 0.2; // mm
	this.squareSizeInPixels = function() { return this.squareSize * this.ppmm; };
	this.strokeWidthInPixels = function() { return this.strokeWidth * this.ppmm; };
	this.alphabet = /[a-zæøå]/;
}



$(document).ready(function() {
	var testsquare = new XSquare();
	var testlettersquare = new LetterSquare("J");
	console.log("LetterSquare created:", testlettersquare.getLetter());
	console.log(testlettersquare);
	console.log("Is letter square:",testlettersquare.isLetterSquare());
	// var testcluesquare = new ClueSquare([
	// 	new XClue({x:1,y:0,d:"v",h:"BRUKE\nHEST"}),
	// 	new XClue({x:0,y:1,d:"v",h:"BELEGG"})
	// ]);
});







