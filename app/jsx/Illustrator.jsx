var includedWidgets;
var designConfig;

if (typeof($) == 'undefined') {
  var $ = {};
}

$._ext = {
  //Evaluate a file and catch the exception.
  evalFile: function(path) {
    try {
      $.evalFile(path);
    } catch (e) {
      alert("Exception:" + e);
    }
  },
  // Evaluate all the files in the given folder
  evalFiles: function(jsxFolderPath) {
    var folder = new Folder(jsxFolderPath);
    if (folder.exists) {
      var jsxFiles = folder.getFiles("*.jsx");
      for (var i = 0; i < jsxFiles.length; i++) {
        var jsxFile = jsxFiles[i];
        $._ext.evalFile(jsxFile);
      }
    }
  }
};

$._ext_ILST = {
  run: function() {
    var basePath = Folder.temp;

    // var file = new File('/Users/jamesstewart/Documents/code/widgets/LineChart/LineChart-Filled.svg');
    var file = new File('~/Desktop/test.pdf');
    // var file = File.openDialog("Select File");
    var doc = openFile(file);
    for (var i = 0; i < doc.pageItems.length; i++) {
      doc.pageItems[i].selected = true;
    }
    app.copy();
    doc.close(SaveOptions.DONOTSAVECHANGES);
    app.paste();

    return appName;
  },

  downloadFile: function(svgFile, name, replaceName) {
    var page = app.activeDocument;
    var basePath = Folder.temp;
    var f = new File(basePath + "/artboard.svg");
    f.encoding = 'utf-8';
    f.open("w");
    svgFile = '<?xml version="1.0" encoding="utf-8"?>\n' + svgFile;
    f.write(svgFile);
    f.close();
    var layer;
    var replaceItem;
    if (replaceName) {
      replaceItem = getByName(page.pageItems, replaceName);
    }
    for (var i = 0; i < page.layers.length; i++) {
      if (!page.layers[i].locked && page.layers[i].visible){
        layer = page.layers[i];
      }
    }
    if (!layer){
      layer = page.layers.add();
    }
    page.activeLayer = layer;
    var parentItem = layer.groupItems.createFromFile(f);
    var newItem = parentItem.groupItems[0];
    f.remove();
    if(replaceItem){
      if (isUnlocked(replaceItem)) {
        newItem.move(replaceItem, ElementPlacement.PLACEAFTER);
        newItem.position = replaceItem.position;
        replaceItem.remove();
      } else {
        parentItem.remove();
        return;
      }
    }else {
      newItem.move(parentItem, ElementPlacement.PLACEAFTER);
      newItem.position = activeDocument.artboards[0].artboardRect.slice(0,2);
    }
    newItem.hidden = false;
    if(name){
      newItem.name = name;
    }
    parentItem.remove();
  },

  // Exports current document to dest as an SVG file with specified
  // options, dest contains the full path including the file name
  exportToSVG: function(reopen, document) {
    if (reopen !== false) {
      reopen = true;
    }
    if (app.documents.length > 0) {
      // alert("EXPORTING");
      this.readWidgetsSizes(includedWidgets);
      var fonts = this.getFonts();
      var doc = document || app.activeDocument;

      var exportOptions = new ExportOptionsSVG();
      var type = ExportType.SVG;
      var basePath = Folder.temp;
      var fileSpec = new File(basePath + '/export.svg');
      exportOptions.embedRasterImages = true;
      exportOptions.sVGTextOnPath = true;
      exportOptions.fontType = SVGFontType.SVGFONT;
      exportOptions.fontSubsetting = SVGFontSubsetting.None;
      exportOptions.documentEncoding = SVGDocumentEncoding.UTF8;
      var currentFilePath = doc.fullName;

      if (!currentFilePath.toString()
        .match('Untitled')) {
        doc.save();
        currentFilePath = doc.fullName;
      } else if (reopen) {
        var name = File.saveDialog('Save your file');
        if (name) {
          doc.saveAs(name);
          currentFilePath = doc.fullName;
        } else {
          return null;
        }
      }
      this.saveConfig();
      var frameLayer = getByName(doc.layers, 'FrameLayer');
      var frameVisible;
      if (frameLayer) {
        frameVisible = frameLayer.visible;
        frameLayer.visible = false;
      }
      var svgWarn = app.preferences.getIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress');
      svgWarn = resetPref(svgWarn);
      app.preferences.setIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress', 1);
      doc.exportFile(fileSpec, type, exportOptions);
      app.preferences.setIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress', svgWarn);
      var width = doc.width.toFixed(3);
      var height = doc.height.toFixed(3);
      if (reopen) {
        // openFile(currentFilePath);
        doc.saveAs(currentFilePath);
      } else {
        doc.close(SaveOptions.DONOTSAVECHANGES);
      }
      fileSpec.encoding = 'UTF-8';
      fileSpec.open("r");
      var result = fileSpec.read();
      result = this.processSvg(result, height, width, includedWidgets, fonts);
      fileSpec.close();
      fileSpec.remove();
      if (frameLayer) {
        frameLayer.visible = frameVisible;
      }
      return result;
    }
  },

  processSvg: function(svg, height, width, includedWidgets, fonts) {
    var f;
    var font;
    var re;
    var name;
    var widget;
    var replacement;
    var result = svg.replace(/<svg /, '<svg height="' + height + 'px" width="' + width + 'px" ');
    result = result.replace(/_x5F_/g, '_');
    result = result.replace(/<svg ([^>]*)style="([^"]*)"/, '<svg $1style="$2;display:block;"');
    for (widget in includedWidgets) {
      name = includedWidgets[widget].config.widgetName.value;
      re = new RegExp('id="' + name + '(_\\d+_)?"')
      result = result.replace(re, 'id="' + name + '"');
    }
    result = result.replace(/font-size:([0-9.]+);/g, 'font-size:$1px;');

    for (f in fonts) {
      font = fonts[f];
      re = new RegExp('font-family:\'' + font.name + '\';', 'g');
      replacement = fontReplacement(font);
      result = result.replace(re, replacement);
    }
    return result;

    function fontReplacement(font) {
      var re;
      var fontWeight;
      var fontStyle;
      var validStyles = ['Italic', 'Oblique'];
      var fontWeights = {
        light: 300,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900
      };
      var replacement = 'font-family:\'' + font.name + '\', \'' + font.family + '\';';
      var style = font.style;
      if (style !== 'Regular') {
        re = new RegExp(validStyles.join('|'));
        if (re.test(style)) {
          replacement += ' font-style:' + re.exec(style)[0] + ';';
        }
        for (var weight in fontWeights) {
          re = new RegExp(weight, 'i');
          if (re.test(style)) {
            replacement += ' font-weight:' + fontWeights[weight] +';';
          }
        }
      }
      return replacement;
    }
  },


  getFonts: function() {
    var font;
    var fonts = {};
    // var fontsArray = [];
    for ( i = 0; i< app.activeDocument.textFrames.length; i++) {
      try { // This throws an error for empty text fields. I could check if it is empty, but this seems safer
        font = app.activeDocument.textFrames[i].textRange.characterAttributes.textFont;
        fonts[font.name] = font;
      } catch(e) {
      }
    }
    return fonts;
  },

  exportToPNG: function(base) {
    if (app.documents.length > 0) {
      // this.readWidgetsSizes();

      var doc = app.activeDocument;
      var exportOptions = new ExportOptionsPNG24();
      exportOptions.artBoardClipping = true;
      var scale = (300 / doc.width) * 100;
      exportOptions.horizontalScale = scale;
      exportOptions.verticalScale = scale;
      var type = ExportType.PNG24;
      var basePath = base || Folder.temp;
      // var basePath = '~/Desktop';
      var fileSpec = new File(basePath + '/export.png');
      var currentFilePath = doc.fullName;

      if (!currentFilePath.toString()
        .match('Untitled')) {
        doc.save();
        currentFilePath = doc.fullName;
      } else {
        doc.saveAs(File.saveDialog('Save your file'));
        currentFilePath = doc.fullName;
      }
      var frameLayer = getByName(doc.layers, 'FrameLayer');
      var frameVisible;
      if (frameLayer) {
        frameVisible = frameLayer.visible;
        frameLayer.visible = false;
      }
      doc.exportFile(fileSpec, type, exportOptions);
      if (frameLayer) {
        frameLayer.visible = frameVisible;
      }
      return basePath + '/export.png';

      // doc.close(SaveOptions.DONOTSAVECHANGES);
      // openFile(currentFilePath);
    }
  },

  createNew: function(name, size) {
    try {
      app.documents.add(DocumentColorSpace.RGB, size.width, size.height);
      // throw new Error();
    } catch(e) {
      return e;
    }
    // var newName = File.saveDialog('Save your new design');
    // newDoc.saveAs(newName);
    // return newName;
  },

  saveDocument: function(name) {
    var doc = app.activeDocument;
    if (!name) {
      name = File.saveDialog('Save your new design');
    }
    if (doc && name) {
      var file = new File(name);
      doc.saveAs(file);
    }
    return name;
  },

  hasArtboard: function () {
    if (app && app.documents.length > 0) {
      return true;
    } else {
      return false
    }
  },

  showFrame: function(size) {
    var doc = app.activeDocument;
    var board = doc.artboards[0];
    var boardSize = board.artboardRect;
    var frameLayer = getByName(doc.layers, 'FrameLayer');
    if (!frameLayer) {
      frameLayer = doc.layers.add();
      frameLayer.name = 'FrameLayer';
    }
    frameLayer.locked = false;
    var frame = getByName(frameLayer.pathItems, 'FrameRect');
    if (!frame) {
      frame = frameLayer.pathItems.rectangle(boardSize[1], boardSize[0], size.width, size.height);
      frame.name = 'FrameRect';
      frame.fillColor = new NoColor();
      var newRGBColor = new RGBColor();
      newRGBColor.red = 0;
      newRGBColor.green = 0;
      newRGBColor.blue = 0;
        frame.strokeColor = newRGBColor;
    } else {
      frame.height = size.height;
      frame.width = size.width;
      frame.top = boardSize[1];
      frame.left = boardSize[0];
    }
    frameLayer.locked = true;

  },
  saveWidgets: function(config) {
    includedWidgets = config.includedWidgets;
    designConfig = config;
    this.cleanWidgetList(includedWidgets);
    this.saveConfig();
    return JSON.stringify(includedWidgets);
  },
  getDataPath: function(){
    var currentDocument = app.activeDocument.fullName.toString();
    var path;
    if(!currentDocument.match(/Untitled/)){
      path = currentDocument.replace(/\.[^.]+$/, '') + ' - Domo Assets';
    }
    return path;
  },
  saveConfig: function() {
    // var currentDocument = app.activeDocument.fullName.toString();
    // if(!currentDocument.match(/Untitled/)){
    //     var configFileName = currentDocument.replace(/\.[^.]+$/, '') + '-config.json';
    //     var config = new File(configFileName);
    //     config.open('w');
    //     config.write(JSON.stringify(designConfig));
    //     config.close();
    // }
    setMetaConfig();
  },
  loadConfig: function(name, size, theme) {
    name = name || 'My Awesome Design';
    size = size || '5x3';
    var result = JSON.stringify({
      title: name,
      currentSize: size,
      currentTheme: theme,
      previewBgColor: '#FBFBFB',
      includedWidgets: {}
    });
    if(app.documents.length === 0){
      return result;
    }
    result = getMetaConfig() || result;
    // var doc = app.activeDocument;
    // var currentDocument = doc.fullName.toString();
    // var configFileName = currentDocument.replace(/\.[^.]+$/, '') + '-config.json';
    // var config = new File(configFileName);
    // if (config.exists) {
    //     config.open('r');
    //     result = config.read();
    //     if (!result) {
    //         result = JSON.stringify({
    //             title: name,
    //             currentSize: size,
    //             currentTheme: theme,
    //             includedWidgets: {}
    //         });
    //     }
    //     config.close();
    // }
    return result;
  },
  cleanWidgetList: function(includedWidgets) {
    if (app.documents.length < 1) {
      return '{}';
    }
    var key;
    var item;
    var widgetName;
    var doc = app.activeDocument;
    var items = doc.pageItems;
    var found = [];
    this.renameCopiedWidgets(includedWidgets);
    for(key in includedWidgets){
      widgetName = includedWidgets[key].config.widgetName.value;
      item = getByName(items, widgetName);
      if (!item) {
        delete includedWidgets[key];
      } else {
        found.push(widgetName);
      }
    }
  },
  readWidgetsSizes: function() {
    var key;
    var widgetGroup;
    var bounds;
    var widgetName;
    this.cleanWidgetList(includedWidgets);
    for (key in includedWidgets) {
      widgetName = includedWidgets[key].config.widgetName.value;
      widgetGroup = getByName(app.activeDocument.pageItems, widgetName);
      if (widgetGroup) {
        bounds = this.findItemByNameInGroup(widgetGroup, 'chartBounds');
        if (bounds) {
          if (includedWidgets[key].config.height){
            includedWidgets[key].config.height.value = bounds.height;
          }
          if (includedWidgets[key].config.width){
            includedWidgets[key].config.width.value = bounds.width;
          }
        }
      }
    }
    this.saveConfig();
    return JSON.stringify(includedWidgets);
  },
  widgetExists: function(name) {
    return !!getByName(app.activeDocument.pageItems, name);
  },
  findItemByNameInGroup: function(group, name) {
    var collection = group.pageItems;
    var item = getByName(collection, name);
    if (item) {
      return item;
    }
    var groups = group.groupItems;
    for (var i = 0; i < groups.length; i++) {
      item = this.findItemByNameInGroup(groups[i], name);
      if (item) {
        return item;
      }
    }
    return null;
  },

  removeElement: function(elementName) {
    var element = getByName(app.activeDocument.pageItems, elementName);
    element.remove();
  },

  getElementPosition: function(elementName) {
    var element = getByName(app.activeDocument.pageItems, elementName);
    if (element) {
      return JSON.stringify(element.position);
    } else {
      return null;
    }
  },

  setElementPosition: function(elementName, position) {
    var element = getByName(app.activeDocument.pageItems, elementName);
    element.position = position;
    return JSON.stringify(element.position);
  },

  renameCopiedWidgets: function(includedWidgets) {
    var key;
    var name;
    var duplicates;
    for (key in includedWidgets) {
      name = includedWidgets[key].config.widgetName.value;
      duplicates = findDuplicates(name);
      renameDuplicates(includedWidgets, duplicates, key);
    }
  },

  selectWidgetOnPage: function(widget) {
    var element = getByName(app.activeDocument.pageItems, widget);
    app.activeDocument.selection = null;
    element.selected = true;
    return element ? 'Selected ' + widget : 'Could not find ' + widget;
  },

  selectWidgetChangeMeOnPage: function(widget) {
    var element = getByName(app.activeDocument.pageItems, widget);
    var changeMe = this.findItemByNameInGroup(element, 'ChangeMe');
    if (!changeMe) {
      changeMe = this.findItemByNameInGroup(element, 'changeMe');
    }
    app.activeDocument.selection = null;
    changeMe.selected = true;
    return changeMe ? 'Selected ' + widget : 'Could not find ' + widget;
  },

  getSvgForWidget: function(widget) {
    var element = getByName(app.activeDocument.pageItems, widget);
    if(element) {
      var doc = app.activeDocument;
      try {
        var newDoc = app.documents.add(DocumentColorSpace.RGB, 500, 500);
      } catch (e) {
        return 'Error';
      }
      doc.activate();

      var newElement = element.duplicate(newDoc, ElementPlacement.PLACEATBEGINNING);
      newElement.position = [0,500];
      return this.exportToSVG(false, newDoc);
    } else {
      return false;
    }
  },
  getDocumentDimensions: function(document) {
    var doc = document || app.activeDocument;
    
    var dim = doc ? { 
      width: doc.width, 
      height: doc.height 
    } : null;

    return JSON.stringify(dim);
  },
  getDocumentName: function() {
    return app.documents.length > 0 ? app.activeDocument.fullName : '';
  }
};


function getByName(collection, name) {
  try {
    return collection.getByName(name);
  } catch (e) {
    return null;
  }
}

function isUnlocked(item) {
  var test = item;
  var locked = item.locked;
  while (!locked && test.parent) {
    test = test.parent;
    locked = test.locked;
  }
  return !locked;
}

function findDuplicates(name) {
  var i;
  var duplicates = [];
  var items = app.activeDocument.pageItems;
  var item;
  while (item = getByName(items, name)) {
    item.name = 'temp-' + item.name;
    duplicates.unshift(item);
  }

  return duplicates;
}

function renameDuplicates(includedWidgets, duplicates, id) {
  var i;
  var dataName;
  var newDataName;
  var tempData;
  var name = includedWidgets[id].config.widgetName.value;
  var match = name.match(/(.*?)_(\d)$/);
  var nameBase = name;
  var newName;
  var startingNum = 1;
  var allWidgetNames = [];
  var uuid;
  for (var key in includedWidgets) {
    allWidgetNames.push(includedWidgets[key].config.widgetName.value);
  }
  if (match) {
    startingNum = parseInt(match[2], 10);
    nameBase = match[1];
  }
  for (i = 1; i < duplicates.length; i++) {
    num = startingNum;
    newName = nameBase + '_' + num;
    while (indexOf(allWidgetNames, newName) >= 0){
      num++;
      newName = nameBase + '_' + num;
    }
    allWidgetNames.push(newName);
    uuid = createUUID();
    includedWidgets[uuid] = JSON.parse(JSON.stringify(includedWidgets[id]));
    includedWidgets[uuid].UUID = uuid;
    includedWidgets[uuid].config.widgetName.value = newName;
    for (dataName in includedWidgets[uuid].data) {
      tempData = includedWidgets[uuid].data[dataName];
      newDataName = dataName.replace(name, newName);
      tempData.name = newDataName;
      delete includedWidgets[uuid].data[dataName];
      includedWidgets[uuid].data[newDataName] = tempData;
    }
    duplicates[i].name = newName;
  }
  if (duplicates.length > 0){
    duplicates[0].name = name;
  }
}

function indexOf(array, value) {
  var i;
  for (i = 0; i < array.length; i++) {
    if (array[i] === value) {
      return i;
    }
  }
}

function setMetaConfig() {
  if (app.documents.length > 0) {
    var xmp = app.activeDocument.XMPString;
    xmp = xmp.replace(/<dc:designConfig>.*<\/dc:designConfig>/, '');
    xmp = xmp.replace('<dc:format>', '<dc:designConfig>' + encodeURIComponent(JSON.stringify(designConfig)) + '</dc:designConfig>\n<dc:format>');
    app.activeDocument.XMPString = xmp;
  }
}

function getMetaConfig() {
  var xmp = app.activeDocument.XMPString;
  var re = /<dc:designConfig>(.*)<\/dc:designConfig>/;
  var match = xmp.match(re);
  if(match){
    return decodeURIComponent(match[1]);
  }
  return null;
}

function openFile(file) {
  var svgWarn = app.preferences.getIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress');
  svgWarn = resetPref(svgWarn);
  app.preferences.setIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress', 1);
  var doc = app.open(file);
  app.preferences.setIntegerPreference('plugin/DontShowWarningAgain/svgSaveWarningSupress', svgWarn);
  return doc;
}

function resetPref(num) {
  if (num === 133844352) {
    return 0;
  }
  return num;
}

function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}