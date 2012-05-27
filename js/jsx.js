/*
Application name: JSX – Javascript Crossword Generator
Author: Jørn Støylen
Copyright: Jørn Støylen © 2012
Version: 0.1
*/

var config = new XConfig();

var xcon;
var xdata;

$(document).ready(function() {

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

