/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * tabeditor-element.js: Custom Element replacement for XBL binding
 * tabeditor.xml#tabeditor (XBL removed in Gecko ESR 140).
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is BlueGriffon.
 *
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (daniel.glazman@disruptive-innovations.com), Original Author
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the LGPL or the GPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Custom Element: <bg-tabeditor>
// Replaces XBL binding from bindings/tabeditor.xml
class BGTabEditor extends XULElement {

  constructor() {
    super();
    // constructor was empty in XBL (commented-out line)
  }

  connectedCallback() {
    // Only build the anonymous content once
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // Build the anonymous content that was previously in XBL <content>.
    // All elements are created as regular DOM children with anonid attributes
    // so that getChild() can find them via querySelector.

    // --- tabbox wrapper ---
    var tabbox = document.createXULElement("tabbox");
    tabbox.setAttribute("anonid", "EditorTabbox");
    tabbox.setAttribute("flex", "1");

    // --- hbox containing tabs and new-document button ---
    var hbox = document.createXULElement("hbox");
    hbox.setAttribute("style", "min-height: 24px");

    var tabs = document.createXULElement("tabs");
    tabs.setAttribute("flex", "1");
    tabs.setAttribute("anonid", "EditorTabs");
    tabs.setAttribute("closebutton", "true");
    tabs.setAttribute("setfocus", "false");
    // Wire up tab selection; 'this' refers to the BGTabEditor instance
    var self = this;
    tabs.addEventListener("select", function(event) {
      self.onTabSelected(event, self);
    });
    hbox.appendChild(tabs);

    var newDocVbox = document.createXULElement("vbox");
    newDocVbox.setAttribute("style", "width: 24px");
    newDocVbox.setAttribute("id", "newDocumentButton");

    var spacer1 = document.createXULElement("spacer");
    spacer1.setAttribute("flex", "1");
    newDocVbox.appendChild(spacer1);

    var innerHbox = document.createXULElement("hbox");
    var spacer2 = document.createXULElement("spacer");
    spacer2.setAttribute("flex", "1");
    innerHbox.appendChild(spacer2);

    var toolbarbutton = document.createXULElement("toolbarbutton");
    toolbarbutton.setAttribute("image", "chrome://bluegriffon/skin/plus.png");
    toolbarbutton.setAttribute("id", "newDocumentWithOptionsButton");
    // DTD entity &newToolbarCmd.tooltip; must be resolved at load time;
    // we set a fallback here and let the XUL overlay or localization fix it up
    toolbarbutton.setAttribute("tooltiptext", "New Document");
    toolbarbutton.addEventListener("command", function(event) {
      NewDocumentWithOptions(event);
    });
    innerHbox.appendChild(toolbarbutton);

    var spacer3 = document.createXULElement("spacer");
    spacer3.setAttribute("flex", "1");
    innerHbox.appendChild(spacer3);

    newDocVbox.appendChild(innerHbox);

    var spacer4 = document.createXULElement("spacer");
    spacer4.setAttribute("flex", "1");
    newDocVbox.appendChild(spacer4);

    hbox.appendChild(newDocVbox);
    tabbox.appendChild(hbox);

    // --- Move any existing <vbox> children into the tabbox ---
    // (This replaces the XBL <children includes="vbox"/> insertion point)
    var existingVboxes = Array.from(this.querySelectorAll(":scope > vbox"));
    for (var v = 0; v < existingVboxes.length; v++) {
      tabbox.appendChild(existingVboxes[v]);
    }

    // --- grid layout for rulers and editor panels ---
    var grid = document.createXULElement("grid");
    grid.setAttribute("flex", "1");

    var columns = document.createXULElement("columns");
    var col1 = document.createXULElement("column");
    var col2 = document.createXULElement("column");
    col2.setAttribute("flex", "1");
    columns.appendChild(col1);
    columns.appendChild(col2);
    grid.appendChild(columns);

    var rows = document.createXULElement("rows");

    // Row 1: spacer + hruler
    var row1 = document.createXULElement("row");
    var spacerR1 = document.createXULElement("spacer");
    row1.appendChild(spacerR1);
    var hruler = document.createXULElement("bg-hruler");
    hruler.setAttribute("anonid", "hruler");
    hruler.setAttribute("disabled", "true");
    row1.appendChild(hruler);
    rows.appendChild(row1);

    // Row 2: vruler + tabpanels + splitter + viewport box
    var row2 = document.createXULElement("row");
    row2.setAttribute("flex", "1");
    row2.setAttribute("style", "background-image: url('chrome://bluegriffon/content/logo.png'); background-repeat: no-repeat; background-position: center center");

    var vruler = document.createXULElement("bg-vruler");
    vruler.setAttribute("anonid", "vruler");
    vruler.setAttribute("disabled", "true");
    row2.appendChild(vruler);

    var editorHbox = document.createXULElement("hbox");
    editorHbox.setAttribute("flex", "1");

    var tabpanels = document.createXULElement("tabpanels");
    tabpanels.setAttribute("anonid", "EditorTabpanels");
    tabpanels.setAttribute("id", "EditorTabpanels");
    tabpanels.setAttribute("selectedIndex", "0");
    tabpanels.setAttribute("flex", "1");
    tabpanels.setAttribute("style", "margin:0px; padding:0px;");
    editorHbox.appendChild(tabpanels);

    var splitter = document.createXULElement("splitter");
    splitter.setAttribute("id", "responsiveSplitter");
    splitter.setAttribute("oncommand", "ResizeEventNotifier.doNotify()");
    splitter.setAttribute("anonid", "responsiveSplitter");
    splitter.setAttribute("collapse", "after");
    splitter.setAttribute("hidden", "true");
    splitter.setAttribute("tooltiptext", "to resize your editing viewport");
    editorHbox.appendChild(splitter);

    var viewportBox = document.createXULElement("box");
    viewportBox.setAttribute("anonid", "viewportSplitterBox");
    viewportBox.setAttribute("flex", "1");
    viewportBox.setAttribute("collapsed", "true");
    viewportBox.setAttribute("hidden", "true");
    editorHbox.appendChild(viewportBox);

    row2.appendChild(editorHbox);
    rows.appendChild(row2);

    // Row 3: helper buttons
    var row3 = document.createXULElement("row");
    row3.setAttribute("id", "helperButtons");
    row3.setAttribute("align", "center");
    var spacerR3 = document.createXULElement("spacer");
    spacerR3.setAttribute("flex", "1");
    row3.appendChild(spacerR3);

    // Move any existing <hbox> children into this row
    // (This replaces the XBL <children includes="hbox"/> insertion point)
    var existingHboxes = Array.from(this.querySelectorAll(":scope > hbox"));
    for (var h = 0; h < existingHboxes.length; h++) {
      row3.appendChild(existingHboxes[h]);
    }

    rows.appendChild(row3);
    grid.appendChild(rows);
    tabbox.appendChild(grid);

    this.appendChild(tabbox);
  }

  disconnectedCallback() {
    // Destructor: remove DOMTitleChanged listeners from all editor panels
    if (this.mTabpanels) {
      const editors = this.mTabpanels.childNodes;
      for (var i = 0; i < editors.length; i++) {
        editors[i].firstChild.removeEventListener("DOMTitleChanged", this.changeTabTitle, false);
      }
    }
  }

  // --- Helper to find anonymous-content children by anonid ---
  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  // --- Properties (read-only getters for internal elements) ---
  get mHruler() {
    return this.getChild("hruler");
  }

  get mVruler() {
    return this.getChild("vruler");
  }

  get mTabbox() {
    return this.getChild("EditorTabbox");
  }

  get mTabs() {
    return this.getChild("EditorTabs");
  }

  get mTabpanels() {
    return this.getChild("EditorTabpanels");
  }

  // --- selectedTab property (read/write) ---
  get selectedTab() {
    return this.mTabbox.selectedTab;
  }

  set selectedTab(val) {
    this.mTabbox.selectedTab = val;
  }

  // --- selectedIndex property (read/write) ---
  get selectedIndex() {
    return this.mTabbox.selectedIndex;
  }

  set selectedIndex(val) {
    this.mTabbox.selectedIndex = val;
  }

  // --- Methods copied verbatim from XBL ---

  addEditor(aTitle, aURL) {
    function EditorContentListener(aTabeditor, aEditor, aURL, aTab)
    {
      this.init(aTabeditor, aEditor, aURL, aTab);
    }

    EditorContentListener.prototype = {
      init : function(aTabeditor, aEditor, aURL, aTab)
        {
          this.mTabeditor = aTabeditor;
          this.mEditor = aEditor;
          this.mURL = aURL;
          this.mTab = aTab;
        },

      QueryInterface : function(aIID)
        {
          if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
              aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
              aIID.equals(Components.interfaces.nsISupports))
            return this;
          throw Components.results.NS_NOINTERFACE;
        },

      onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
      {
        const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;

        var progress = document.getElementById("progress");
        var statusbarDeck = document.getElementById("statusbarDeck");

        if (aStateFlags & nsIWebProgressListener.STATE_IS_REQUEST)
        {
          if (aStateFlags & nsIWebProgressListener.STATE_START)
          {
            this._requestsStarted++;
          }
          else if (aStateFlags & nsIWebProgressListener.STATE_STOP)
          {
            this._requestsFinished++;
          }
          if (this._requestsStarted > 1)
          {
            var value = (100 * this._requestsFinished) / this._requestsStarted;
            if (progress)
            {
              progress.setAttribute("mode", "determined");
              progress.setAttribute("value", value + "%");
            }
          }
        }

        if (aStateFlags & nsIWebProgressListener.STATE_IS_NETWORK)
        {
          if (aStateFlags & nsIWebProgressListener.STATE_START)
          {
            if (statusbarDeck)
              statusbarDeck.selectedPanel = document.getElementById("progressBar");
            if (progress)
              progress.setAttribute("style", "");
          }
          else if (aStateFlags & nsIWebProgressListener.STATE_STOP)
          {
            if (this._requestsStarted
                && this._requestsFinished
                && this._requestsStarted == this._requestsFinished ) { // finished !
              this.mEditorSheets = false;
            }
            if (progress)
              progress.setAttribute("style", "display: none");
            this.onStatusChange(aWebProgress, aRequest, 0, "Done");
            this._requestsStarted = this._requestsFinished = 0;

            this.mTab.removeAttribute("busy");
            try {
              var thisURI = Components.classes["@mozilla.org/network/io-service;1"]
                                      .getService(Components.interfaces.nsIIOService)
                                      .newURI(this.mURL, null, null);
              var scheme = thisURI.scheme;
              if (scheme == "resource")
                this.mTab.setAttribute("image", "chrome://mozapps/skin/places/defaultFavicon.png");
              else {
                this.mTab.setAttribute("image", thisURI.prePath + "/favicon.ico");
              }
            }
            catch(e) {}

            if (statusbarDeck)
              statusbarDeck.selectedPanel = document.getElementById("editorBar");

            var editor = this.mEditor.getEditor(this.mEditor.contentWindow);
            if (editor) {
              var valueArray = [];
              if (!Services.prefs.getBoolPref("bluegriffon.display.comments"))
                valueArray.push("comment");
              if (!Services.prefs.getBoolPref("bluegriffon.display.php"))
                valueArray.push("php");
              if (!Services.prefs.getBoolPref("bluegriffon.display.pi"))
                valueArray.push("pi");
              var value = valueArray.join(" ");
              editor.document.documentElement.setAttribute("_moz_hide", value);

              MakePhpAndCommentsVisible(editor.document);
              editor.resetModificationCount();
              editor.transactionManager.clear();

              var links = editor.document.querySelectorAll("link");
              for (var i = 0; i < links.length; i++) {
                var l = links[i];
                var rel = l.getAttribute("rel").toLowerCase();
                if (rel == "shortcut icon"
                    || rel == "icon") {
                  this.mTab.setAttribute("image", l.href);
                }
              }
              if (UrlUtils.isUrlOfBlankDocument(editor.document.QueryInterface(Components.interfaces.nsIDOMHTMLDocument).URL)) {
                var authorMeta = editor.document.querySelector("meta[name='author']");
                if (!authorMeta)
                  try {
                    // add author's meta
                    var author = GetPrefs().getComplexValue("bluegriffon.author",
                                                            Components.interfaces.nsISupportsString).data;
                    if (author) {
                      var meta = editor.document.createElement("meta");
                      meta.setAttribute("name", "author");
                      meta.setAttribute("content", author);
                      editor.document.querySelector("head").appendChild(meta);
                    }
                  }
                  catch(e) {}
              }

              try {
                var returnKeyInPCreatesP = GetPrefs().getBoolPref("bluegriffon.returnKey.createsParagraph");
                editor.returnInParagraphCreatesNewParagraph = returnKeyInPCreatesP;
              }
              catch(e) {}
            }
            if (editor && !this.mEditorSheets)
            {
              this.mEditorSheets = true;
              editor instanceof Components.interfaces.nsIPlaintextEditor;
              editor instanceof Components.interfaces.nsIHTMLEditor;
              editor instanceof Components.interfaces.nsIEditor;
              editor instanceof Components.interfaces.nsIEditorStyleSheets;

              editor.addOverrideStyleSheet("chrome://bluegriffon/content/EditorAllTags.css");
              editor.enableStyleSheet("chrome://bluegriffon/content/EditorAllTags.css", false);
              editor.addOverrideStyleSheet("chrome://bluegriffon/content/EditorContentAnchors.css");
              if (Services.prefs.getBoolPref("bluegriffon.display.anchors")) {
                if (editor.document) // sanity case
                  editor.document.documentElement.setAttribute("_moz_showanchors", "true");
              }
              editor.addOverrideStyleSheet("chrome://bluegriffon/content/EditorContent.css");
              editor.addOverrideStyleSheet("chrome://bluegriffon/content/EditorOverride.css");

              editor.selection.QueryInterface(Components.interfaces.nsISelectionPrivate)
                .addSelectionListener(ComposerCommands.selectionListener);
              editor.addEditorObserver(ComposerCommands.selectionListener);
              editor.addEditorMouseObserver(ComposerCommands.selectionListener);
              editor.transactionManager
                .AddListener(ComposerCommands.selectionListener);
              editor.transactionManager
                .AddListener(liveViewTransactionListener);
            }
            if (editor &&
                "ActiveViewManager" in window &&
                aStateFlags & nsIWebProgressListener.STATE_IS_WINDOW)
            {
              ActiveViewManager.newDocument(this.mEditor);
            }
          }
          if (editor && editor.document) {
            try {
              var charset = "";

              var metas = editor.document.querySelectorAll("meta");
              for (var i = 0; !charset && i < metas.length; i++) {
                var meta = metas[i];
                if (meta.getAttribute("http-equiv")
                    && meta.getAttribute("http-equiv").toLowerCase() == "content-type") {
                  var match = meta.getAttribute("content").match( /charset\s*=\s*(.*)$/i );
                  if (match)
                    charset = match[1].trim();
                } else if (meta.hasAttribute("charset"))
                  charset = meta.getAttribute("charset");
              }
              if (!charset) {
                // do we deal with a newly created document?
                if (this.mURL.substr(0, 11) == "resource://")
                  charset = "UTF-8";
                else
                  charset = this.mEditor.docShell.charset;
              }

              editor.documentCharacterSet = charset;

              var metaElts = editor.document.querySelectorAll('meta');
              if (metaElts && metaElts.length) {
                for (var i = 0; i < metaElts.length; i++) {
                  var m = metaElts[i];
                  if ((m.hasAttribute("http-equiv") && m.getAttribute("http-equiv").toLowerCase() == "content-type")
                      || m.hasAttribute("charset"))
                    m.parentNode.removeChild(m);
                }
              }
              var meta = editor.document.createElement("meta");
              var head = editor.document.querySelector("head");
              if (editor.document.doctype
                  && editor.document.doctype.publicId == ""
                  && editor.document.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml") { // XHTML5
                meta.setAttribute("charset", charset);
                head.insertBefore(meta, head.firstChild);
              }
              else {
                meta.setAttribute("http-equiv", "content-type");
                var doctype = editor.document.doctype;
                var systemId = doctype ? doctype.systemId : null;
                var isXML = false;
                switch (systemId) {
                  case "http://www.w3.org/TR/html4/strict.dtd": // HTML 4
                  case "http://www.w3.org/TR/html4/loose.dtd":
                  case "http://www.w3.org/TR/REC-html40/strict.dtd":
                  case "http://www.w3.org/TR/REC-html40/loose.dtd":
                    isXML = false;
                    break;
                  case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd": // XHTML 1
                  case "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd":
                  case "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd":
                    isXML = true;
                    break;
                  case "":
                  case "about:legacy-compat":
                    isXML = (editor.document.documentElement.getAttribute("xmlns") == "http://www.w3.org/1999/xhtml");
                    break;
                  case null:
                    isXML = (editor.document.compatMode == "CSS1Compat");
                    break;
                }
                meta.setAttribute("content", (isXML ? "application/xhtml+xml" : "text/html") + "; charset=" + charset);
                head.insertBefore(meta, head.firstChild);
              }

              editor.resetModificationCount();
              editor.transactionManager.clear();

            }
            catch(e) {
              // uncomment the following line only for debuggin reasons
              // alert("tabeditor: " + e);
            }

            window.updateCommands("navigation");
            window.updateCommands("create");

            NotifierUtils.notify("tabCreated");
            RecentPagesHandler.saveRecentFilesPrefs();
            RecentPagesHandler.buildRecentPagesMenu();
            editor.beginningOfDocument();
            // force editor to acquire focus and show caret... workaround for bug 351
            gDialog["menulist-zoompanel"].focus();
            this.mEditor.contentWindow.focus();
            editor.resetModificationCount();
            editor.transactionManager.clear();
          }
        }
      },


      onProgressChange : function(aWebProgress, aRequest,
                                  aCurSelfProgress, aMaxSelfProgress,
                                  aCurTotalProgress, aMaxTotalProgress)
        {
        },

      onLocationChange : function(aWebProgress, aRequest, aLocation)
        {
        },

      onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
        {
          var status = document.getElementById("status");
          if (status) status.setAttribute("label", aMessage);
        },

      onSecurityChange : function(aWebProgress, aRequest, aState)
        {
        },

          _requestsStarted: 0,
          _requestsFinished: 0,

          mTabeditor: null,
          mEditor: null,
          mEditorSheets: true,
          mURL: null,
          mTab: null
    };

    this.mHruler.removeAttribute("disabled");
    this.mHruler.addObject("foo", 50, 200);
    this.mVruler.removeAttribute("disabled");

    var newBox = this._newEditor();
    var newEditorElement = newBox.firstChild;

    var newTab = this.mTabs.appendItem(aTitle,
                   UrlUtils.stripUsernamePassword(aURL, null, null));
    newTab.setAttribute("label", aTitle);
    newTab.setAttribute("context", "tabContextPopup");
    newTab.setAttribute("class", "tabeditor-tab");
    newTab.setAttribute("maxwidth", 200);
    newTab.setAttribute("width", 0);
    newTab.setAttribute("minwidth", 30);
    newTab.setAttribute("flex", 100);
    newTab.setAttribute("crop", "end");
    newTab.setAttribute("busy", "true");
    newTab.setAttribute("tooltip", "tab-tooltip");

    this.mTabpanels.appendChild(newBox);

    newEditorElement.makeEditable("html", true);

    var docShell = newEditorElement.docShell;
    var progress = docShell.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebProgress);
    var progressListener = new EditorContentListener(this, newEditorElement, aURL, newTab);
    progress.addProgressListener(progressListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);

    var _self = this;
    newEditorElement.addEventListener("load", function(evt) {
        if (evt.originalTarget == GetWindowContent().document){ _self.finishInstall(progressListener); } }, true);
    newEditorElement.addEventListener("DOMTitleChanged", this.changeTabTitle, false);

    newEditorElement.addEventListener("dblclick", function(evt) { OnDoubleClick(evt) }, true);
    newEditorElement.addEventListener("click", function(evt) { OnClick(evt) }, true);

    // select that new tab
    this.selectedTab = newTab;
    this.selectedIndex = this.mTabpanels.childNodes.length - 1;
    window.EditorLoadUrl(newEditorElement, aURL);

    this.setAttribute("visibility", "visible");
    ComposerCommands.setupFormatCommands();

    return {tab: newTab, panel: newEditorElement};
  }

  enableRulers(aEnabled) {
    if (aEnabled) {
      this.mHruler.removeAttribute("disabled");
      this.mVruler.removeAttribute("disabled");
    }
    else {
      this.mHruler.setAttribute("disabled", "true");
      this.mVruler.setAttribute("disabled", "true");
    }
  }

  finishInstall(aPL) {
    aPL.onStateChange(null, null, Components.interfaces.nsIWebProgressListener.STATE_STOP |
                                  Components.interfaces.nsIWebProgressListener.STATE_IS_NETWORK,
                      null);
  }

  changeTabTitle(aEvent) {
    var e     = aEvent.currentTarget;
    if (!e)
      return;

    var tabeditor = gDialog.tabeditor;
    var tabs      = tabeditor.mTabs.childNodes;
    var editors   = tabeditor.mTabpanels.childNodes;
    var l = editors.length;
    for (var i = 0; i < l; i++)
    {
      if (editors.item(i).firstChild == e)
      {
        var tab = tabs.item(i);
        var title = UpdateWindowTitle(e);
        if (title)
          tab.label = title;
        return;
      }
    }
  }

  stopWebNavigation() {
    var editor = this.getCurrentEditorElement();
    var tab    = this.selectedTab;
    if (tab.hasAttribute("busy"))
      editor.webNavigation.stop(Components.interfaces.nsIWebNavigation.STOP_ALL);
  }

  _installBespin(aIframe) {
    var _self = this;
    aIframe.removeEventListener("pageshow", function() {_self._installBespin(aIframe);}, true);

    gDialog.sourceModeButton.removeAttribute("busy");
    window.updateCommands("mode_switch");
  }

  _newEditor() {
    var editors = this.mTabpanels.childNodes;
    for (var i = 0; i < editors.length; i++)
      editors.item(i).firstChild.removeAttribute("type");

    var newBox = document.createXULElement("deck");
    newBox.setAttribute("anonid", "editorDeck");

    var newEditorElement = document.createXULElement("editor");
    newEditorElement.setAttribute("context", "editorContextMenu");
    newEditorElement.setAttribute("type", "content-primary");
    newBox.appendChild(newEditorElement);

    var splitter = document.createXULElement("splitter");
    splitter.className = "liveViewSplitter";
    newBox.appendChild(splitter);

    var iframe = document.createXULElement("iframe");
    var _self = this;
    gDialog.sourceModeButton.setAttribute("busy", "true");
    iframe.addEventListener("load", function() {_self._installBespin(iframe);}, true);
    iframe.setAttribute("type", "chrome");
    iframe.setAttribute("src", "resource://gre/res/cm2.html");
    newBox.appendChild(iframe);

    newBox.setAttribute("selectedIndex", "1");

    newEditorElement.addEventListener("focus", function() { WysiwygLiveViewEditorFocused(false); },  true);
    iframe.addEventListener("focus", function() { SourceLiveViewEditorFocused(); },  true);
    return newBox;
  }

  getCurrentEditorElement() {
    if (this.mTabpanels.childNodes
        && this.mTabpanels.childNodes.length
        && this.mTabpanels.selectedPanel)
      return this.mTabpanels.selectedPanel.firstChild;
    return null;
  }

  IsDocumentAlreadyEdited(aURL) {
    var editors = this.mTabpanels.childNodes;
    for (var i = 0; i < editors.length; i++)
    {
      var editorElt = editors.item(i).firstChild;
      var editor = editorElt.getEditor(editorElt.contentWindow);
      if (editor.document.URL == aURL)
        return editorElt;
    }
    return null;
  }

  onTabSelected(aEvent, aTabeditor) {
    var activeSourceDeck = document.getElementById("sourceTreeDeck");
    if (activeSourceDeck &&
        aTabeditor.selectedIndex < activeSourceDeck.childNodes.length)
      activeSourceDeck.selectedIndex = aTabeditor.selectedIndex;

    var editors = this.mTabpanels.childNodes;
    for (var i = 0; i < editors.length; i++)
      editors.item(i).firstChild.removeAttribute("type");

    this.getCurrentEditorElement().setAttribute("type", "content-primary");
    GetWindowContent().focus();

    window.UpdateWindowTitle();

    NotifierUtils.notify("tabSelected");
    var deck = this.getCurrentEditorElement().parentNode;
    var mode = deck.getAttribute("previousMode") || "wysiwyg";
    deck.selectedIndex = (mode == "source") ? 1 : 0;
    gDialog.bespinToolbox1.hidden = true;
    gDialog.bespinToolbox2.hidden = true;
    if (mode == "source") {
      gDialog.liveViewModeButton.removeAttribute("selected");
      gDialog.wysiwygModeButton.removeAttribute("selected");
      gDialog.sourceModeButton.setAttribute("selected", "true");
      gDialog.printPreviewModeButton.removeAttribute("selected");
      gDialog.structurebar.style.visibility = "hidden";
      HandlersManager.hideAllHandlers();
      gDialog.tabeditor.enableRulers(false);
      deck.lastElementChild.focus();
    }
    else if (mode == "liveview") {
      gDialog.liveViewModeButton.setAttribute("selected", "true");
      gDialog.wysiwygModeButton.removeAttribute("selected");
      gDialog.sourceModeButton.removeAttribute("selected");
      gDialog.printPreviewModeButton.removeAttribute("selected");

      HandlersManager.hideAllHandlers();
      gDialog.tabeditor.enableRulers(false);

      var liveviewmode = deck.getAttribute("liveviewmode") || "wysiwyg";
      if (liveviewmode == "source") {
        gDialog.structurebar.style.visibility = "hidden";
      }
      else {
        gDialog.structurebar.style.visibility = "";
        deck.firstElementChild.focus();
        var selcon = EditorUtils.getSelectionContainer();
        if (selcon) {
          NotifierUtils.notify("selection", selcon.node, true)
          gDialog.structurebar.selectionChanged(null, selcon.node,
                                                selcon.oneElementSelected);
        }
      }
    }
    else {
      gDialog.tabeditor.enableRulers(true);
      gDialog.liveViewModeButton.removeAttribute("selected");
      var wysiwygmedium = deck.getAttribute("wysiwygmedium");
      if (wysiwygmedium == "print") {
        gDialog.printPreviewModeButton.setAttribute("selected", "true");
        gDialog.wysiwygModeButton.removeAttribute("selected");
      }
      else {
        gDialog.wysiwygModeButton.setAttribute("selected", "true");
        gDialog.printPreviewModeButton.removeAttribute("selected");
      }
      gDialog.sourceModeButton.removeAttribute("selected");
      gDialog.structurebar.style.visibility = "";
      deck.firstChild.focus();
      var selcon = EditorUtils.getSelectionContainer();
      if (selcon) {
        NotifierUtils.notify("selection", selcon.node, true)
        gDialog.structurebar.selectionChanged(null, selcon.node,
                                              selcon.oneElementSelected);
      }
    }
    window.updateCommands("navigation");
    window.updateCommands("style");
  }

  _trimTrailingSlash(aURL) {
    if (!aURL)
      return aURL;
    if (aURL.charAt(aURL.length - 1) == "/")
      return aURL.substr(0, aURL.length - 1);
    return aURL;
  }

  isAlreadyEdited(aURL) {
    // always accept a new blank document
    if (UrlUtils.isUrlOfBlankDocument(aURL))
      return null;

    var editors = this.mTabpanels.childNodes;
    var i, l = editors.length;
    for (i=0; i< l; i++)
    {
      var e = editors[i].firstChild;
      var elt = e.getEditor(e.contentWindow);
      if (elt &&
          this._trimTrailingSlash(elt.document.URL) == this._trimTrailingSlash(aURL))
        return { index: i, editor: e };
    }
    return null;
  }

  showCurrentTabAsModified(val) {
    if (val)
      this.selectedTab.setAttribute("modified", "true");
    else
      this.selectedTab.removeAttribute("modified");
  }

  getNumberOfModifiedDocuments(val) {
    var tabs = this.mTabs.childNodes;
    var n = 0;
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs.item(i)
      if (tab.hasAttribute("modified"))
        n++;
    }

    return n;
  }

  updateOSXCloseButton() {
    var baseWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                           .getInterface(Components.interfaces.nsIWebNavigation)
                           .QueryInterface(Components.interfaces.nsIBaseWindow);
    var badger = Components.classes["@disruptive-innovations.com/osintegration/badger;1"]
                           .createInstance(Components.interfaces.diIOSIntegration);
    var modifiedDocuments = this.getNumberOfModifiedDocuments();
    badger.setDocumentEdited(baseWindow, (0 != modifiedDocuments));
  }
}

// Register the custom element
customElements.define("bg-tabeditor", BGTabEditor);
