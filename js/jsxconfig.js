/*
Config settings:
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
*/

function XConfig(arg) {
	if (arg===undefined) {
		arg = {};
	}
	this.squareSize = arg.squareSize || 10; // mm
	this.ppmm = arg.ppmm || 4.5; // pixels per mm
	this.fontSizeSolution = arg.fontSizeSolution || 40 * this.ppmm/6;
	this.fontSizeClue = arg.fontSizeClue || 13 * this.ppmm/6;
	this.screenFillColor = arg.screenFillColor || "#fff";
	this.screenCursorFillColor = arg.screenCursorFillColor || "#89a";
	this.screenCursorLineOpacity = arg.screenCursorLineOpacity || .3;
	this.screenSelectionOpacity = .7;
	this.screenStrokeColor = arg.screenStrokeColor || "#000";
	this.strokeWidth = arg.strokeWidth || 0.2; // mm
	this.alphabet = arg.alphabet || /[a-zæøå]/; // regexp
}

XConfig.prototype.squareSizeInPixels = function() { return this.squareSize * this.ppmm; };
XConfig.prototype.strokeWidthInPixels = function() { return this.strokeWidth * this.ppmm; };

