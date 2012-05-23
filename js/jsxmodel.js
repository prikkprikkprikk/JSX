/* Clue model
*/

function XClue(data) {
	// data is an associative array consisting of:
	//   x, y = which adjacent square is the clue for? For example, {x:1,y:0} = the square to the right
	//   d = in which direction goes the solution? I.e., in which direction should the arrow point?
	//   h = hint text, with \n for line breaks
	if (typeof data === "undefined") {
		throw new Error("XClue constructor called with no argument. It needs an array of clues as an argument!");
	}
	else if (!(data instanceof Object)) {
		throw new Error("XClue constructor needs an object with properties x,y,d,h.");
	}
	else {
		this.data = data;
	}
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

/* Square Model – parent class
*/

function XSquare() {
	this.className = "XSquare";
}
XSquare.prototype.isLetterSquare = function() {
	return this instanceof LetterSquare;
};
XSquare.prototype.isClueSquare = function() {
	return this instanceof ClueSquare;
};


/* Letter Square model
*/

function LetterSquare (arg) {
	if (arg===undefined) {
		throw new Error("LetterSquare constructor called with no argument.");
	}
	if (arg.letter===undefined) {
		throw new Error("LetterSquare constructor missing 'letter' argument.");
	}
	if (arg.letter.length!==1) {
		throw new Error("LetterSquare constructor 'letter' argument too long; should be 1 character.");
	}
	this.letter = arg.letter.toLowerCase();
	this.className = "LetterSquare";
}
LetterSquare.prototype = new XSquare();
LetterSquare.prototype.isLetterSquare = function() {
	return true;
};
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
						_this.grid[r][c] = new LetterSquare(arg.grid[r][c]);
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
