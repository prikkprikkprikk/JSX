/*
======================================== View: Base
  Common stuff for all views

	TODO: Collect common stuff from subclasses

*/

function XView() {
	
}


/*
======================================== XGridScreenView
  Screen view of full grid

*/

function XGridExportSolutionView(data) {
	this.data = data;
}
XGridExportSolutionView.prototype.getHtml = function() {
	var html = "<body><pre>";
	for (r=0; r<this.data.height; r++) {
		for(c=0; c<this.data.width; c++) {
			var letter = this.data.getLetter(r,c);
			html += "\t" + (letter||"");
		}
		if(r<this.data.height-1) {
			html += "\n";
		}
	}
	html += "</pre></body>";
	return html;
};

function XGridScreenView(svg,data) {
	var _this = this;
	this.svg = svg;
	this.load(data);
}
XGridScreenView.prototype = new XView();
XGridScreenView.prototype.load = function(data) {
	var _this = this;
	this.data = data;
	$("#svgcanvas svg").children().remove();

	// Set up layers
	this._createLayer('background');
	this._createLayer('grid');
	this._createLayer('content');

	var sqsize = config.squareSizeInPixels();
	this.gridSizeX = data.width*sqsize;
	this.gridSizeY = data.height*sqsize;

	this.bg = this.svg.rect($('#backgroundLayer'),config.strokeWidthInPixels()/2,config.strokeWidthInPixels()/2,this.gridSizeX,this.gridSizeY,{
		fill: config.screenFillColor,
		strokeWidth: 0
	});
	this.grid = new Array();
	for (var r=0; r < data.height; r++) {
		_this.grid[r] = new Array();
		for (var c=0; c < data.width; c++) {
			var xpos = c*sqsize;
			var ypos = r*sqsize;
			// TODO: The last argument (the data) is a reference, so if the it's changed, reconstructing the view should suffice. In other words: Separate the actual building of the svg object into a method of the SquareScreenView class so it can be called both upon construction and when updating.
			_this.grid[r][c] = new SquareScreenView(_this.svg,r,c,data.grid[r][c]);
		}
	}
};
XGridScreenView.prototype._createLayer = function(name) {
	layerID = name + "Layer";
	this.svg.group({id:layerID});
};
XGridScreenView.prototype.getLayer = function(name) {
	layerID = name + "Layer";
	return $(layerID);
};
XGridScreenView.prototype.updateSquare = function(arg) {
	var r = arg.cursor.r;
	var c = arg.cursor.c;
	var classes = ".row"+r+".col"+c;
	var id = "#row"+r+"col"+c;
	this.svg.remove($(classes));
	$(classes).remove();
	this.grid[r][c] = new SquareScreenView(this.svg,r,c,this.data.grid[r][c]);
};


/*
======================================== SquareView
  Common stuff for single squares

*/

function SquareView() {
	
}

/*
======================================== SquareScreenView
  Screen view of single square

*/

function SquareScreenView(svg, r, c, data) {
	// TODO: Separate letter and clue square views into own objects (inherit from SquareScreenView)
	// TODO: Save all svg objects into variables so they can be destroyed properly
	var _this = this;
	this.sqsize = config.squareSizeInPixels();
	// Creates a square at parent's position plus delta x/y.
	this.dx = c*this.sqsize;
	this.dy = r*this.sqsize;
	this.xpos = this.dx;
	this.ypos = this.dy;
	// TODO: Find a way to get parent's position – replace the four lines above with something like this:
	// var xpos = parent.xpos + dx;
	// var ypos = parent.ypos + dy;
	var classes = "row"+r+" col"+c + " squarebackground";
	var id = "row"+r+"col"+c;
	this.sq = svg.group($("#contentLayer"),{id:id, class:classes});
	var parentGroup = $("#"+id)[0];
	console.log(parentGroup);
	var sqfill = config.screenFillColor;
	this.border = svg.rect($('#gridLayer'),this.xpos,this.ypos,this.sqsize,this.sqsize,{
		class: classes,
		stroke: config.screenStrokeColor,
		fill: sqfill,
		fillOpacity: 0,
		strokeWidth: config.strokeWidthInPixels()
	});
	if (data instanceof LetterSquare) {
		// TODO: Use config for text appearance
		this.l = svg.text(parentGroup,this.xpos+this.sqsize/2,this.ypos+this.sqsize/2+4,data.getLetter(),{
			fill: "#000",
			fillOpacity: "100",
			fontFamily: "Myriad Pro",
			fontSize: config.fontSizeSolution,
			fontWeight: "bold",
			textAnchor: "middle",
			alignmentBaseline: "middle"
		});
	}
	else if (data instanceof ClueSquare) {
		this.clues = data.getClues();
		this.numLines = data.numLines();
		var lastIndex = this.clues.length-1;
		var clueTop = 0;
		var clueBottom = 0;
		var clueVerticalMiddle = 0;
		$.each(this.clues, function(i,clue) {
			var clueHeightFraction = clue.numLines()/_this.numLines;
			var clueHeight = clueHeightFraction * _this.sqsize;
			clueBottom = clueTop + clueHeight;
			clueVerticalMiddle = clueTop + clueHeight/2;
			// split clue text into lines
			var lines = clue.getLines();
			// calculate total text height for clue
			var fontSize = config.fontSizeClue;
			var XHeightPercentage = 0.9; // Font size percentage for vertical adjustment of clue text position.
			var lineHeightPercentage = .9;
			var lineHeight = fontSize * lineHeightPercentage;
			var clueTextHeight = fontSize*XHeightPercentage + (clue.numLines()-1)*lineHeight;
			var firstLineYPos = clueVerticalMiddle - clueTextHeight/2 + fontSize*XHeightPercentage - (fontSize*.15);
			var lineYPos = _this.ypos + firstLineYPos;
			$.each(lines, function(i,line){
				// add clue text
				// TODO: Use config for text appearance
				svg.text(parentGroup,
					_this.xpos+_this.sqsize/2, // x-pos
					lineYPos, // y-pos
					line,
				{
					fill: "#000",
					fontFamily: "Myriad Pro",
					fontSize: fontSize,
					textAnchor: "middle"
				});
				lineYPos += lineHeight;
			});
			
			// Add arrow
			var arrowMargin = 5; // distance between square edge and overArm
			var overArmLength = 8;
			var underArmLength = 5;
			var arrowheadWidth = 10;
			var arrowheadLength = 7;
			// If clue position is perpendicular to clue direction, add arrow
			if (
				!(clue.getSolutionDirection()=="h" && (clue.getSolutionX()==1 && clue.getSolutionY()==0))
					&&
				!(clue.getSolutionDirection()=="v" && (clue.getSolutionX()==0 && clue.getSolutionY()==1))
			) {
				// Variable suffix a = arrow
				// aOriginX/Y = start point of arrow
				// aElbowX/Y = where the arrow bends
				// aEndX/Y = end point of arrow
				
				// If clue start is below …
				if (clue.getSolutionX()==0 && clue.getSolutionY()==1) {
					aOriginX = _this.xpos + arrowMargin;
					aOriginY = _this.ypos + clueBottom;
					aElbowX = aOriginX;
					aElbowY = _this.ypos + _this.sqsize + overArmLength;
					aEndX = aElbowX + underArmLength;
					aEndY = aElbowY;
				}
				// else if clue start is to the right …
				else if (clue.getSolutionX()==1 && clue.getSolutionY()==0) {
					aOriginX = _this.xpos + _this.sqsize;
					aOriginY = _this.ypos + clueTop + arrowMargin;
					aElbowX = aOriginX + overArmLength;
					aElbowY = aOriginY;
					aEndX = aElbowX;
					aEndY = aElbowY + underArmLength;
				}
				// else if clue start is both below and right …
				else if (clue.getSolutionX()===1 && clue.getSolutionY()===1) {
					aOriginX = _this.xpos + _this.sqsize;
					aOriginY = _this.ypos + clueBottom;
					aElbowX = aOriginX + arrowMargin;
					aElbowY = aOriginY + arrowMargin;
					if (clue.getSolutionDirection()=="h") {
						aEndX = aOriginX + underArmLength*1.44;
						aEndY = aElbowY+ underArmLength*.44;
					}
					else {
						aEndX = aElbowX + underArmLength*.44;
						aEndY = aOriginY + underArmLength*1.44;
					}
				}
				svg.line( parentGroup, aOriginX, aOriginY, aElbowX, aElbowY, {
					stroke:config.screenStrokeColor
				});
				svg.line( parentGroup, aElbowX, aElbowY, aEndX, aEndY, {
					stroke:config.screenStrokeColor
				});
				if (clue.getSolutionDirection()==="v") {
					svg.polygon(parentGroup, [[aEndX, aEndY],[aEndX+(arrowheadWidth/2), aEndY], [aEndX, aEndY+arrowheadLength], [aEndX-(arrowheadWidth/2), aEndY]], {fill: '#000', opacity: 1, strokeWidth: 0} );
				}
				else {
					svg.polygon(parentGroup, [[aEndX, aEndY],[aEndX, aEndY-(arrowheadWidth/2)], [aEndX+arrowheadLength, aEndY], [aEndX, aEndY+(arrowheadWidth/2)]], {fill: '#000', opacity: 1, strokeWidth: 0} );
				}
			}
			
			// add separator line
			if (i<lastIndex) {
				svg.line(parentGroup,_this.xpos,_this.ypos+clueBottom,_this.xpos+_this.sqsize,_this.ypos+clueBottom,{
					stroke:config.screenStrokeColor
				});
			}
			clueTop = clueBottom;
		});
	}
}

SquareScreenView.prototype = new SquareView();

