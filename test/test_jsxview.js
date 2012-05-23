// Set up an XBoardModel
//		size 5x5
//		square size 10 mm (default)
//		offset/position 0,0
//		line thickness 0.15mm

test("SVGCanvas", function() {
	expect(0);
	// Set up an SVGCanvas
	// SVGCanvas should be of type:
	//		SVGCanvas
	//		XBaseView
	
	// Set up an XBoardScreenView
	//		screen size (zoom) 6 px/mm
	// XBoardScreenView should be of type:
	//		XBoardView
	//		XBaseView
	//		XScreenView
	// Position checks:	square 0,0 should be 0,0
	//									square 1,1 should be 60,60
	//									square 4,4 should be 300,300
	// Change screen size to 5 px/mm
	// Position checks:	square 0,0 should be 0,0
	//									square 1,1 should be 50,50
	//									square 4,4 should be 250,250
});

// test("PDFCanvas", function() {
// 	expect(0);
// 	// Set up a PDFCanvas
// 	// PDFCanvas should be of type:
// 	//		PDFCanvas
// 	//		XBaseView
// 	// Set up an XBoardPDFView of size 5x5, square size 10 mm (default), offset/position 0,0, line thickness 0.15 mm
// 	// Check that paper size is 50x50 mm
// });
