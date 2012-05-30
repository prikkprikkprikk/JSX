/*
======================================== Debug
*/
function XDebug(id) {
	this.init(id);
	this.buffer = "";
}
XDebug.prototype.parentID ="debugWrapper";
XDebug.prototype.parentSelector = "#"+XDebug.prototype.parentID;
XDebug.prototype.init = function(id) {
	id += "Debug";
	this.id = id;
	this.selector = "#"+id;
	if ($(this.parentSelector).length===0) {
		$("body").append("<div id='"+this.parentID+"'></div>");
	}
	if ($(this.selector).length===0) {
		$(this.parentSelector).append("<div id='"+this.id+"'></div>").append;
	}
};
XDebug.prototype.log = function() {
	if (arguments.length>0) {
		for(s in arguments) {
			this.buffer += arguments[s] + " ";
		}
	}
	$(this.selector).html("<h2>"+this.id+"</h2><p>"+this.buffer+"</p>");
};
XDebug.prototype.add = function() {
	for(s in arguments) {
		this.buffer += arguments[s];
	}
};
XDebug.prototype.clear = function() {
	// Empty the buffer
	this.buffer = "";
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
		this.buildDebugBuffer();
	};
	this.undo = function() {
		if (undoHistory.length>0) {
			action = undoHistory.shift();
			redoHistory.unshift($.extend(true,{},action));
			controller.hideCursor();
			action.undoFunc(action.undoArg);
			controller.bv.updateSquare(action.undoArg);
			controller.setCursor(action.undoArg.newCursor);
		}
		this.buildDebugBuffer();
	};
	this.redo = function() {
		if (redoHistory.length>0) {
			action = $.extend(true,{},redoHistory.shift());
			controller.hideCursor();
			action.redoFunc(action.redoArg);
			// TODO: Set cursor to whatever it was right after the action being undone was done
			controller.setCursor(action.redoArg.newCursor);
			undoHistory.unshift($.extend(true,{},action));
		}
		this.buildDebugBuffer();
	};
}


/*
======================================== Controller
*/

function XController(){
	var _this = this;
	var undo = new XUndoManager(this);
	this.cursor = {r:0,c:0,d:"h"};
	this.debug = new XDebug("XController");
	this.init = function(data) {
		$("#svgcanvas").svg();
		this.svg = $("#svgcanvas").svg('get');
		if (data === undefined) {
			_this.load();
		}
		else {
			_this.xdata = data;
		}
		this.resetBrowserView();
	};
	this.keyHandler = function(e) {
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
		// metaKey=true -> Cmd or Ctrl key pressed
		// ctrlKey!=true -> Cmd+key shortcut (on Mac)
		// TODO: Maybe add support for Windows (Ctrl) shortcuts?
		if (e.metaKey && !e.ctrlKey) {
			switch (eid) {
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
				case "U+0053": // S (save)
					e.preventDefault();
					_this.save();
					break;
				case "U+004C": // L (load)
					e.preventDefault();
					_this.load();
					break;
				default:
			}
		}
		// If character is in alphabet, change current letter.
		else if (c.match(config.alphabet)) {
			_this.userTypedLetter({letter:c});
		}
		else {
			switch (eid) {
				case "Up":
				case "Down":
				case "Left":
				case "Right":
					e.preventDefault(); // prevent page scrolling
					_this.moveCursor({dir:eid,typing:true,e:e});
					break;
				case "Alt":
					_this.switchDirection();
					break;
				case "U+0020": // space
				case "U+0008": // backspace
				case "U+007F": // delete
					e.preventDefault();
					_this.userDeletedSquare({cursor:_this.cursor,eid:eid});
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
		this.moveCursor();
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
			_this.moveCursor({dir:"Backward",typing:true});
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
				_this.moveCursor({dir:"Forward",typing:true});
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
		_this.setCursor(_this.cursor);
	};
	this.deleteSquare = function(arg) {
		// arguments:
		// cursor: Cursor with which square should be deleted
		_this.replaceSquare({cursor:arg.cursor,newContent:new EmptySquare});
	};
	this.switchDirection = function() {
		var _this = this;
		_this.hideCursor();
		if (_this.cursor.d=="h") {
			_this.cursor.d="v";
		}
		else {
			_this.cursor.d="h";
		}
		this.setCursor(_this.cursor);
	};
	this.moveCursor = function(arg) {
		// arg: dir = "Right", "Down", "Left", "Up"
		//		typing = true if user is typing, false if doing an undo/redo step (default)
		var _this = this;
		_this.hideCursor();
		var typing = false;
		if (arg!==undefined) {
			typing === arg.typing || false;
		}
		var dir = "";
		if (arg===undefined || arg.dir === undefined) {
			dir = this.cursor.d === "h"? "Right" : "Down";
			typing = true;
		}
		else if (arg!==undefined && arg.dir==="Forward") {
			dir = this.cursor.d === "h"? "Right" : "Down";
		}
		else if (arg!==undefined && arg.dir==="Backward") {
			dir = this.cursor.d === "h"? "Left" : "Up";
		}
		else if (arg!==undefined && arg.dir!==undefined) {
			dir = arg.dir;
		}
		switch (dir) {
			case "Up":
				if (_this.cursor.d==="h" && !arg.e.shiftKey) {
					_this.switchDirection();
				}
				else {
					_this.cursor.r--;
					if (_this.cursor.r<0) {_this.cursor.r += _this.xdata.height};
				}
				break;
			case "Down":
				if (_this.cursor.d==="h" && !arg.e.shiftKey) {
					_this.switchDirection();
				}
				else {
					_this.cursor.r++;
					if (_this.cursor.r===_this.xdata.height) {
						if (typing) {
							_this.cursor.r = _this.xdata.height - 1;
						} else {
							_this.cursor.r = 0;
						}
					}
				}	
				break;
			case "Left":
				if (_this.cursor.d==="v" && !arg.e.shiftKey) {
					_this.switchDirection();
				}
				else {
					_this.cursor.c--;
					if (_this.cursor.c<0) {_this.cursor.c += _this.xdata.width};
				}
				break;
			case "Right":
				if (_this.cursor.d==="v" && !arg.e.shiftKey) {
					_this.switchDirection();
				}
				else {
					_this.cursor.c++;
					if (_this.cursor.c===_this.xdata.width) {
						if (typing) {
							_this.cursor.c = _this.xdata.width - 1;
						}
						else {
							_this.cursor.c = 0;
						}
					}
				}
				break;
			default:
		}
		_this.setCursor(_this.cursor);
	};
	this.hideCursor = function() {
		$('.squarebackground').attr('fill',config.screenFillColor).attr('fill-opacity',0);
	};
	this.setCursor = function(cursor) {
		var _this = this;
		_this.cursor = $.extend(true,{},cursor);
		$(_this.lineBackgroundSelector(cursor)).attr('fill',config.screenCursorFillColor).attr('fill-opacity',config.screenCursorLineOpacity);
		$(_this.cursorBackgroundSelector(cursor)).attr('fill-opacity',1);
	};
	this.cursorBackgroundSelector = function(cursor) {
		var _this = this;
		return "#gridLayer .row"+cursor.r+".col"+cursor.c+".squarebackground";
	};
	this.lineBackgroundSelector = function(cursor) {
		var _this = this;
		return "#gridLayer ."+(cursor.d=="h"?'row'+cursor.r:'col'+_this.cursor.c)+".squarebackground";
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
	this.save = function() {
		var savedData = JSON.stringify(this.xdata);
		localStorage.setItem("jsxsave", savedData);
	};
	this.load = function() {
		var loadedData = localStorage.getItem("jsxsave");
		if (loadedData) {
			_this.xdata = new XGridModel(JSON.parse(loadedData));
			console.log('Loading crossword "'+_this.xdata.title+'"');
			_this.resetBrowserView();
		}
		else {
			console.log("Nothing to load!");
			return false;
		}
	};
	this.resetBrowserView = function() {
		this.bv = new XGridScreenView(this.svg,this.xdata); // bv = browser view
		this.setCursor({r:0,c:0,d:"h"});
	};
};
