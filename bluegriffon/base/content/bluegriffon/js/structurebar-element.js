/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * structurebar-element.js: Custom Element replacement for XBL binding
 * structurebar.xml#structurebar (XBL removed in Gecko ESR 140).
 * Originally extended arrowscrollbox; now a standalone custom element.
 *
 * ***** END LICENSE BLOCK ***** */

// Custom Element: <bg-structurebar>
// Replaces XBL binding from bindings/structurebar.xml
// Resolve the base class before the class declaration to avoid
// optional-chaining syntax issues in the extends clause.
const _ArrowScrollBoxCtor = customElements.get("arrowscrollbox") || XULElement;

class BGStructureBar extends _ArrowScrollBoxCtor {

  constructor() {
    super();
    this.mLastNode = null;
    this.mOneElementSelected = false;
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  // Called from bluegriffon.js to register for selection notifications
  init() {
    NotifierUtils.addNotifierCallback("selection_strict", this.selectionChanged, this);
  }

  shutdown() {
    NotifierUtils.removeNotifierCallback("selection_strict", this.selectionChanged, this);
  }

  selectionChanged(aArguments, aNode, aOneElementSelected) {
    this.mOneElementSelected = aOneElementSelected;

    var node = aNode;
    // Skip XUL namespace elements
    while (node && node.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul")
      node = node.parentNode;
    // For SVG, walk up to container
    while (node && node.parentNode &&
           node.namespaceURI == "http://www.w3.org/2000/svg" &&
           node.parentNode.namespaceURI == "http://www.w3.org/2000/svg")
      node = node.parentNode;
    if (node != aNode) {
      EditorUtils.getCurrentEditor().selectElement(node);
      return;
    }

    var toolbarbutton;
    if (this.mLastNode == node) {
      // Avoid rebuilding the whole structure toolbar if possible
      toolbarbutton = this.lastChild;
      while (node && toolbarbutton &&
             node == toolbarbutton.getUserData("node") &&
             node.nodeName.toLowerCase() != "html") {
        node = node.parentNode;
        toolbarbutton = toolbarbutton.previousSibling;
      }
      // Rebuild only from toolbarbutton up to the root
      if (aOneElementSelected)
        toolbarbutton.setAttribute("checked", "true");
      else
        toolbarbutton.removeAttribute("checked");
    }
    else {
      // The deepest node changed, clear all
      this.mLastNode = node;
      toolbarbutton = this.lastChild;
    }

    while (toolbarbutton) {
      var tmp = toolbarbutton.previousSibling;
      if (toolbarbutton.localName == "toolbarbutton")
        this.removeChild(toolbarbutton);
      toolbarbutton = tmp;
    }

    var prefs = GetPrefs();
    var showIDs = true;
    var showClasses = true;
    var showLang = false;
    var showRole = true;
    try {
      showIDs = prefs.getBoolPref("bluegriffon.structurebar.id.show");
    } catch(e) {}
    try {
      showClasses = prefs.getBoolPref("bluegriffon.structurebar.class.show");
    } catch(e) {}
    try {
      showLang = prefs.getBoolPref("bluegriffon.structurebar.lang.show");
    } catch(e) {}
    try {
      showRole = prefs.getBoolPref("bluegriffon.structurebar.role.show");
    } catch(e) {}

    while (node.nodeName.toLowerCase() != "html") {
      var newLabel = document.createElement("toolbarbutton");

      var isBlueGriffonNS = (node.namespaceURI == "http://disruptive-innovations.com/zoo/bluegriffon");

      var text = (isBlueGriffonNS ? "" : "<")
                 + node.nodeName.toLowerCase();
      if (!isBlueGriffonNS && showIDs && node.id)
        text += " #" + node.id;
      if (!isBlueGriffonNS && showClasses && node.hasAttribute("class"))
        text += " ." + node.getAttribute("class").replace( / /g, ".");
      if (!isBlueGriffonNS && showLang && node.hasAttribute("lang"))
        text += " :lang(" + node.getAttribute("lang") + ")";
      if (!isBlueGriffonNS && showRole) {
        if (node.hasAttribute("role"))
          text += " :role(" + node.getAttribute("role") + ")";
        else {
          var lookForEpubType = Services.prefs.getBoolPref("bluegriffon.aria.epub-type") &&
                                EditorUtils.isXHTMLDocument() &&
                                node.hasAttributeNS("http://www.idpf.org/2007/ops", "type");
          if (lookForEpubType)
            text += " :role(" + node.getAttributeNS("http://www.idpf.org/2007/ops", "type") + ")";
        }
      }
      text += (isBlueGriffonNS ? "" : ">");

      newLabel.setAttribute("label", text);
      if (aOneElementSelected && aNode == node)
        newLabel.setAttribute("checked", "true");

      newLabel.setUserData("node", node, null);
      newLabel.setAttribute("value", node.nodeName.toLowerCase());
      newLabel.setAttribute("context", "structureBarContextMenu");
      newLabel.setAttribute("oncommand", "this.parentNode.selectNode(this)");

      this.insertBefore(newLabel, this.firstChild);

      node = node.parentNode;
    }

    // Make sure the deepest element is visible
    var lastButton = this.lastChild.previousSibling;
    if (lastButton && typeof this.ensureElementIsVisible === "function")
      this.ensureElementIsVisible(lastButton);
  }

  selectNode(aNode) {
    var editor = EditorUtils.getCurrentEditor();
    var node = aNode.getUserData("node");
    if (editor && node)
      editor.selectElement(node);
  }
}

// Register the custom element only if not already defined
if (!customElements.get("bg-structurebar")) {
  customElements.define("bg-structurebar", BGStructureBar);
}
