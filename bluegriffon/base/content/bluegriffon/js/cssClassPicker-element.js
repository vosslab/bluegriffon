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
 * Portions created by the Initial Developer are Copyright (C) 2010
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

// Custom Element: <bg-cssclasspicker>
// Replaces XBL binding from bindings/cssClassPicker.xml

class BGCssClassPicker extends XULElement {

  constructor() {
    super();
  }

  connectedCallback() {
    // Build anonymous content (no Shadow DOM)
    if (!this.querySelector('[anonid="checkbox"]')) {
      // Checkbox
      let checkbox = document.createXULElement("checkbox");
      checkbox.setAttribute("label", this.getAttribute("reuselabel") || "");
      checkbox.setAttribute("anonid", "checkbox");
      checkbox.addEventListener("command", () => { this.toggle(checkbox); });
      this.appendChild(checkbox);

      // Menulist with menupopup
      let menulist = document.createXULElement("menulist");
      menulist.setAttribute("anonid", "menulist");
      menulist.setAttribute("editable", "true");
      menulist.setAttribute("style", "min-width: 7em");
      if (this.hasAttribute("disabled")) {
        menulist.setAttribute("disabled", this.getAttribute("disabled"));
      }
      let menupopup = document.createXULElement("menupopup");
      menupopup.setAttribute("anonid", "menupopup");
      menulist.appendChild(menupopup);
      this.appendChild(menulist);
    }

    // Constructor logic: import modules and populate class list
    var { EditorUtils } = ChromeUtils.importESModule("resource://gre/modules/editorHelper.sys.mjs");
    var { CssUtils } = ChromeUtils.importESModule("resource://gre/modules/cssHelper.sys.mjs");
    var classes = CssUtils.getAllClassesForDocument(EditorUtils.getCurrentDocument());
    classes.sort();
    for (var i = 0; i < classes.length; i++) {
      this.getChild("menulist").appendItem(classes[i], classes[i]);
    }

    var elts = document.getElementsByAttribute("mainCheckbox", "true");
    for (var i = 0; i < elts.length; i++) {
      var e = elts[i];
      e.setAttribute("oncommand", e.getAttribute("oncommand") +
                                  "; gDialog.cssClassPicker.toggleCssProperty(this)");
      this.toggleCssProperty(e);
    }
    this.getChild("menulist").disabled = true;
  }

  // --- Helper ---

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  // --- Properties ---

  get checked() {
    return this.getChild("checkbox").checked;
  }

  set checked(val) {
    var e = this.getChild("checkbox");
    e.checked = val;
    this.toggle(e);
  }

  get value() {
    return this.getChild("menulist").value;
  }

  set value(val) {
    this.getChild("menulist").value = val;
  }

  // --- Methods ---

  toggleCssProperty(aCheckbox) {
    var checked = aCheckbox.checked;
    var parent = aCheckbox.parentNode;
    var elts = parent.getElementsByClassName("disableOnClass");
    for (var i = 0; i < elts.length; i++)
      if (checked || elts[i].hasAttribute("mainCheckbox"))
        elts[i].removeAttribute("disabled");
      else
        elts[i].setAttribute("disabled", "true");
  }

  toggle(aElt) {
    var allElements = document.getElementsByClassName("disableOnClass");
    var checked = aElt.checked;
    if (checked) {
      for (var i = 0; i < allElements.length; i++) {
        var e = allElements[i];
        if (e.hasAttribute("mainCheckbox"))
          e.checked = false;
        e.setAttribute("disabled", "true");
      }
    }
    else {
      for (var i = 0; i < allElements.length; i++) {
        var e = allElements[i];
        if (e.hasAttribute("mainCheckbox"))
           e.removeAttribute("disabled");
      }
    }

    this.getChild("menulist").disabled = !checked;
  }
}

// Register only if not already defined
if (!customElements.get("bg-cssclasspicker")) {
  customElements.define("bg-cssclasspicker", BGCssClassPicker);
}
