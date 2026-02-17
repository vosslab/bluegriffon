/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

dump("bgCommandHandler.sys.mjs: MODULE LOADED\n");

const nsICommandLineHandler  = Ci.nsICommandLineHandler;
const nsIContentHandler      = Ci.nsIContentHandler;
const nsIDocShellTreeItem    = Ci.nsIDocShellTreeItem;
const nsIInterfaceRequestor  = Ci.nsIInterfaceRequestor;
const nsISupportsString      = Ci.nsISupportsString;
const nsIWebNavigation       = Ci.nsIWebNavigation;
const nsIWindowMediator      = Ci.nsIWindowMediator;
const nsIWindowWatcher       = Ci.nsIWindowWatcher;

var { UrlUtils } = ChromeUtils.importESModule("resource://gre/modules/urlHelper.sys.mjs");

function openWindow(parent, url, target, features, args) {
  var wwatch = Cc["@mozilla.org/embedcomp/window-watcher;1"]
                       .getService(nsIWindowWatcher);

  // Pass an array to avoid the browser "|"-splitting behavior.
  var argArray = Cc["@mozilla.org/array;1"]
                      .createInstance(Ci.nsIMutableArray);

  var stringArgs = null;
  if (args instanceof Array)
    stringArgs = args;
  else if (args)
    stringArgs = [args];

  if (stringArgs) {
    var uriArray = Cc["@mozilla.org/array;1"]
                         .createInstance(Ci.nsIMutableArray);
    stringArgs.forEach(function (uri) {
      var sstring = Cc["@mozilla.org/supports-string;1"]
                            .createInstance(nsISupportsString);
      sstring.data = uri;
      uriArray.appendElement(sstring);
    });
    argArray.appendElement(uriArray);
  } else {
    argArray.appendElement(null);
  }

  return wwatch.openWindow(parent, url, target, features, argArray);
}

// Content handler for -file and -url command line arguments
// Registered as command-line-handler category "m-bluegriffon"
export function nsBlueGriffonContentHandler() {}
nsBlueGriffonContentHandler.prototype = {

  QueryInterface: ChromeUtils.generateQI([nsICommandLineHandler,
                                          nsIContentHandler]),

  handle: function bch_handle(cmdLine) {
    dump("bgCommandHandler m-bluegriffon: handle() called, length=" + cmdLine.length + "\n");
    if (!cmdLine.length)
      return;

    var urlArray = [];
    var url = null;
    var ar = null;

    // deal with -file arguments
    do {
      ar = cmdLine.handleFlagWithParam("file", false);
      if (ar) {
        cmdLine.preventDefault = true;
        try {
          var localFile = UrlUtils.newLocalFile(ar);
          var ioService = Cc["@mozilla.org/network/io-service;1"]
                        .getService(Ci.nsIIOService);
          var fileHandler = ioService.getProtocolHandler("file")
                          .QueryInterface(Ci.nsIFileProtocolHandler);
          url = fileHandler.getURLSpecFromFile(localFile);
          urlArray.push(url);
        }
        catch(e) {
          dump("bgCommandHandler m-bluegriffon: error handling -file arg: " + e + "\n");
        }
      }
    }
    while (ar);

    do {
      url = cmdLine.handleFlagWithParam("url", false);
      if (url)
        urlArray.push(url);
    }
    while(url);

    var e = Services.wm.getEnumerator("bluegriffon");
    var mostRecent = null;
    if (e && e.hasMoreElements()) {
      mostRecent = e.getNext();
    }

    if (urlArray && urlArray.length) {
      cmdLine.preventDefault = true;
      if (mostRecent) {
        dump("bgCommandHandler m-bluegriffon: opening URLs in existing window\n");
        var navNav = mostRecent.QueryInterface(nsIInterfaceRequestor)
                          .getInterface(nsIWebNavigation);
        var rootItem = navNav.QueryInterface(nsIDocShellTreeItem).rootTreeItem;
        var rootWin = rootItem.QueryInterface(nsIInterfaceRequestor)
                              .getInterface(Ci.nsISupports);
        rootWin.OpenFiles(urlArray, true);
        return;
      }
      dump("bgCommandHandler m-bluegriffon: opening new window with URLs\n");
      return openWindow(null, "chrome://bluegriffon/content/xul/bluegriffon.xul",
                              "_blank",
                              "chrome,dialog=no,all",
                              urlArray);
    }
  },

  helpInfo: "",

  handleContent: function bch_handleContent(contentType, context, request) {
    dump("bgCommandHandler: handleContent called for " + contentType + "\n");
  }
};

// Default command line handler for bare launch
// Registered as command-line-handler category "y-default"
// Opens the BlueGriffon editor window when no specific content args are given
export function nsDefaultCommandLineHandler() {}
nsDefaultCommandLineHandler.prototype = {

  QueryInterface: ChromeUtils.generateQI([nsICommandLineHandler]),

  handle: function dch_handle(cmdLine) {
    dump("bgCommandHandler y-default: handle() called, length=" + cmdLine.length + " preventDefault=" + cmdLine.preventDefault + "\n");

    if (cmdLine.preventDefault) {
      dump("bgCommandHandler y-default: preventDefault is true, returning\n");
      return;
    }

    // Check for singleton window
    var win = Services.wm.getMostRecentWindow("bluegriffon");
    if (win) {
      dump("bgCommandHandler y-default: focusing existing window\n");
      win.focus();
      cmdLine.preventDefault = true;
      return;
    }

    // Bare launch - open the editor window
    dump("bgCommandHandler y-default: bare launch, opening default window\n");
    var wwatch = Cc["@mozilla.org/embedcomp/window-watcher;1"]
                         .getService(nsIWindowWatcher);
    wwatch.openWindow(null,
                      "chrome://bluegriffon/content/xul/bluegriffon.xul",
                      "_blank",
                      "chrome,dialog=no,all",
                      cmdLine);
  },

  helpInfo: ""
};
