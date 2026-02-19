/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * lengthbox-element.js: Custom Element replacement for XBL binding
 * lengthbox.xml#lengthbox (XBL removed in Gecko ESR 140).
 *
 * The Original Code is BlueGriffon.
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (daniel.glazman@disruptive-innovations.com), Original Author
 *
 * ***** END LICENSE BLOCK ***** */

// Custom Element: <bg-lengthbox>
// Replaces XBL binding from bindings/lengthbox.xml
class BGLengthBox extends XULElement {

  constructor() {
    super();
    this.extraValues = [];
  }

  connectedCallback() {
    // Build anonymous content: menulist + spinbuttons
    if (!this.querySelector('[anonid="textbox"]')) {
      var menulist = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menulist");
      menulist.setAttribute("anonid", "textbox");
      menulist.setAttribute("editable", "true");
      menulist.setAttribute("sizetopopup", "none");
      // Wire up input and command handlers
      menulist.setAttribute("oninput", "this.parentNode.onInput()");
      menulist.setAttribute("oncommand", "this.parentNode.onCommand(event)");
      // Inherit value and disabled from the host element
      if (this.hasAttribute("value"))
        menulist.setAttribute("value", this.getAttribute("value"));
      if (this.hasAttribute("disabled"))
        menulist.setAttribute("disabled", this.getAttribute("disabled"));

      var menupopup = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menupopup");
      menupopup.setAttribute("onpopupshowing",
        "this.parentNode.parentNode.updateMenulist(this)");
      menulist.appendChild(menupopup);

      var spinbuttons = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "spinbuttons");
      spinbuttons.setAttribute("anonid", "spinbuttons");
      spinbuttons.setAttribute("onup", "this.parentNode.onUp()");
      spinbuttons.setAttribute("ondown", "this.parentNode.onDown()");
      if (this.hasAttribute("disabled"))
        spinbuttons.setAttribute("disabled", this.getAttribute("disabled"));

      this.appendChild(menulist);
      this.appendChild(spinbuttons);
    }
  }

  get value() {
    return this.getChild("textbox").value;
  }

  set value(val) {
    this.getChild("textbox").value = val;
  }

  onCommand(aEvent) {
    var value = aEvent.originalTarget.getAttribute("value");
    this.getChild("textbox").value = value;
    this.onInput();
  }

  onInput() {
    var value = this.getChild("textbox").value;
    var valueNumber = parseFloat(value);
    if (isNaN(valueNumber)) {
      this.getChild("spinbuttons").disabled = true;
    }
    else {
      this.getChild("spinbuttons").disabled = false;
    }
  }

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  updateMenulist(aPopup) {
    var menulist = aPopup.parentNode;
    deleteAllChildren(aPopup);

    var unitsArray = this.getAttribute("units").split(",");
    var value = this.getChild("textbox").value;
    var valueNumber = parseFloat(value);
    if (isNaN(valueNumber))
      valueNumber = 0;

    for (var i = 0; i < unitsArray.length; i++) {
      var unit = unitsArray[i];
      if (unit) {
        var m = document.createElement("menuitem");
        m.setAttribute("value", valueNumber + unit);
        m.setAttribute("label", valueNumber + unit);
        aPopup.appendChild(m);
      }
      else {
        var s = document.createElement("menuseparator");
        aPopup.appendChild(s);
      }
    }
    if (this.extraValues.length) {
      s = document.createElement("menuseparator");
      aPopup.appendChild(s);
    }
    for (var i = 0; i < this.extraValues.length; i++) {
      var extraValue = this.extraValues[i];
      var value = extraValue.value;
      var label = extraValue.label;
      if (value) {
        var m = document.createElement("menuitem");
        m.setAttribute("value", value);
        m.setAttribute("label", label);
        aPopup.appendChild(m);
      }
      else {
        var s = document.createElement("menuseparator");
        aPopup.appendChild(s);
      }
    }
  }

  onUp() {
    var value = this.getChild("textbox").value.toLowerCase();
    var valueNumber = parseFloat(value);
    if (isNaN(valueNumber))
      valueNumber = 0;
    var unit = value.match( /[a-z%]+$/ );
    if (!unit)
      unit = "px";
    var steps = 1;
    if (unit == "cm" || unit == "in")
      steps = 10;
    var newValue = Math.round(valueNumber*steps + 1) / steps;
    this.getChild("textbox").value = newValue + unit;
    this.onInput();
  }

  onDown() {
    var value = this.getChild("textbox").value.toLowerCase();
    var valueNumber = parseFloat(value);
    if (isNaN(valueNumber))
      valueNumber = 0;
    var unit = value.match( /[a-z%]+$/ );
    if (!unit)
      unit = "px";
    var steps = 1;
    if (unit == "cm" || unit == "in")
      steps = 10;
    var newValue = Math.round(valueNumber*steps - 1) / steps;
    if (this.getAttribute("type") == "positive")
      newValue = Math.max(newValue, 0);
    this.getChild("textbox").value = newValue + unit;
    this.onInput();
  }
}

// Register the custom element only if not already defined
if (!customElements.get("bg-lengthbox")) {
  customElements.define("bg-lengthbox", BGLengthBox);
}
