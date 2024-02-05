// Photoshop Script for Batch Processing

// Set the base folder where your image folders are located
var baseFolder = "D:/results AI research/photoshop/input/";

//set the base output folder
var outputFolder = "D:/Results AI research/photoshop/output/";

//offset for text
var initialOffset = 600;

// Set the dimensions for the row document 
var rowDocWidth = 2000 + initialOffset;
var rowDocHeight = 300;

//set the image width to resize to
var imageWidth = 256;
var imageHeight = 256;

//variable for spacing length
var spacingLength;

// Set the dimensions for the sheet document
var sheetDocWidth = rowDocWidth;
var sheetDocHeight = 60;

//text to remove so you can get the prompt from the file name
var tailString = "_row";
var delimiter = /-/g;
var fileType = ".png";

//Javascript doesn't have a dictionary object but we can use a regular object for this
var DocumentDictionary = {};

// Array of files (subfolders) containing images to process
var models = getFilesInFolder(baseFolder);


// for(var i = 0; i < models.length; i++) {
//     //create folder for the rows
//     var folderobject = new Folder(outputFolder+"/rows/"+models[i].name+"/");
//     folderobject.create();
//     //create rows for all the prompts
//     createRowsForPromptsInFolder(models[i].fullName, folderobject.fullName);
// }

for(var i = 0; i < models.length; i++) {
    //for each model loop through all the outputted rows and add them to overarching documents
    processRowsIntoSheets(outputFolder+"/rows/"+models[i].name+"/");
}

//loop through the dictionary and export and close all the documents
for (property in DocumentDictionary) {
    
    var PSDocument = DocumentDictionary[property];
    app.activeDocument = PSDocument;
    var outputFile = new File(outputFolder + "/sheets/" + property + " combination.png");
    sfwPNG24(outputFile, PSDocument);
    //close the document
    PSDocument.close(SaveOptions.DONOTSAVECHANGES);
    //delete the reference
    delete DocumentDictionary[property];

}

// Function to process all the output rows into sheets
function processRowsIntoSheets(path) {
    //get files
    var files = getFilesInFolder(path);

    //calculate the spacing length
    //spacingLength = ((newDocWidth - initialOffset) - imageWidth * files.length) / (files.length + 1);

    //loop with length of the amount of files
    for (var i = 0; i < files.length; i++) {
        //get prompt
        var prompt = files[i].name.replace(tailString, "").replace(delimiter, " ").replace(fileType, "");

        //if there in an open document for the file_name (prompt in my case) put it in there and replace the text
        if(prompt in DocumentDictionary) {
            var PSDocument = DocumentDictionary[prompt];
            //import the image to the document
            importImageToDocument(files[i].fullName, PSDocument);
            //resize the canvas
            var height = getHeightTopLayer(PSDocument);
            PSDocument.resizeCanvas(PSDocument.width, PSDocument.height+height, AnchorPosition.TOPCENTER);
            //move the layer
            moveLayer(PSDocument.artLayers[0], 0, PSDocument.height-height);        
        } 
        //else create new document import the image add the text layers and insert it into the Dictionary
        else 
        {
            
            //create a new document
            var newDoc = app.documents.add(sheetDocWidth, sheetDocHeight);
            //create Text layer for prompt  
            var textLayer = createTextLayer(newDoc, prompt);
            //calculate text position
            var posXtext = (sheetDocWidth / 2) - (Number(textLayer.bounds[2] - textLayer.bounds[0]) / 2);
            var posYtext = (sheetDocHeight / 2) - (Number(textLayer.bounds[3] - textLayer.bounds[1]) / 2);
            //set text position
            moveLayer(textLayer, posXtext, posYtext);
            //import the image to the document
            importImageToDocument(files[i].fullName, newDoc);
            //resize the canvas
            var height = getHeightTopLayer(newDoc);
            newDoc.resizeCanvas(newDoc.width, newDoc.height+height, AnchorPosition.TOPCENTER);
            //move the layer
            moveLayer(newDoc.artLayers[0], 0, newDoc.height-height);
            //add to the dictionary
            DocumentDictionary[prompt] = newDoc;

        }
        
    }

    return
}

//function that creates rows for all the prompts
function createRowsForPromptsInFolder(path, target) {
    
    //get all the folders which are named after the prompts
    var prompts = getFilesInFolder(path);

    
    // Open each folder and process the images for the prompt and add text layer
    for (var i = 0; i < prompts.length; i++) {
    var currentFolder = path +"/"+ prompts[i].name + "/";
    //create a new document
    var newDoc = app.documents.add(rowDocWidth, rowDocHeight);
    processImagesInFolder(currentFolder, newDoc);

    //max Width for text
    //var maxWidthForText = initialOffset + spacingLength;
    //add text layer
    var text = getNameOfFolderFromFolderPath(path);
    var textLayer = createTextLayer(newDoc, text);

    //calculate text position
    var posXtext = ((initialOffset + spacingLength) / 2) - (Number(textLayer.bounds[2] - textLayer.bounds[0]) / 2);
    var posYtext = (rowDocHeight / 2) - (Number(textLayer.bounds[3] - textLayer.bounds[1]) / 2);
    //set text position
    moveLayer(textLayer, posXtext, posYtext);

    //export to a png
    var outputFile = new File(target +"/"+ prompts[i].name + "_row.png");
    sfwPNG24(outputFile, newDoc);

    //close the document
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}

    return

}

// Function to process images in a specific folder
function processImagesInFolder(folderPath, targetDoc) {
    //get files
    var files = getFilesInFolder(folderPath);

   
    
    //calculate the spacing length
    spacingLength = ((rowDocWidth - initialOffset) - imageWidth * files.length) / (files.length + 1);

    //loop with length of the amount of files
    for (var i = 0; i < files.length; i++) {
        //import the image to the document
        importImageToDocument(files[i].fullName, targetDoc);
        //resize the image
        resizePixelWidth(targetDoc.artLayers[0], imageWidth, imageHeight);

        //calculate position of image
        var posX = initialOffset + spacingLength + ((imageWidth + spacingLength) * i);
        var posY = rowDocHeight / 2 - imageHeight / 2;
        //move to the correct position
        moveLayer(targetDoc.artLayers[0], posX, posY);
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

// Function to get a list of files in a folder
function getFilesInFolder(folderPath) {
    var folder = new Folder(folderPath);

    return folder.getFiles().sort();
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
        if (i == strArr.length - 1) {
            workingString += strArr[i];
        } else {
            workingString += strArr[i];
            workingString += " ";
            //if the current string being built exceeds the max width (width the paragraph should fit)
            //then the string is added to the final string and an end of line char is added
            //afterwards the current string is emptied
            //35 is an overestimation of how many pixels each letter takes up based on the font size of 32
            if (workingString.length * 35 > maxWidth) {
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