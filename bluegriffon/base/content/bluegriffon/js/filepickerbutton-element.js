/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
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
 * Portions created by the Initial Developer are Copyright (C) 2008
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

// Custom Element: <bg-filepickerbutton>
// Replaces XBL binding from bindings/filepickerbutton.xml

class BGFilePickerButton extends XULElement {

  constructor() {
    super();
    // Fields from XBL
    this.fp = null;
    this.nsIFP = Components.interfaces.nsIFilePicker;
  }

  connectedCallback() {
    // Build anonymous content (no Shadow DOM)
    if (!this.querySelector('[anonid="button"]')) {
      let btn = document.createXULElement("toolbarbutton");
      btn.setAttribute("anonid", "button");
      btn.setAttribute("imagetheming", "never");
      // Inherit disabled and tooltiptext from host
      if (this.hasAttribute("disabled")) {
        btn.setAttribute("disabled", this.getAttribute("disabled"));
      }
      if (this.hasAttribute("title")) {
        btn.setAttribute("tooltiptext", this.getAttribute("title"));
      }
      this.insertBefore(btn, this.firstChild);
    }

    // Run constructor logic: create file picker and set up filters
    this._initFilePicker();

    // Command handler: opens file picker, sets value and control
    this.addEventListener("command", this._onCommand.bind(this), true);
  }

  // --- Properties ---

  get mButton() {
    return this.querySelector('[anonid="button"]');
  }

  get value() {
    return this.getAttribute("value");
  }

  set value(val) {
    this.setAttribute("value", val);
  }

  get disabled() {
    return this.mButton.getAttribute("disabled");
  }

  set disabled(val) {
    if (val) {
      this.mButton.setAttribute("disabled", val);
      this.setAttribute("disabled", val);
    }
    else {
      this.mButton.removeAttribute("disabled");
      this.removeAttribute("disabled");
    }
  }

  // --- Constructor logic ---

  _initFilePicker() {
    var { EditorUtils } = ChromeUtils.importESModule("resource://gre/modules/editorHelper.sys.mjs");
    var { diFilePicker } = ChromeUtils.importESModule("resource://gre/modules/filePicker.sys.mjs");

    var w = EditorUtils.getCurrentEditorWindow();
    if (w &&
        "EBookManager" in w &&
        w.EBookManager.isUrlSpecInBook(EditorUtils.getDocumentUrl())) {
      try {
        this.fp = new diFilePicker();
        this.fp.init(window.browsingContext, this.getAttribute("title"),
                     parseInt(this.getAttribute("mode")));

        var w = EditorUtils.getCurrentEditorWindow();
        var epubElt = w.document.querySelector("epub2,epub3,epub31");
        var ebook = epubElt.getUserData("ebook");
        this.fp.displayDirectory = ebook.opfFile.parent.clone();

        this._applyFilters();
      }
      catch(e) {}

      return;
    }

    try {
      this.fp = Components.classes["@mozilla.org/filepicker;1"].
                  createInstance(this.nsIFP);
      this.fp.init(window.browsingContext, this.getAttribute("title"),
                   parseInt(this.getAttribute("mode")));
      this._applyFilters();
    }
    catch(e) {}
  }

  _applyFilters() {
    var filters = this.getAttribute("filters");
    if (filters) {
      var filtersArray = filters.split(",");
      for (var i = 0; i < filtersArray.length; i++) {
        var f = filtersArray[i];
        switch (f) {
          case "filterAll":     this.fp.appendFilters(this.nsIFP.filterAll); break;
          case "filterHTML":    this.fp.appendFilters(this.nsIFP.filterHTML); break;
          case "filterText":    this.fp.appendFilters(this.nsIFP.filterText); break;
          case "filterImages":  this.fp.appendFilters(this.nsIFP.filterImages); break;
          case "filterAudio":   this.fp.appendFilters(this.nsIFP.filterAudio); break;
          case "filterVideo":   this.fp.appendFilters(this.nsIFP.filterVideo); break;
          default:              this.fp.appendFilter(f, f);
        }
      }
    }
  }

  // --- Methods ---

  appendFilters(aFilter) {
    try {
      this.fp.appendFilters(aFilter);
    }
    catch(e) {}
  }

  appendFilter(aTitle, aFilter) {
    try {
      this.fp.appendFilter(aTitle, aFilter);
    }
    catch(e) {}
  }

  // --- Command handler ---

  _onCommand(event) {
    try {
      this.fp.open(function(result) {
        if (result == this.nsIFP.returnOK &&
            this.fp.fileURL.spec && this.fp.fileURL.spec.length > 0)
        {
          var spec = this.fp.fileURL.spec;
          if (this.hasAttribute("processor"))
            spec = eval(this.getAttribute("processor") + "(spec)");
          this.setAttribute("value", spec);
          if (this.hasAttribute("control"))
          {
            var c = document.getElementById(this.getAttribute("control"));
            c.inputField.value = spec;
          }
        }
      }.bind(this));
    }
    catch(e) {}
  }
}

// Register only if not already defined
if (!customElements.get("bg-filepickerbutton")) {
  customElements.define("bg-filepickerbutton", BGFilePickerButton);
}
