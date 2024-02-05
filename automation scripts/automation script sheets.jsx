// Photoshop Script for Batch Processing

// Set the base folder where your image folders are located
var baseFolder = "G:/results AI research/photoshop/output/rows/";

//set the output folder where you want the images to be output
var outPutFolder = "G:/Results AI research/photoshop/output/sheets/";

// Set the dimensions for the new document
var newDocWidth = 2300;
var newDocHeight = 60;

//text to remove so you can get the prompt from the file name
var tailString = "_row";
var delimiter = /_/g;

//Javascript doesn't have a dictionary object but we can use a regular object for this
var DocumentDictionary = {};

// Array of folder names (subfolders) containing images to process
var folders = getFilesInFolder(baseFolder);

// Open each folder and process the images and add text layer
for (var i = 0; i < folders.length; i++) {
    var currentFolder = baseFolder + folders[i].name + "/";
    
    //process the images in the folder
    processRowsIntoSheets(currentFolder);

}

//loop through the dictionary and export and close all the documents
for (property in DocumentDictionary) {
    
    var PSDocument = DocumentDictionary[property];
    var outputFile = new File(outPutFolder + property + "_combination.png");
    sfwPNG24(outputFile, PSDocument);
    //close the document
    PSDocument.close(SaveOptions.DONOTSAVECHANGES);
    //delete the reference
    delete DocumentDictionary[property];

}


// Function to process all the output rows into sheets
function processRowsIntoSheets(folderPath) {
    //get files
    var files = getFilesInFolder(folderPath);

    //calculate the spacing length
    //spacingLength = ((newDocWidth - initialOffset) - imageWidth * files.length) / (files.length + 1);

    //loop with length of the amount of files
    for (var i = 0; i < files.length; i++) {

        //if there in an open document for the file_name (prompt in my case) put it in there and replace the text
        if(files[i].Name in DocumentDictionary) {
            var PSDocument = DocumentDictionary[files[i].Name];
            //import the image to the document
            importImageToDocument(files[i].fullName, PSDocument);
            //resize the canvas
            var height = getHeightTopLayer(PSDocument);
            PSDocument.resizeCanvas(PSDocument.width, PSDocument.height+height, AnchorPosition.MIDDLETOP);
            //move the layer
            moveLayer(PSDocument.artLayers[0], 0, PSDocument.height-height);
        } 
        //else create new document import the image add the text layers and insert it into the Dictionary
        else 
        {
            //create a new document
            var newDoc = app.documents.add(newDocWidth, newDocHeight);
            //create Text layer for prompt
            var text = files[i].Name.replace(tailString, "").replace(delimiter, " ");
            var textLayer = createTextLayer(newDoc, text);
            //calculate text position
            var posXtext = (newDocWidth / 2) - (Number(textLayer.bounds[2] - textLayer.bounds[0]) / 2);
            var posYtext = (newDocHeight / 2) - (Number(textLayer.bounds[3] - textLayer.bounds[1]) / 2);
            //set text position
            moveLayer(textLayer, posXtext, posYtext);
            //import the image to the document
            importImageToDocument(files[i].fullName, newDoc);
            //resize the canvas
            var height = getHeightTopLayer(newDoc);
            newDoc.resizeCanvas(newDoc.width, newDoc.height+height, AnchorPosition.MIDDLETOP);
            //move the layer
            moveLayer(newDoc.artLayers[0], 0, newDoc.height-height);
            //add to the dictionary
            DocumentDictionary[files[i].Name] = newDoc;

        }
        
    }

    return
}



//function that returns a string with the name of the Top Folder in a folder path
function getNameOfFolderFromFolderPath(folderPath) {

    var strArr = folderPath.split("/");

    if(strArr[strArr.length - 1] == "") {
        return strArr[strArr.length - 2]; 
    } else {
        return strArr[strArr.length - 1];
    }

}

//Function to resize the canvas of a document based on the top layer
function getHeightTopLayer(targetDoc) {
    //save ruler units
    var origRulerUnits = preferences.rulerUnits;
    preferences.rulerUnits = Units.PIXELS;
    //calculate height of top layer
    var bounds = targetDoc.artLayers[0].bounds
    var h = bounds[3] - bounds[1];
    
    preferences.rulerUnits = origRulerUnits;

    return h;
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
function resizePixelWidth(layer, pixelWidth, pixelHeight) {
    //save ruler units
    var origRulerUnits = preferences.rulerUnits;
    preferences.rulerUnits = Units.PIXELS;
    //calculate width and height and scaling factor to achieve desired PixelWidth and PixelHeight
    var bounds = layer.bounds;
    var w = bounds[2] - bounds[0];
    var h = bounds[3] - bounds[1];
    var sw = (pixelWidth / w) * 100;
    var sh = (pixelHeight / h) * 100;
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
function createTextLayer(document, text) {

    //add layer and make it of type Text
    var textLayer = document.artLayers.add();
    textLayer.kind = LayerKind.TEXT;

    // Specify text properties
    textLayer.textItem.contents = text; // Your desired text
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