/*
Application name: JSX – Javascript Crossword Generator
Author: Jørn Støylen
Copyright: Jørn Støylen © 2012
Version: 0.1
*/

var config;
var xcon;
var xdata;

$(document).ready(function() {

	config = new XConfig();
	xcon = new XController();
	xdata = new XGridModel();

	$('#svgcanvas').css({
		backgroundColor: '#ddd',
		width: '500px',
		height: '1000px'
	});
	
	xcon.init(xdata);

	// Keyboard event handler
	$(document).keydown(xcon.keyHandler);
	// TODO: Add mouse event capturing/handling.
	
	// Setup custom events and handlers.

	// Menu
	$("#exportSolution").click(function(){
		var ev = new XGridExportSolutionView(xdata);
		console.log(ev);
		var html = ev.getHtml();
		var exportWindow = window.open("","exportWindow");
		exportWindow.document.open();
		exportWindow.document.write(ev.getHtml());
		exportWindow.document.close();
		return false;
	});
	$("#save").click(function(){
		xcon.save();
		return false;
	});
	$("#load").click(function(){
		xcon.load();
		return false;
	});
});

/*
======================================== Configuration

*/

function XConfig() {
	this.squareSize = 10; // mm
//	this.ppmm = 6; // pixels per mm
	this.ppmm = 4.5; // pixels per mm
	this.fontSizeSolution = 40 * this.ppmm/6;
	this.fontSizeClue = 13 * this.ppmm/6;
	this.screenFillColor = "#fff";
	this.screenCursorFillColor = "#acf";
	this.screenCursorLineOpacity = .4;
	this.screenStrokeColor = "#000";
	this.strokeWidth = 0.2; // mm
	this.alphabet = /[a-zæøå]/; // regexp
}

XConfig.prototype.squareSizeInPixels = function() { return this.squareSize * this.ppmm; };
XConfig.prototype.strokeWidthInPixels = function() { return this.strokeWidth * this.ppmm; };

