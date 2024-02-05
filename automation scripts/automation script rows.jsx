// Photoshop Script for Batch Processing

// Set the base folder where your image folders are located
var baseFolder = "G:/results AI research/SD_1.5_ema_weighted/";

var outPutFolder = "G:/Results AI research/photoshop/output/SD_1.5_ema_weighted/";

// Set the dimensions for the new document
var newDocWidth = 2300;
var newDocHeight = 300;

//offset for text
var initialOffset = 300;

//set the image width to resize to
var imageWidth = 256;
var imageHeight = 256;

//variable for spacing length
var spacingLength;

// Array of folder names (subfolders) containing images to process
var folders = getFilesInFolder(baseFolder);

// Open each folder and process the images and add text layer
for (var i = 0; i < folders.length; i++) {
    var currentFolder = baseFolder + folders[i].name + "/";
    //create a new document
    var newDoc = app.documents.add(newDocWidth, newDocHeight);
    processImagesInFolder(currentFolder, newDoc);

    //max Width for text
    var maxWidthForText = initialOffset + spacingLength;
    //add text layer
    var textLayer = createTextLayer(newDoc, folders[i].name.replace(/%20/g, " "));

    //calculate text position
    var posXtext = ((initialOffset + spacingLength) / 2) - (Number(textLayer.bounds[2] - textLayer.bounds[0]) / 2);
    var posYtext = (newDocHeight / 2) - (Number(textLayer.bounds[3] - textLayer.bounds[1]) / 2);
    //set text position
    moveLayer(textLayer, posXtext, posYtext);

    //export to a png
    var outputFile = new File(outPutFolder + folders[i].name + "_row.png");
    sfwPNG24(outputFile, newDoc);

    //close the document
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}

// Function to process images in a specific folder
function processImagesInFolder(folderPath, targetDoc) {
    //get files
    var files = getFilesInFolder(folderPath);

    //calculate the spacing length
    spacingLength = ((newDocWidth - initialOffset) - imageWidth * files.length) / (files.length + 1);

    //loop with length of the amount of files
    for (var i = 0; i < files.length; i++) {
        //import the image to the document
        importImageToDocument(files[i].fullName, targetDoc);
        //resize the image
        resizePixelWidth(targetDoc.artLayers[0], imageWidth, imageHeight);

        //calculate position of image
        var posX = initialOffset + spacingLength + ((imageWidth + spacingLength) * i);
        var posY = newDocHeight / 2 - imageHeight / 2;
        //move to the correct position
        moveLayer(newDoc.artLayers[0], posX, posY);
    }

    return
}


// Function to import an image into a document
function importImageToDocument(imagePath, targetDoc) {
    // Open the image
    var sourceDoc = app.open(new File(imagePath));

    // Copy the entire contents of the source document
    sourceDoc.selection.selectAll();
    sourceDoc.selection.copy();

    // Paste into the target document
    app.activeDocument = targetDoc;
    targetDoc.paste();

    // Close the source document without saving changes
    sourceDoc.close(SaveOptions.DONOTSAVECHANGES);
}

// Function to get a list of files in a folder
function getFilesInFolder(folderPath) {
    var folder = new Folder(folderPath);
    return folder.getFiles();
}

// Function to move a layer to specific X and Y coordinates
function moveLayer(layer, x, y) {
    //calculate the difference between the desired coordinates and the current ones
    var deltaX = x - Number(layer.bounds[0]);
    var deltaY = y - Number(layer.bounds[1]);
    //perform translation
    layer.translate(deltaX, deltaY);
}

//Function to resize an Image to a certain height and width in pixels
function resizePixelWidth(l, pw, ph) {
    //save ruler units
    var origRulerUnits = preferences.rulerUnits;
    preferences.rulerUnits = Units.PIXELS;
    //calculate width and height and scaling factor to achieve desired PixelWidth and PixelHeight
    var b = l.bounds;
    var w = b[2] - b[0];
    var h = b[3] - b[1];
    var sw = (pw / w) * 100;
    var sh = (ph / h) * 100;
    l.resize(sw, sh, AnchorPosition.MIDDLECENTER)
    //reset ruler units
    preferences.rulerUnits = origRulerUnits;
    return
}

//Function for Exporting an Image as a png
function sfwPNG24(saveFile, targetDoc) {

    //create new options object
    var pngOpts = new ExportOptionsSaveForWeb;

    //set the options
    pngOpts.format = SaveDocumentType.PNG
    pngOpts.PNG8 = false;
    pngOpts.transparency = true;
    pngOpts.interlaced = false;
    pngOpts.quality = 100;

    //export document with png options
    targetDoc.exportDocument(saveFile, ExportType.SAVEFORWEB, pngOpts);

}

//Function that adds a Text layer to a document with a custom text
function createTextLayer(document, text, maxWidth) {

    //add layer and make it of type Text
    var textLayer = document.artLayers.add();
    textLayer.kind = LayerKind.TEXT;

    // Specify text properties
    textLayer.textItem.contents = stringBuilder(text, maxWidth); // Your desired text
    textLayer.textItem.size = 32; // Font size
    textLayer.textItem.font = "Arial"; // Font family

    return textLayer;
}

function stringBuilder(string, maxWidth) { 
    //string holder
    var workingString = "";
    //final string
    var finalString = "";
    //split string
    var strArr = string.split(" ");
    //loop through array
    for (var i = 0; i < strArr.length; i++) { 
        //last added string gets no empty space behind it
        if(i == strArr.length - 1) {
            workingString += strArr[i];
        } else {
            workingString += strArr[i];
            workingString += " ";
            //if the current string being built exceeds the max width (width the paragraph should fit)
            //then the string is added to the final string and an end of line char is added
            //afterwards the current string is emptied
            //35 is an overestimation of how many pixels each letter takes up based on the font size of 32
            if(workingString.length * 35 > maxWidth) {
                finalString += workingString;
                finalString += "\r";
                workingString = "";
            }
        }
    }

    //add the last workingString to the final string
    finalString += workingString;

    return finalString;
}