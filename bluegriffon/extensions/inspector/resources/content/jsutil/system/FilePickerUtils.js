/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/***************************************************************
* FilePickerUtils -------------------------------------------------
*  A utility for easily dealing with the file picker dialog.
* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
* REQUIRED IMPORTS:
****************************************************************/

//////////// global constants ////////////////////

const kFilePickerCID = "@mozilla.org/filepicker;1";
const kLFileCID = "@mozilla.org/file/local;1";

const nsIFilePicker = Components.interfaces.nsIFilePicker;

////////////////////////////////////////////////////////////////////////////
//// class FilePickerUtils

var FilePickerUtils =
{
  pickFile: function(aTitle, aInitPath, aFilters, aMode, aCallback)
  {
    try {
      var modeStr = aMode ? "mode" + aMode : "modeOpen";
      var mode;
      try {
        mode = nsIFilePicker[modeStr];
      } catch (ex) {
        dump("WARNING: Invalid FilePicker mode '"+aMode+"'. Defaulting to 'Open'.\n");
        mode = nsIFilePicker.modeOpen;
      }

      var fp = XPCU.createInstance(kFilePickerCID, "nsIFilePicker");
      fp.init(window.browsingContext, aTitle, mode);

      // join array of filter names into bit string
      var filters = this.prepareFilters(aFilters);

      if (aInitPath) {
        var dir = XPCU.createInstance(kLFileCID, "nsILocalFile");
        dir.initWithPath(aInitPath);
        fp.displayDirectory = dir;
      }

      fp.open(function(result) {
        if (result == nsIFilePicker.returnOK) {
          if (aCallback) aCallback(fp.file);
        } else {
          if (aCallback) aCallback(null);
        }
      });
    } catch (ex) {
      dump("ERROR: Unable to open file picker.\n" + ex + "\n");
      if (aCallback) aCallback(null);
    }
  },

  pickDir: function(aTitle, aInitPath, aCallback)
  {
    try {
      var fp = XPCU.createInstance(kFilePickerCID, "nsIFilePicker");
      fp.init(window.browsingContext, aTitle, nsIFilePicker.modeGetFolder);

      if (aInitPath) {
        var dir = XPCU.createInstance(kLFileCID, "nsILocalFile");
        dir.initWithPath(aInitPath);
        fp.displayDirectory = dir;
      }

      fp.open(function(result) {
        if (result == nsIFilePicker.returnOK) {
          if (aCallback) aCallback(fp.file);
        } else {
          if (aCallback) aCallback(null);
        }
      });
    } catch (ex) {
      dump("ERROR: Unable to open directory picker.\n" + ex + "\n");
      if (aCallback) aCallback(null);
    }
  },
  
  prepareFilters: function(aFilters)
  {
    // join array of filter names into bit string
    var filters = 0;
    for (var i = 0; i < aFilters.length; ++i)
      filters = filters | nsIFilePicker[aFilters[i]];
    
    return filters;
  }
   
};

