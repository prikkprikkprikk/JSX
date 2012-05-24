/* Clue model
*/

function XClue(arg) {
	// arg is an object with attributes x, y, d and (optionally) h:
	//   x, y: 0 or 1 – which adjacent square is the clue for?
	//         For example, {x:1,y:0} = the square to the right
	//      d: "h" (horizontal) or "v" (vertical)
	//         In which direction does the solution run? I.e., in which direction should the arrow point?
	//      h: hint text, string with \n for line breaks
	if (arg === undefined) {
		throw new Error("XClue constructor called with no argument. It needs an array of clues as an argument!");
	}
	if (!(arg instanceof Object)) {
		throw new Error("XClue constructor needs an object with properties x,y,d and (optionally) h. See constructor comments for details.");
	}
	if (arg.x === undefined) {
		throw new Error("XClue constructor missing 'x' argument.");
	}
	if (arg.y === undefined) {
		throw new Error("XClue constructor missing 'y' argument.");
	}
	if (arg.d === undefined) {
		throw new Error("XClue constructor missing 'd' argument.");
	}
	if ((typeof arg.x !== "number") || (arg.x !== 0 && arg.x !== 1)) {
		throw new Error("XClue constructor 'x' argument missing or not one of 0 or 1.");
	}
	if ((typeof arg.y !== "number") || (arg.y !== 0 && arg.y !== 1)) {
		throw new Error("XClue constructor 'y' argument missing or not one of 0 or 1.");
	}
	if ((arg.d !== "h") && (arg.d !== "v")) {
		throw new Error("XClue constructor argument 'd' should be either 'h' or 'v'.");
	}
	if (arg.h === undefined) {
		arg.h = "[N/A]";
	}
	if (typeof arg.h !== "string") {
		throw new Error("XClue constructor argument 'h' should be a string.");
	}
	this.data = arg;
}
XClue.prototype.numLines = function() {
	return this.getLines().length;
};
XClue.prototype.getText = function() {
	return this.data.h;
};
XClue.prototype.getLines = function() {
	return this.data.h.split('\n');
};
XClue.prototype.getSolutionX = function() {
	return this.data.x;
};
XClue.prototype.getSolutionY = function() {
	return this.data.y;
};
XClue.prototype.getSolutionDirection = function() {
	return this.data.d;
};


/*
========== Single Square Model

*/


/* XSquare Model – parent class
*/

function XSquare() {
	this.className = "XSquare";
}



/* Letter Square model
*/

function LetterSquare (arg) {
	this.className = "LetterSquare";
	if (arg===undefined) {
		throw new Error("LetterSquare constructor called with no argument.");
	}
	if (arg.config===undefined || arg.letter===undefined) {
		throw new Error("LetterSquare constructor needs an object with two attributes:\n'letter' (single character string) and 'config' (XConfig object).");
	}
	if (!(arg.config instanceof XConfig)) {
		throw new Error("LetterSquare config argument is not an XConfig object.");
	}
	this.config = arg.config;
	if (arg.letter.length!==1) {
		throw new Error("LetterSquare constructor 'letter' argument is wrong length; should be 1 character.");
	}
	this.letter = arg.letter.toLowerCase();
	if (!this.letter.match(this.config.alphabet)) {
		throw new Error("LetterSquare constructor 'letter' argument not in alphabet.");
	}
}
LetterSquare.prototype = new XSquare();
LetterSquare.prototype.getLetter = function() {
	return this.letter.toUpperCase();
};



/* Empty Square model
*/

function EmptySquare() {
	this.className = "EmptySquare";
}
EmptySquare.prototype = new XSquare();



/* Clue Square model
*/

function ClueSquare(clues) {
	this.className = "ClueSquare";
	this.clues = new Array();
	var _this = this;
	if (clues instanceof XClue) {
		this.clues.push(clues);
	}
	else if (clues instanceof Array) {
		$.each(clues, function(i,clue) {
			if (clue instanceof XClue) {
				_this.clues.push(clue);
			}
			else {
				throw new Error("ClueSquare constructor: Argument should be an XClue or an array of XClues.");
			}
		});
	}
	else if (typeof clues !== "undefined") {
		throw new Error("ClueSquare constructor: Argument should be an XClue or an array of XClues.");
	}
}
ClueSquare.prototype.className = function() {
	return "ClueSquare";
};
ClueSquare.prototype.addClue = function(clue) {
	if (clue instanceof XClue) {
		this.clues.push(clue);
		return true;
	}
	else {
		throw new Error("ClueSquare.addClue: Argument should be an XClue.");
	}
};
ClueSquare.prototype.getClues = function() {
	return this.clues;
};
ClueSquare.prototype.numLines = function() {
	var total = 0;
	if (typeof this.clues !== "undefined") {
		$.each(this.clues, function(i,clue) {
			total += clue.numLines();
		});
	}
	return total;
};



/*
========== Whole Grid Model

*/

function XGridModel(arg) {
	var _this = this;
	this.grid = new Array();
	if (arg === undefined) {
		this.title = "Test-kryssord 01";
		this.width = 9;
		this.height = 21;
		for (var r=0; r < this.height; r++) {
			this.grid[r] = new Array();
			for (var c=0; c < this.width; c++) {
				this.grid[r][c] = new EmptySquare();
			}
		}
	}
	else {
		this.height = arg.height;
		this.width = arg.width;
		this.title = arg.title;
		// Reconstruct squares
		for (r=0;r<arg.grid.length;r++) {
			_this.grid[r] = new Array();
			for (c=0;c<arg.grid[r].length;c++) {
				switch (arg.grid[r][c].className) {
					case "EmptySquare":
						_this.grid[r][c] = new EmptySquare();
						break;
					case "LetterSquare":
						_this.grid[r][c] = new LetterSquare({letter:arg.grid[r][c].letter,config:config});
						break;
					case "ClueSquare":
						_this.grid[r][c] = new ClueSquare(arg.grid[r][c]);
						break;
					default:
				}
			}
		}
	}
}
XGridModel.prototype.setSquare = function(arg) {
	this.grid[arg.r][arg.c] = $.extend(true,{},arg.newContent);
};
XGridModel.prototype.getSquare = function(arg) {
	return this.grid[arg.r][arg.c];
};
XGridModel.prototype.getLetter = function(row,col) {
	if (this.grid[row][col] instanceof LetterSquare) {
		return this.grid[row][col].getLetter();
	}
	return false;
};
