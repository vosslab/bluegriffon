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

// Custom Element: <bg-ecolorpicker>
// Replaces XBL binding from bindings/ecolorpicker.xml
// Handles both macOS and non-macOS platforms via runtime detection.

class BGEColorPicker extends XULElement {

  constructor() {
    super();
    // Detect macOS at runtime
    this._isMac = (navigator.platform.indexOf("Mac") !== -1);
  }

  connectedCallback() {
    // Build anonymous content (no Shadow DOM)
    if (!this.querySelector('[anonid="colorbox"]')) {
      if (this._isMac) {
        // macOS: use an HTML color input
        let colorInput = document.createElement("input");
        colorInput.setAttribute("class", "colorpicker-button-colorbox");
        colorInput.setAttribute("anonid", "colorbox");
        colorInput.setAttribute("type", "color");
        colorInput.addEventListener("input", () => {
          this.update(colorInput.value);
        });
        this.appendChild(colorInput);
      } else {
        // Non-macOS: use a XUL hbox
        let colorBox = document.createXULElement("hbox");
        colorBox.setAttribute("class", "colorpicker-button-colorbox");
        colorBox.setAttribute("anonid", "colorbox");
        colorBox.setAttribute("flex", "1");
        if (this.hasAttribute("disabled")) {
          colorBox.setAttribute("disabled", this.getAttribute("disabled"));
        }
        this.appendChild(colorBox);
      }
    }

    // Constructor logic: import ColorPickerHelper
    try {
      var { ColorPickerHelper } = ChromeUtils.importESModule("resource://gre/modules/colourPickerHelper.sys.mjs");
    } catch (e) {}

    // macOS constructor: set initial color and showTransparency on input
    if (this._isMac) {
      var colorpicker = this.getChild("colorbox");
      if (this.hasAttribute("color")) colorpicker.setAttribute("value", this.getAttribute("color"));
      if (this.hasAttribute("showTransparency")) colorpicker.setAttribute("showTransparency", this.getAttribute("showTransparency"));
    }

    // Non-macOS: click handler opens color picker
    if (!this._isMac) {
      this.addEventListener("click", this._onClick.bind(this), true);
    }
  }

  // --- Helper ---

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  // --- Properties ---

  get mColorBox() {
    return this.querySelector('[anonid="colorbox"]');
  }

  get color() {
    return this.getAttribute("color");
  }

  set color(val) {
    if (this._isMac) {
      this.getChild("colorbox").value = val;
    }
    this.setAttribute("color", val);
    this.setAttribute("tooltiptext", val);
    this.mColorBox.style.backgroundColor = val;
  }

  get disabled() {
    return this.getAttribute("disabled");
  }

  set disabled(val) {
    if (this._isMac) {
      SetEnabledElement(this.getChild("colorbox"), !val);
    }
    SetEnabledElement(this, !val);
  }

  get shownColor() {
    return this.mColorBox.style.backgroundColor;
  }

  // --- Methods ---

  open(aColorObjectId, aWindowTitle, aShowTransparency) {
    var cph = ColorPickerHelper;
    cph.openColorPicker(window, aColorObjectId, aWindowTitle, aShowTransparency);
    if (!cph.isCancelled(aColorObjectId))
    {
      var currentColor = cph.getCurrentColor(aColorObjectId)
      this.color = currentColor;
      this.mColorBox.style.backgroundColor = currentColor;
      this.setAttribute("color", currentColor);
      this.setAttribute("tooltiptext", currentColor);
    }
  }

  // macOS only: called from the color input's oninput
  update(aValue) {
    this.color = aValue;
    if (this.hasAttribute("oncommand")) {
      var fn = new Function(this.getAttribute("oncommand"));
      fn.call(this) == false;
    }
  }

  // --- Non-macOS click handler ---

  _onClick(event) {
    if (!this.getAttribute("disabled")) {
      this.open(this.getAttribute("colorObjectId"),
                this.getAttribute("windowTitle"),
                this.getAttribute("showTransparency"));
      if (this.hasAttribute("oncommand")) {
        var fn = new Function(this.getAttribute("oncommand"));
        fn.call(this) == false;
      }
    }
  }
}

// Register only if not already defined
if (!customElements.get("bg-ecolorpicker")) {
  customElements.define("bg-ecolorpicker", BGEColorPicker);
}
