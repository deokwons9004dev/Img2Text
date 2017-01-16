/**
 * Image 2 Text
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 1.0.0
 *
 * This Module converts an image to a text format with 1:1 size ratio in 1pt font.
 * JPG & PNG files are supported. 
 * 
 */

/* NPM Modules */
var gp     = require("get-pixels");  /* Get Image Pixel Data. */
var mime   = require("image-type");  /* Identify Image Type.  */
var async  = require("async");       /* Waterfall Module.     */
var colors = require("colors");      /* CLI Text Colors.      */
var fexist = require("file-exists"); /* Check File Existence. */ 

/* Native Modules */
var fs   = require("fs");
var path = require("path");

/* Initialization */
var log  = console.log.bind(this);
var help = 'Image to Text Usage: \n\
			> node img2text.js <IMG_PATH> \n\
			IMG_PATH: FileSystem Path to Image to convert.'; 


/*
	1) Read in Process Arguments
		> node img2text.js <IMGPATH>
		<IMGPATH>
		* IMGPATH (Required): File Path to Image file to convert. Supports JPG & PNG.
	
	2) Identify Image Type
		Different Arguments will be passed to the next waterfall function according 
		to their image type. If the module cannot identify the type or finds an 
		unsupported file type it will call the error callback and stop proceeding.
		
	3) JPG Conversion
		** PNG Files will pass through to the next function.
		
	4) PNG Conversion
		** JPG Files will pass through to the final callback.
		
	5) Final Callback
		Any error callbacks will print their error statement here.
		If no error was returned, it will 
*/
async.waterfall([

	/* Read in Process Arguments. */
	function (callback) {
		
		/* No Image Path given. (ERROR) */
		if (process.argv.length < 3) {
			log(help);
			callback('No Image File Path Given.');
		}
		else {
			var imgpath = process.argv[2];	
					
			/* Check Image File Existence. */
			if (!fexist(imgpath)) callback('Image Path is Invalid.');
			else                  callback(null, imgpath);
		}
	},
	
	/* Identify Image Type. */
	function (imgPath, callback) {
		var imgBinary = fs.readFileSync(imgPath);
		var imgMime   = mime(imgBinary);
		if (!imgMime || !imgMime.mime)
			callback('Image Type Identification Failed.');
		else {
			switch (imgMime.mime) {
				case 'image/jpeg':
					callback(null, 'jpg', imgPath);
					break;
				case 'image/png':
					callback(null, 'png', imgPath);
					break;
				default:
					callback('Unsupported Image Type.');
					break;
			}
		}
	},
	
	/* JPG Processing. */
	function (imgType, imgPath, callback) {
		if (imgType !== 'jpg') callback(null, imgType, imgPath);
		else 
			gp(imgPath, function (error, pixels) {
				if (error)
					callback(error.toString());
				else {
					var width  = pixels.shape[0];
					var height = pixels.shape[1];
					var pxstr  = pixels.data.toString('hex');
					
					/* A Pixel is represented as a RGBA hex string (ex. AB1200FF). 
					   So if the string isn't a multiple of 8, then we have a problem. */
					if (pxstr.length % 8 != 0)
						callback('Pixel Data is incomplete.');
					else {
						/* Method: While Looper */
						var   index = 0;       /* Loop Index. */
						var   pixel = '';      /* Individual Pixel String. */
						var   gpix  = 0;       /* Individual Gray Pixel Number Representation. */
						var   gimg  = '';      /* Total Gray Text String data. */
						const mult  = 8;       /* Index Multiplication Constant. */
						const pivot = 255 / 6; /* Gray Scale Divider. */
						while(index * mult < pxstr.length) {
							pixel = pxstr.substr(index * mult, mult);
							r     = parseInt(pixel.substr(0,2),16);
							g     = parseInt(pixel.substr(2,2),16);
							b     = parseInt(pixel.substr(4,2),16);
							gpix  = (r + g + b) / 3;
							
							if      ((gpix / pivot) < 1) gimg += '@';
							else if ((gpix / pivot) < 2) gimg += '0';
							else if ((gpix / pivot) < 3) gimg += 'H';
							else if ((gpix / pivot) < 4) gimg += 'I';
							else if ((gpix / pivot) < 5) gimg += 'T';
							else                         gimg += '1';
							
							if (!((index + 1) % width)) gimg += '\n';
							
							index++;
						}
						
						fs.writeFileSync(path.parse(imgPath).name + '.txt', gimg);
						/* Method END */
						
						callback(null, imgType, imgPath);
					}
				}
			});
	},
	
	/* PNG Processing. */
	function (imgType, imgPath, callback) {
		if (imgType !== 'png') callback('Unsupported Image Type.');
		else 
			gp(imgPath, function (error, pixels) {
				if (error)
					callback(error.toString());
				else {
					var width       = pixels.shape[0];
					var height      = pixels.shape[1];
					var pxarr_keys  = Object.keys(pixels.data);
					var pxarr       = [];
					
					/* Pixel Key Array must have length of 4n. */
					if (pxarr_keys.length % 4 != 0)
						callback('Pixel Data is incomplete.');
					
					pxarr_keys.forEach(function (key, i) {
						pxarr.push(pixels.data[key]);
					});
					
					/* Method: For Looper */
					var r,g,b,gpix;
					var gimg = '';
					const pivot = 255 / 6;
					for(i = 0; i < pxarr.length; i += 4) {
						r = pxarr[i];
						g = pxarr[i+1];
						b = pxarr[i+2];
						gpix = (r + g + b) / 3;
						
						if      ((gpix / pivot) < 1) gimg += '@';
						else if ((gpix / pivot) < 2) gimg += '0';
						else if ((gpix / pivot) < 3) gimg += 'H';
						else if ((gpix / pivot) < 4) gimg += 'I';
						else if ((gpix / pivot) < 5) gimg += 'T';
						else                         gimg += '1';
						
						if (!((i + 4) % (width * 4))) gimg += '\n';
					}
					
					fs.writeFileSync(path.parse(imgPath).name + '.txt', gimg);
					/* Method END */
					
					callback(null);
				}
			});
	},
	
], function (error) {
	if (error) 
		log(colors.red('Error: ' + error.toString()));
	else 
		log(colors.green('Info: Image Text Saved! DABBYDABDAB'));
});