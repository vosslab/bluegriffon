/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * tab-element.js: Custom Element replacement for XBL binding
 * tab.xml#bluegriffon-editortab (XBL removed in Gecko ESR 140).
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
 * ***** END LICENSE BLOCK ***** */

// Custom Element: <tabeditor-tab>
// Replaces XBL binding from bindings/tab.xml#bluegriffon-editortab
//
// The XBL binding extended chrome://global/content/bindings/tabbox.xml#tab
// and defined anonymous content: image + label + close toolbarbutton.
// In the Custom Element version the anonymous content is created in
// connectedCallback() using document.createXULElement().
class BGEditorTab extends XULElement {

  constructor() {
    super();
    // XBL field: mOverCloseButton
    this.mOverCloseButton = false;
  }

  connectedCallback() {
    // Only build the inner elements once
    if (this._initialized) {
      return;
    }
    this._initialized = true;

    // --- Create anonymous content formerly defined in XBL <content> ---

    // Tab icon image
    var img = document.createXULElement("image");
    img.setAttribute("imagetheming", "never");
    img.setAttribute("class", "tab-icon-image");
    // Inherit the "image" attribute from the host as "src"
    if (this.hasAttribute("image")) {
      img.setAttribute("src", this.getAttribute("image"));
    }
    // Inherit validate attribute
    if (this.hasAttribute("validate")) {
      img.setAttribute("validate", this.getAttribute("validate"));
    }
    this.appendChild(img);

    // Tab label
    var label = document.createXULElement("label");
    label.setAttribute("flex", "1");
    label.setAttribute("class", "tab-text");
    label.setAttribute("style",
      "-moz-user-focus: ignore; -moz-user-select:none");
    // Inherit label, crop, accesskey from the host element
    if (this.hasAttribute("label")) {
      label.setAttribute("value", this.getAttribute("label"));
    }
    if (this.hasAttribute("crop")) {
      label.setAttribute("crop", this.getAttribute("crop"));
    }
    if (this.hasAttribute("accesskey")) {
      label.setAttribute("accesskey", this.getAttribute("accesskey"));
    }
    this.appendChild(label);

    // Close button
    var closeBtn = document.createXULElement("toolbarbutton");
    closeBtn.setAttribute("anonid", "close-button");
    closeBtn.setAttribute("tabindex", "-1");
    closeBtn.setAttribute("class", "tab-close-button");
    closeBtn.setAttribute("imagetheming", "never");
    // Wire up the close action
    var self = this;
    closeBtn.addEventListener("command", function() {
      self.CloseTab(self);
    });
    this.appendChild(closeBtn);

    // Set up a mutation observer to sync inherited attributes
    this._attrObserver = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        var attrName = mutation.attributeName;
        if (attrName === "image") {
          img.setAttribute("src", self.getAttribute("image") || "");
        } else if (attrName === "label") {
          label.setAttribute("value", self.getAttribute("label") || "");
        } else if (attrName === "crop") {
          label.setAttribute("crop", self.getAttribute("crop") || "");
        }
      }
    });
    this._attrObserver.observe(this, { attributes: true });
  }

  disconnectedCallback() {
    // Disconnect the attribute observer to avoid leaks
    if (this._attrObserver) {
      this._attrObserver.disconnect();
      this._attrObserver = null;
    }
  }

  // XBL method: CloseTab
  CloseTab(aTab) {
    cmdCloseTab.doCommand();
  }
}

// Register the custom element only if not already defined
if (!customElements.get("tabeditor-tab")) {
  customElements.define("tabeditor-tab", BGEditorTab);
}
