/*
Application name: JSX – Javascript Crossword Generator
Author: Jørn Støylen
Copyright: Jørn Støylen © 2012
Version: 0.12
*/

var config = new XConfig();
var xcon = new XController();


$(document).ready(function() {

	xcon.init();

	// Keyboard event handler
	$(document).keydown(xcon.keyHandler);
	
	// Setup custom events and handlers.

	// Menu
	$("#exportSolution").click(function(){
		var ev = new XGridExportSolutionView(xcon.xdata);
		var html = ev.getHtml();
		var exportWindow = window.open("","exportWindow");
		exportWindow.document.open();
		exportWindow.document.write(ev.getHtml());
		exportWindow.document.close();
		return false;
	});
	$("#importSolution").click(function(){
		xcon.showImportForm();
		return false;
	});
	$("#new").click(function(){
		xcon.newCrossword();
		return false;
	});
	$("#load").click(function(){
		xcon.load("jsxsave");
		return false;
	});
	$("#save").click(function(){
		xcon.save();
		return false;
	});
});
