/*
======================================== Debug
*/

function XDebug(id) {
	this.init(id);
	this.buffer = "";
}
XDebug.prototype.parentID ="debugWrapper";
XDebug.prototype.parentDiv = "#"+XDebug.prototype.parentID;
XDebug.prototype.init = function(id) {
	this.id = id+"Debug";
	this.outerDiv = "#"+this.id;
	this.innerDiv = this.outerDiv + " div.debugLog";
	if ($(this.parentDiv).length===0) {
		$("body").append("<div id='"+this.parentID+"'></div>");
	}
	if ($(this.outerDiv).length===0) {
		$(this.parentDiv).append('<div class="debugHeader" id="'+this.id+'"><h2>'+this.id+'</h2><div class="debugLog"></div></div>').append;
	}
};
XDebug.prototype.clear = function() {
	// Empty the buffer
	this.buffer = "";
};
XDebug.prototype.log = function() {
	if (arguments.length>0) {
		if (this.buffer!="") this.buffer += "<br>";
		for(s in arguments) {
			this.buffer += arguments[s] + " ";
		}
	}
	$(this.innerDiv).html(this.buffer);
};
XDebug.prototype.replace = function() {
	this.clear();
	if (arguments.length>0) {
		for(s in arguments) {
			this.buffer += arguments[s] + " ";
		}
	}
	this.log();
};
XDebug.prototype.add = function() {
	for(s in arguments) {
		this.buffer += arguments[s];
	}
};


/*
======================================== Undo

*/

function XUndoManager(contr) {
	var _this = this;
	var controller = contr;
	var undoHistory = [];
	var redoHistory = [];
	this.debug = new XDebug("XUndoManager");
	this.buildDebugBuffer = function() {
		_this.debug.clear();
		_this.debug.add(undoHistory.length, " undo steps (showing last 10):<br>");
		for (i in undoHistory) {
			if (i<10) {
				_this.debug.add("– ", (parseInt(i)+1), ": ", undoHistory[i].undoDebugString, "<br>");
			}
		}
		_this.debug.add(redoHistory.length, " redo steps (showing last 10):<br>");
		for (i in redoHistory) {
			if (i<10) {
				_this.debug.add("– ", (parseInt(i)+1), ": ", redoHistory[i].redoDebugString, "<br>");
			}
		}
		_this.debug.log();
	};
	this.add = function (data) {
		/*
		data is an object with properties:
		- undoFunc: a function that will undo the step
		- undoArg: attributes for the undo function
		- redoFunc: a function that will redo the step
		- redoArg: attributes for the redo function
		*/
		undoHistory.unshift($.extend(true,{},data));
		redoHistory.length = 0;
		contr.autosave();
		this.buildDebugBuffer();
	};
	this.undo = function() {
		if (undoHistory.length>0) {
			action = undoHistory.shift();
			redoHistory.unshift($.extend(true,{},action));
			controller.hideCursor();
			action.undoFunc(action.undoArg);
			controller.bv.updateSquare(action.undoArg);
			controller.cursor = action.undoArg.newCursor;
			controller.showCursor();
		}
		contr.autosave();
		this.buildDebugBuffer();
	};
	this.redo = function() {
		if (redoHistory.length>0) {
			action = $.extend(true,{},redoHistory.shift());
			controller.hideCursor();
			action.redoFunc(action.redoArg);
			controller.cursor = action.redoArg.newCursor
			controller.showCursor();
			undoHistory.unshift($.extend(true,{},action));
		}
		contr.autosave();
		this.buildDebugBuffer();
	};
}


function Cursor(arg) {
	// r: Cursor's row position.
	// c: Cursor's column position.
	// d: Typing direction.
	// l: Length of selection. 0 when no selection; otherwise, it's number of squares from current cursor in the current direction. Negative numbers means backwards from the cursor, and would be most normal since one normally selects from left to right, placing the cursor at the end of the selection.
	this.controller = arg.controller;
	this.debug = new XDebug("Cursor");
	this.selecting = false;
	this.set(arg);
	this.selectionOrigin = {};
}
Cursor.prototype.set = function(arg) {
	if (arg===undefined) {
		// Easiest way to make the rest of this function simpler.
		arg={}
	} else {
		// Sanity checks; improper arguments are simply ignored.
		if ( arg.hasOwnProperty("r") && ( !this._isInteger(arg.r) || !this._isWithinRows(arg.r) ) ) { delete arg.r; }
		if ( arg.hasOwnProperty("c") && ( !this._isInteger(arg.c) || !this._isWithinCols(arg.c) ) ) { delete arg.c; }
		if ( arg.hasOwnProperty("d") && ( arg.d!="h" || arg.d!="v") ) { delete arg.d; }
		if ( arg.hasOwnProperty("l") && ( !this._isValidSelection(arg.l) ) ) { delete arg.l; }
	}
	// If variables are not set, set them to defaults.
	// If no argument given, don't change the values.
	// This means you later can set any number of these properties:
	//   cursor.set({r:5,d:"v"}) => doesn't touch c or l
	this.r = arg.r || this.r || 0;
	this.c = arg.c || this.c || 0;
	this.d = arg.d || this.d || "h";
	this.l = arg.l || this.l || 0;
	this.dx = 0;
	this.dy = 0;
};
Cursor.prototype._isValidSelection = function( n ) {
	return	(this.d = "h" && this.c+n>0 && this.c+n<this._lastCol() ) ||
			(this.d = "v" && this.r+n>0 && this.r+n<this._lastRow() );
};
Cursor.prototype._isInteger = function(n) {
	if (typeof n == "number" && n == Math.floor(n)) {
		return true;
	} else {
		return false;
	}
};
Cursor.prototype._isWithinRows = function(r) { return (r>=0 && r<this._lastRow()); };
Cursor.prototype._isWithinCols = function(c) { return (c>=0 && c<this._lastCol()); };
Cursor.prototype._lastRow = function() { return this.controller.xdata.height-1; };
Cursor.prototype._lastCol = function() { return this.controller.xdata.width-1; };
Cursor.prototype.startMouseSelection = function( pos ) {
	this.selecting = true;
	this.l = 0;
	this.selectionOrigin = pos;
	this.startDirection = "";
	this.moveTo(pos);
	this.log();
};
Cursor.prototype.updateMouseSelection = function( pos ) {
	// If no current selection (l=1), set direction by comparing current pos with incoming pos.
	// (In case of equal horizontal and vertical distances, current direction wins.)
	xcon.hideCursor();
	this.dy = pos.r - this.selectionOrigin.r;
	this.dx = pos.c - this.selectionOrigin.c;
	if (this.startDirection=="") {
		if (this.dx!=0) { this.startDirection = "h" }
		else if (this.dy!=0) { this.startDirection = "v" }
	}
	if (Math.abs(this.dx)>Math.abs(this.dy)) {
		this.d = "h";
		this.c = pos.c;
		this.r = this.selectionOrigin.r;
		this.l = this.selectionOrigin.c-pos.c;
		this.moveTo({r:this.selectionOrigin.r,c:pos.c});
	}
	else if (Math.abs(this.dx)<Math.abs(this.dy)) {
		this.d = "v";
		this.r = pos.r;
		this.c = this.selectionOrigin.c;
		this.l = this.selectionOrigin.r-pos.r;
		this.moveTo({r:pos.r,c:this.selectionOrigin.c});
	}
	else if ( this.dx == this.dy ) {
		if (this.dx == 0 && this.dy==0) {
			// If back at origin
			this.moveTo(this.selectionOrigin);
			this.l = 0;
		}
		else {
			this.d = this.startDirection;
			if (this.startDirection=="h") {
				this.moveTo({r:this.selectionOrigin.r,c:pos.c});
				this.l = this.selectionOrigin.c-pos.c;
			}
			else if (this.startDirection=="v") {
				this.moveTo({r:pos.r,c:this.selectionOrigin.c});
				this.l = this.selectionOrigin.r-pos.r;
			}
		}
	}
	xcon.showCursor();
	this.log();
};
Cursor.prototype.endMouseSelection = function( pos ) {
	this.selecting = false;

	// TODO: Set selection
	this.log();
};
Cursor.prototype.clearSelection = function() {
	this.l = 0;
	this.selectionOrigin = {};
};
Cursor.prototype.getSelection = function() {
	if (this.l==0) return false;
	var selectedSquares = [];
	var dir = (this.d == "h"?"c":"r");
	var notDir = (this.d == "h"?"r":"c");
	var start = end = this[dir];
	if (this.l<0) { start += this.l; }
	else { end += this.l }
	for (var i = start; i <= end; i++) {
		var o = {};
		o[dir] = i;
		o[notDir] = this[notDir];
		selectedSquares.push(o);
	};
	return selectedSquares;
};
Cursor.prototype.move = function(arg) {
	// arg: dir = "Right", "Down", "Left", "Up"
	//		typing = true if user is typing, false if doing an undo/redo step (default)
	var _this = this;
	this.controller.hideCursor();
	var typing = false;
	if (arg!==undefined) {
		typing === arg.typing || false;
	}
	var dir = "";
	if (arg===undefined || arg.dir === undefined) {
		dir = _this.d === "h"? "Right" : "Down";
		typing = true;
	}
	else if (arg!==undefined && arg.dir==="Forward") {
		dir = _this.d === "h"? "Right" : "Down";
	}
	else if (arg!==undefined && arg.dir==="Backward") {
		dir = _this.d === "h"? "Left" : "Up";
	}
	else if (arg!==undefined && arg.dir!==undefined) {
		dir = arg.dir;
	}
	switch (dir) {
		case "Up":
			if (_this.d==="h" && !arg.e.cmdKeyOnly) {
				_this.switchDirection();
				_this.l = 0;
			}
			else {
				_this.r--;
				if (_this.r<0) {
					if (arg.e.shiftKey) {
						_this.r=0;
					}
					else {
						_this.r = _this._lastRow();
						_this.l = 0;
					}
				}
				else {
					if (arg.e.shiftKey) {
						_this.l++;
					}
					else {
						_this.l=0;
					}
				}
			}
			break;
		case "Down":
			if (_this.d==="h" && !arg.e.cmdKeyOnly) {
				_this.switchDirection();
				_this.l = 0;
			}
			else {
				_this.r++;
				if (_this.r>_this._lastRow()) {
					if (typing || arg.e.shiftKey) {
						_this.r = _this._lastRow();
					}
					else {
						_this.r = 0;
						_this.l = 0;
					}
				}
				else {
					if (arg.e.shiftKey) {
						_this.l--;
					}
					else {
						_this.l=0;
					}
				}
			}	
			break;
		case "Left":
			if (_this.d==="v" && !arg.e.cmdKeyOnly) {
				_this.switchDirection();
				_this.l = 0;
			}
			else {
				_this.c--;
				if (_this.c<0) {
					if (arg.e.shiftKey) {
						_this.c=0;
					}
					else {
						_this.c = _this._lastCol();
						_this.l = 0;
					}
				}
				else {
					if (arg.e.shiftKey) {
						_this.l++;
					}
					else {
						_this.l = 0;
					}
				}
			}
			break;
		case "Right":
			if (_this.d==="v" && !arg.e.cmdKeyOnly) {
				_this.switchDirection();
				_this.l = 0;
			}
			else {
				_this.c++;
				if (_this.c>_this._lastCol()) {
					if (typing || arg.e.shiftKey) {
						_this.c = this._lastCol();
					}
					else {
						_this.c = 0;
						_this.l = 0;
					};
				}
				else {
					if (arg.e.shiftKey) {
						_this.l--;
					}
					else {
						_this.l = 0;
					}
				}
			}
			break;
		default:
	}
	_this.controller.showCursor();
	this.log();
};
Cursor.prototype.moveTo = function( pos ) {
	this.controller.hideCursor();
	this.r = pos.r;
	this.c = pos.c;
	this.controller.showCursor();
	this.log();
};
Cursor.prototype.switchDirection = function() {
	this.controller.hideCursor();
	if (this.d=="h") { this.d="v"; }
	else { this.d="h"; }
	this.l = 0;
	this.controller.showCursor();
	this.log();
};
Cursor.prototype.log = function() {
	this.debug.clear();
	this.debug.log(
		"row:",this.r,"<br>col:",this.c,"<br>dir:",this.d,"<br>selection length:",this.l,
		this.selecting?"<br>[selecting]":"",
		"<br>dx: "+this.dx+" - dy: "+this.dy,
		"<br>selectionOrigin: r="+this.selectionOrigin.r+" c="+this.selectionOrigin.c,
		"<br>startDirection: "+this.startDirection
	);
};




/*
======================================== Controller
*/

function XController(){
	var _this = this;
	var undo = new XUndoManager(this);
	this.cursor = new Cursor({controller:this});
	this.selecting = false;
	this.init = function() {
		this.debug = new XDebug("XController");
		this.viewDebug = new XDebug("XView");
		$("#svgcanvas").svg();
		this.svg = $("#svgcanvas").svg('get');
		// TODO: If autosave, load it. If no autosave, load last save, if any. Else load blank puzzle.
		if (_this.hasAutosave()) {
			_this.load("jsxautosave");
		}
		else if (localStorage.jsxsave!==undefined) {
			_this.load("jsxsave")
		}
		else {
			_this.xdata = new XGridModel();
		}
		this.resetBrowserView();
		this.makeTitleEditable();
		this.showCursor();
	};
	this.makeTitleEditable = function() {
		var clickTitle = function() {
			var oldTitle = $(this).html();
			var editBox = '<form id="editTitle"><input id="editTitleInput" type="text" style="width:20em;"></form>';
			$(document).unbind("keydown",_this.keyHandler);
			$(this).html(editBox);
			$("#editTitleInput").val(oldTitle).focus().select();
			$("#editTitle").submit(function(e) {
				_this.xdata.title = $("#editTitleInput").val();
				$("#documentTitle").html(_this.xdata.title);
				$(document).keydown(_this.keyHandler);
				$("#documentTitle").click(clickTitle);
			});
			$("#documentTitle").attr("title","Click to edit");
			$(this).unbind("click"); // Or else a click on the textbox will also be captured
		};
		$("#documentTitle").click(clickTitle);
	};
	this.dialogKeyHandler = function(e) {
		var eid = e.originalEvent.keyIdentifier;
		var kc = e.originalEvent.keyCode;
		var c = String.fromCharCode(eid.replace("U+","0x")).toLowerCase();
		_this.debug.clear();
		_this.debug.log(
			"Key:",e.originalEvent.keyCode,eid,c,"<br>",
			e.shiftKey?"Shift":"",
			e.altKey?"Alt":"",
			e.metaKey?"Cmd":"",
			e.ctrlKey?"Ctrl":""
		);
		if (eid==="U+001B") {
			e.preventDefault();
			$("#buttonImportCancel").click();
		}
		if (e.metaKey && !e.ctrlKey && !e.altKey) {
			switch (eid) {
				case "Enter":
					e.preventDefault();
					$("buttonImportSubmit").click();
					break;
			}
		}
	};
	this.keyHandler = function(e) {
		// Amend event object's lack of cmd key distinguishing.
		// metaKey==true -> Cmd or Ctrl key pressed
		// metaKey==true && ctrlKey!=true -> Cmd+key shortcut (on Mac)
		// NOTE: Cmd and Ctrl cannot be used at the same time at this point!
		// TODO: Maybe try to figure out how to do that? Or just fuhgeddaboudit.
		// TODO: Maybe add support for Windows (Ctrl) shortcuts?
		e.cmdKey = (e.metaKey && !e.ctrlKey);
		// Since we're using lots of keyboard shortcuts with just Cmd+key ...
		e.cmdKeyOnly = (e.cmdKey && !e.altKey && !e.shiftKey);
		var eid = e.originalEvent.keyIdentifier;
		var kc = e.originalEvent.keyCode;
		var c = String.fromCharCode(eid.replace("U+","0x")).toLowerCase();
		_this.debug.clear();
		_this.debug.add(
			"Key: ",e.originalEvent.keyCode, " ", eid, " ", c,"<br>",
			e.shiftKey?"Shift ":"",
			e.altKey?"Alt ":"",
			(e.metaKey && !e.ctrlKey)?"Cmd ":"",
			e.ctrlKey?"Ctrl" :""
		);
		_this.debug.log();
		var singleKey = !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey;
		if (e.cmdKeyOnly) {
			switch (eid) {
				case "Up":
				case "Down":
				case "Left":
				case "Right":
					e.preventDefault(); // prevent page scrolling
					_this.cursor.move({dir:eid,typing:true,e:e});
					break;
				case "U+005A": // Z
					if (e.shiftKey) { // Cmd-Shift-Z
						e.preventDefault();
						undo.redo();
					}
					else { // Cmd-Z
						e.preventDefault();
						undo.undo();
					}
					break;
				case "U+0049": // I (import)
					e.preventDefault();
					_this.showImportForm();
					break;
				case "U+004C": // L (load)
					e.preventDefault();
					_this.load("jsxsave");
					break;
				case "U+004E": // N (new)
					e.preventDefault();
					_this.new();
					break;
				case "U+0053": // S (save)
					e.preventDefault();
					_this.save();
					break;
				default:
			}
		}
		// If character is in alphabet, change current letter.
		else if (c.match(config.alphabet) && singleKey) {
			_this.userTypedLetter({letter:c,e:e});
		}
		else {
			switch (eid) {
				case "Up":
				case "Down":
				case "Left":
				case "Right":
					e.preventDefault(); // prevent page scrolling
					_this.cursor.move({dir:eid,typing:true,e:e});
					break;
				case "Alt":
					_this.cursor.switchDirection();
					break;
				case "U+0020": // space
				case "U+0008": // backspace
				case "U+007F": // delete
					e.preventDefault();
					_this.userDeletedSquare({eid:eid,e:e});
					break;
				default:
			}
		}
	};
	this.userTypedLetter = function(arg) {
		// This function is only run when a user types a letter to be added to the grid.
		// Therefore, an undo/redo step is registered.
		// Add letter at cursor position
		// Register undo step:
		// - delete letter at cursor position, placing cursor at same position
		// Register redo step:
		// - add letter at cursor position
		// - place cursor at new positon
		var cursorBeforeTyping = $.extend(true,{},_this.cursor);
		var oldContent = this.getSquare(_this.cursor);
		this.replaceSquare({cursor:_this.cursor, newContent:new LetterSquare({config:config,letter:arg.letter})});
		this.cursor.move({e:arg.e});
		var cursorAfterTyping = $.extend(true,{},_this.cursor);

		var undoData = {};
		undoData.undoFunc = _this.replaceSquare;
		undoData.undoArg = {
			cursor: $.extend(true,{},cursorBeforeTyping),
			newContent: oldContent,
			newCursor: $.extend(true,{},cursorBeforeTyping)
		};
		undoData.undoDebugString = "Delete R" + cursorBeforeTyping.r + "C" + cursorBeforeTyping.c;
		undoData.redoDebugString = "Set R" + cursorBeforeTyping.r + "C" + cursorBeforeTyping.c + " to "+ arg.letter;
		undoData.redoFunc = _this.replaceSquare;
		undoData.redoArg = {
			cursor: $.extend(true,{},cursorBeforeTyping),
			newContent: new LetterSquare({letter:arg.letter,config:config}),
			newCursor: cursorAfterTyping
		};
		undo.add(undoData);
	};
	this.userDeletedSquare = function(arg) {
		// If cursor is at start of row or column, backspace should do nothing.
		if (arg.eid==="U+0008") { // Backspace
			if ((this.cursor.d==="h" && this.cursor.c===0)
				|| (this.cursor.d==="v" && this.cursor.r===0)) {
				return false;
			}
		}
		// This function is only run when a user types a deletion key.
		// Therefore, an undo/redo step is registered.
		var undoData = {};

		// Cursor before deletion is where we want the cursor to end up after undoing.
		var cursorBeforeDeletion = $.extend(true,{},_this.cursor);
		
		// Space moves the cursor forward, backspace moves it backward.
		// Delete key doesn't move cursor.

		if (arg.eid==="U+0008") { // Backspace
			_this.cursor.move({dir:"Backward",typing:true,e:arg.e});
		}

		var deletedSquare = $.extend(true,{},_this.cursor);
		var deletedData = _this.getSquare(deletedSquare);
		// If square is empty, do nothing.
		
		if (deletedData.className === "LetterSquare") {
			undoData.undoDebugString = "Set R" + deletedSquare.r + "C" + deletedSquare.c + " to " +
				deletedData.getLetter();
			undoData.redoDebugString = "Delete R" + deletedSquare.r + "C" + deletedSquare.c;
		}
		else if (deletedData.className === "EmptySquare") {
			undoData.undoDebugString = "Set R" + deletedSquare.r + "C" + deletedSquare.c + " to empty square";
			undoData.redoDebugString = "Delete R" + deletedSquare.r + "C" + deletedSquare.c;
		}
		_this.deleteSquare({cursor:deletedSquare});
		if (arg.eid==="U+0020") { // Space
			if ( !( (_this.cursor.d==="h" && _this.cursor.c===(_this.xdata.width-1))
				||  (_this.cursor.d==="v" && _this.cursor.r===(_this.xdata.height-1)) ) ) {
				_this.cursor.move({dir:"Forward",typing:true,e:arg.e});
			}
		}
		var cursorAfterDeletion = $.extend(true,{},_this.cursor);
		undoData.undoFunc = _this.replaceSquare;
		undoData.undoArg = {
			cursor: $.extend(true,{},deletedSquare),
			newContent: deletedData,
			newCursor: cursorBeforeDeletion
		};
		undoData.redoFunc = _this.deleteSquare;
		undoData.redoArg = {
			cursor: $.extend(true,{},deletedSquare),
			newCursor: cursorAfterDeletion
		};
		undo.add(undoData);
		_this.showCursor();
	};
	this.deleteSquare = function(arg) {
		// arguments:
		// cursor: Cursor with which square should be deleted
		_this.replaceSquare({cursor:arg.cursor,newContent:new EmptySquare});
	};
	this.hideCursor = function() {
		$('.squarebackground').attr('fill',config.screenFillColor).attr('fill-opacity',0);
	};
	this.showCursor = function() {
		$(this.lineBackgroundSelector()).attr('fill',config.screenCursorFillColor).attr('fill-opacity',config.screenCursorLineOpacity);
		if (this.cursor.l!=0) {
			this.selectionBackgroundSelector();
		}
		$(this.cursorBackgroundSelector()).attr('fill-opacity',1);
		// $(this.selectionBackgroundSelector).attr('fill',config.screenCursorFillColor).attr('fill-opacity',config.screenSelectionOpacity);
	};
	this.cursorBackgroundSelector = function() {
		return "#gridLayer .row"+this.cursor.r+".col"+this.cursor.c+".squarebackground";
	};
	this.selectionBackgroundSelector = function() {
		var selectedSquares = this.cursor.getSelection();
		var selector = "";
		for (var i = 0; i < selectedSquares.length; i++) {
			selector += "#gridLayer .row"+selectedSquares[i].r+".col"+selectedSquares[i].c+", ";
		}
		$(selector).attr('fill',config.screenCursorFillColor).attr('fill-opacity',config.screenSelectionOpacity);
	};
	this.lineBackgroundSelector = function() {
		return "#gridLayer ."+(this.cursor.d=="h"?'row'+this.cursor.r:'col'+this.cursor.c)+".squarebackground";
	};
	this.replaceSquare = function(arg) {
		// TODO: Why doesn't this work when using xdata.setSquare()?? Is it because the model is included before the view, so the view is defined after the model???
		_this.xdata.grid[arg.cursor.r][arg.cursor.c] = arg.newContent;
		_this.bv.updateSquare(arg);
	};
	this.getSquare = function(arg) {
		var squareData = this.xdata.grid[arg.r][arg.c];
		return squareData;
	};
	this.autosave = function() {
		var savedData = JSON.stringify(this.xdata);
		localStorage.setItem("jsxautosave", savedData);
	};
	this.save = function() {
		var savedData = JSON.stringify(this.xdata);
		localStorage.setItem("jsxsave", savedData);
		localStorage.removeItem("jsxautosave");
		this.showFeedback("Lagret!");
	};
	this.newCrossword = function() {
		console.log("Ny oppgave!");
		if (this.hasAutosave()) {
			this.showNewDiscardChanges();
		}
		else {
			this.resetCrossword();
		};
	};
	this.resetCrossword = function() {
		this.xdata = new XGridModel();
		this.resetBrowserView();
	};
	this.hasAutosave = function() {
		return ( localStorage.jsxautosave === undefined ? false : true );
	};
	this.load = function(item) {
		if (item != "jsxautosave" && this.hasAutosave()) {
			this.showLoadDiscardChanges();
		}
		else {
			this.resetCrossword();
		};
		var loadedData;
		if (item!==undefined) {
			loadedData = localStorage.getItem(item);
		}
		if (loadedData) {
			this.xdata = new XGridModel(JSON.parse(loadedData));
			this.resetBrowserView();
			undo = new XUndoManager(this); // Reset undo history
			localStorage.removeItem("jsxautosave"); // Remove any autosave
			this.showFeedback("Lastet!");
		}
		else {
			console.log("Could not find item '"+item+"'!");
			return false;
		}
	};
	this.resetBrowserView = function() {
		var _this = this;
		_this.bv = new XGridScreenView(_this.svg,_this.xdata); // bv = browser view
		_this.cursor.set({r:0,c:0,d:"h"});
	};
	this.showLoadDiscardChanges = function() {
		var _this = this;
		var dialogHTML =
		'<form id="discardChanges">\
			<h1>Laste kryssord</h1>\
			<p>Det finnes ulagrede endringer! Vil du likevel fortsette?</p>\
			<input type="button" value="Nei, avbryt!" id="buttonNewCancel">\
			<input type="button" value="Ja, forkast endringene" id="buttonNewDiscard">\
		</form>';
		this.showDialog(dialogHTML);
		$("#buttonNewCancel").click(function(){
			_this.hideDialog();
		});
		$("#buttonNewDiscard").click(function(){
			_this.hideDialog();
			_this.load();
		});
	};
	this.showNewDiscardChanges = function() {
		var _this = this;
		var dialogHTML =
		'<form id="discardChanges">\
			<h1>Nytt kryssord</h1>\
			<p>Det finnes ulagrede endringer! Vil du likevel fortsette?</p>\
			<input type="button" value="Nei, avbryt!" id="buttonNewCancel">\
			<input type="button" value="Ja, forkast endringene" id="buttonNewDiscard">\
		</form>';
		this.showDialog(dialogHTML);
		$("#buttonNewCancel").click(function(){
			_this.hideDialog();
		});
		$("#buttonNewDiscard").click(function(){
			_this.hideDialog();
			_this.resetCrossword();
		});
	};
	this.showImportForm = function() {
		var _this = this;
		var formHTML =
		'<form id="formImport">\
			<h1>Importer løsning</h1>\
			<p>Lim inn løsninga du vil importere her og klikk på "Importer"-knappen.</p>\
			<textarea id="toImport" rows="10"></textarea><br>\
			<input type="button" value="Avbryt" id="buttonImportCancel">\
			<input id="buttonImportSubmit" type="submit" value="Importer">\
		</form>';
		var formHandler = function(){
			var toImport = $("#toImport").val();
			try {
				_this.xdata.importSolution(toImport);
			}
			catch(e) {
				_this.showFeedback(e.message,"error");
			}
			_this.hideDialog();
			_this.resetBrowserView();
			_this.showFeedback("Importert!");
		};
		this.showDialog(formHTML,formHandler);
		$("#toImport").select();
		$("#buttonImportCancel").click(function(){
			_this.hideDialog();
		});
	};
	this.showDialog = function(html,handler) {
		var _this = this;
		$(document).unbind("keydown",_this.keyHandler);
		$(document).keydown(_this.dialogKeyHandler);
		html = '<div id="dialog">' + html + '</div>';
		$("#dialog-background").html(html).fadeIn(100);
		$("#dialog").hide().slideDown();
		if (handler) {
			$("#dialog form").submit(handler);
		}
	};
	this.hideDialog = function() {
		$("#dialog").slideUp(100,function(){$("#dialog-background").fadeOut(100);});
		$(document).unbind("keydown",this.dialogKeyHandler);
		$(document).keydown(this.keyHandler);
	};
	this.showFeedback = function(message,status) {
		var delay = 2000;
		var fadeout = 250;
		if (status===undefined) {
			status = "ok";
		}
		else if (status==="error") {
			delay = 3000;
		}
		else if (status!=="ok" && status!=="error") {
			throw new Error("Wrong status for feedback message.");
		}
		var msgid = "msg"+Date.now();
		var jqmsgid = "#"+msgid;
		$("#feedback").append('<div id="'+msgid+'" class="message '+status+'">'+message+'</div>');
		$(jqmsgid).show().delay(delay).fadeOut(fadeout);
		setTimeout(function(){$(jqmsgid).remove();},delay+fadeout+500);
	};
};
