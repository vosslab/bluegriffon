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

// media-element.js: Custom Element replacement for XBL bindings
// from bindings/media.xml (XBL removed in Gecko ESR 140).
//
// Defines two classes:
//   BGMedium       - the medium widget, registered as <bg-medium>
//   BGMediaLength  - the media length widget, registered as <bg-medialength>

const MEDIA_XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// =============================================================================
// BGMedium - medium custom element
// =============================================================================
class BGMedium extends XULElement {

  connectedCallback() {
    // Build anonymous content (formerly XBL <content>)
    if (!this.querySelector('[anonid="logicalMenulist"]')) {
      this.setAttribute("orient", "vertical");

      var hbox = document.createElementNS(MEDIA_XUL_NS, "hbox");

      // Logical menulist (not/only/unspecified)
      var logicalMenulist = document.createElementNS(MEDIA_XUL_NS, "menulist");
      logicalMenulist.setAttribute("anonid", "logicalMenulist");
      var logicalPopup = document.createElementNS(MEDIA_XUL_NS, "menupopup");

      var item1 = document.createElementNS(MEDIA_XUL_NS, "menuitem");
      item1.setAttribute("label", "");
      item1.setAttribute("value", "");
      logicalPopup.appendChild(item1);

      var item2 = document.createElementNS(MEDIA_XUL_NS, "menuitem");
      item2.setAttribute("label", "not");
      item2.setAttribute("value", "not");
      logicalPopup.appendChild(item2);

      var item3 = document.createElementNS(MEDIA_XUL_NS, "menuitem");
      item3.setAttribute("label", "only");
      item3.setAttribute("value", "only");
      logicalPopup.appendChild(item3);

      logicalMenulist.appendChild(logicalPopup);
      hbox.appendChild(logicalMenulist);

      // Medium menulist
      var mediumMenulist = document.createElementNS(MEDIA_XUL_NS, "menulist");
      mediumMenulist.setAttribute("anonid", "mediumMenulist");
      var mediumPopup = document.createElementNS(MEDIA_XUL_NS, "menupopup");

      var mediaTypes = [
        ["", ""],
        ["separator", null],
        ["all", "all"],
        ["separator", null],
        ["aural", "aural"],
        ["braille", "braille"],
        ["handheld", "handheld"],
        ["print", "print"],
        ["projection", "projection"],
        ["screen", "screen"],
        ["tty", "tty"],
        ["tv", "tv"]
      ];
      for (var i = 0; i < mediaTypes.length; i++) {
        if (mediaTypes[i][0] == "separator") {
          mediumPopup.appendChild(document.createElementNS(MEDIA_XUL_NS, "menuseparator"));
        } else {
          var mi = document.createElementNS(MEDIA_XUL_NS, "menuitem");
          mi.setAttribute("label", mediaTypes[i][0]);
          mi.setAttribute("value", mediaTypes[i][1]);
          mediumPopup.appendChild(mi);
        }
      }

      mediumMenulist.appendChild(mediumPopup);
      hbox.appendChild(mediumMenulist);

      // Constraint button with menupopup
      var constraintButton = document.createElementNS(MEDIA_XUL_NS, "button");
      constraintButton.setAttribute("label", "Add constraint");
      constraintButton.setAttribute("type", "menu");
      constraintButton.setAttribute("anonid", "constraintButton");
      var self = this;
      constraintButton.setAttribute("oncommand", "this.parentNode.parentNode.AddConstraint(event)");

      var constraintPopup = document.createElementNS(MEDIA_XUL_NS, "menupopup");
      constraintPopup.setAttribute("style", "font-size: smaller");

      var constraints = [
        ["width",                   "width",             "length"],
        ["min-width",               "min-width",         "length"],
        ["max-width",               "max-width",         "length"],
        ["height",                  "height",            "length"],
        ["min-height",              "min-height",        "length"],
        ["max-height",              "max-height",        "length"],
        ["separator", null, null],
        ["device-width",            "device-width",      "length"],
        ["min-device-width",        "min-device-width",  "length"],
        ["max-device-width",        "max-device-width",  "length"],
        ["device-height",           "device-height",     "length"],
        ["min-device-height",       "min-device-height", "length"],
        ["max-device-height",       "max-device-height", "length"],
        ["separator", null, null],
        ["orientation",             "orientation",       "enum(portrait,landscape)"],
        ["separator", null, null],
        ["aspect-ratio",            "aspect-ratio",            "ratio"],
        ["min-aspect-ratio",        "min-aspect-ratio",        "ratio"],
        ["max-aspect-ratio",        "max-aspect-ratio",        "ratio"],
        ["device-aspect-ratio",     "device-aspect-ratio",     "ratio"],
        ["min-device-aspect-ratio", "min-device-aspect-ratio", "ratio"],
        ["max-device-aspect-ratio", "max-device-aspect-ratio", "ratio"],
        ["separator", null, null],
        ["color",                   "color",             "integer"],
        ["min-color",               "min-color",         "integer"],
        ["max-color",               "max-color",         "integer"],
        ["color-index",             "color-index",       "integer"],
        ["min-color-index",         "min-color-index",   "integer"],
        ["max-color-index",         "max-color-index",   "integer"],
        ["monochrome",              "monochrome",        "integer"],
        ["min-monochrome",          "min-monochrome",    "integer"],
        ["max-monochrome",          "max-monochrome",    "integer"],
        ["separator", null, null],
        ["resolution",              "resolution",        "resolution"],
        ["min-resolution",          "min-resolution",    "resolution"],
        ["max-resolution",          "max-resolution",    "resolution"],
        ["separator", null, null],
        ["scan",                    "scan",              "enum(progressive,interlace)"],
        ["separator", null, null],
        ["grid",                    "grid",              "boolean"]
      ];
      for (var i = 0; i < constraints.length; i++) {
        if (constraints[i][0] == "separator") {
          constraintPopup.appendChild(document.createElementNS(MEDIA_XUL_NS, "menuseparator"));
        } else {
          var ci = document.createElementNS(MEDIA_XUL_NS, "menuitem");
          ci.setAttribute("value", constraints[i][1]);
          ci.setAttribute("label", constraints[i][0]);
          ci.setAttribute("querytype", constraints[i][2]);
          constraintPopup.appendChild(ci);
        }
      }

      constraintButton.appendChild(constraintPopup);
      hbox.appendChild(constraintButton);

      var spacer = document.createElementNS(MEDIA_XUL_NS, "spacer");
      spacer.setAttribute("flex", "1");
      hbox.appendChild(spacer);

      var deleteButton = document.createElementNS(MEDIA_XUL_NS, "toolbarbutton");
      deleteButton.className = "medium-delete-button";
      deleteButton.setAttribute("oncommand", "this.parentNode.parentNode.DeleteMedium()");
      hbox.appendChild(deleteButton);

      this.insertBefore(hbox, this.firstChild);
    }
  }

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  get amplifier() {
    return this.getChild('logicalMenulist').value;
  }

  set amplifier(val) {
    this.getChild('logicalMenulist').value = val;
  }

  get media() {
    return this.getChild('mediumMenulist').value;
  }

  set media(val) {
    this.getChild('mediumMenulist').value = val;
  }

  DeleteMedium() {
    var h = 0;
    var w = 0;
    try {
      h = gDialog.mediaGroupbox.boxObject.height;
      w = gDialog.mediaGroupbox.boxObject.width;
    } catch(e) {}
    this.parentNode.removeChild(this);
    try {
      var hdiff = gDialog.mediaGroupbox.boxObject.height - h;
      var wdiff = gDialog.mediaGroupbox.boxObject.width - w;
      window.resizeBy(wdiff, hdiff);
    } catch(e) {}
  }

  AddConstraint(aEvent) {
    var target = aEvent.target;
    var type = target.getAttribute("value");
    var querytype = target.getAttribute("querytype");
    var label = target.getAttribute("label");
    this._AddConstraint(type, querytype, label, null);
  }

  _AddConstraint(type, querytype, label, values) {
    var hbox = document.createElement("hbox");
    hbox.setAttribute("type", type);
    hbox.setAttribute("querytype", querytype);
    hbox.setAttribute("align", "center");

    var spacer = document.createElement("spacer");
    spacer.setAttribute("style", "width: 3em");
    hbox.appendChild(spacer);

    this.appendChild(hbox);

    switch(querytype) {
      case "integer":
        {
          var l = document.createElement("label");
          l.setAttribute("value", label + ":");
          hbox.appendChild(l);

          var textbox = document.createElement("textbox");
          textbox.setAttribute("type", "number");
          textbox.setAttribute("style", "width: 6em");
          textbox.className = "value";
          hbox.appendChild(textbox);

          if (values)
            textbox.value = values[0];
        }
        break;
      case "boolean":
        {
          var checkbox = document.createElement("checkbox");
          checkbox.setAttribute("label", label);
          checkbox.className = "value";
          hbox.appendChild(checkbox);

          if (values)
            checkbox.checked = (values[0] == "1");
        }
        break;
      case "length":
        {
          var l = document.createElement("label");
          l.setAttribute("value", label + ":");
          hbox.appendChild(l);

          var lengthbox = document.createElement("length");
          lengthbox.setAttribute("units", '% px pt cm in mm pc em ex');
          lengthbox.className = "value";
          hbox.appendChild(lengthbox);

          if (values)
            lengthbox.value = values[0];
        }
        break;
      case "resolution":
        {
          var l = document.createElement("label");
          l.setAttribute("value", label + ":");
          hbox.appendChild(l);

          var lengthbox = document.createElement("length");
          lengthbox.setAttribute("units", 'dpi dpcm');
          lengthbox.className = "value";
          hbox.appendChild(lengthbox);

          if (values)
            lengthbox.value = values[0];
        }
        break;
      case "ratio":
        {
          var l = document.createElement("label");
          l.setAttribute("value", label + ":");
          hbox.appendChild(l);

          var t1 = document.createElement("textbox");
          t1.setAttribute("type", "number");
          t1.setAttribute("style", "width: 6em");
          t1.className = "value1";
          hbox.appendChild(t1);

          var slash = document.createElement("label");
          slash.setAttribute("value", "/");
          hbox.appendChild(slash);

          var t2 = document.createElement("textbox");
          t2.setAttribute("type", "number");
          t2.setAttribute("style", "width: 6em");
          t2.className = "value2";
          hbox.appendChild(t2);

          if (values) {
            t1.value = values[0];
            t2.value = values[2];
          }
        }
        break;
      default:
        if (querytype.substr(0,4) == "enum") {
          hbox.setAttribute("querytype", "enum");
          var l = document.createElement("label");
          l.setAttribute("value", label + ":");
          hbox.appendChild(l);

          var str = querytype.substr(5, querytype.length - 6);
          var enumArray = str.split(",");

          var radiogroup = document.createElement("radiogroup");
          radiogroup.setAttribute("orient", "horizontal");
          radiogroup.className = "value";
          hbox.appendChild(radiogroup);

          for (var i = 0; i < enumArray.length; i++) {
            var e = enumArray[i];
            var labelString = "";
            try {
              labelString = gDialog.bundleString.getString(e);
            } catch(ex) {
              labelString = e;
            }
            var r = document.createElement("radio");
            r.setAttribute("label", labelString);
            r.setAttribute("value", e);
            radiogroup.appendChild(r);
          }

          if (values)
            radiogroup.value = values[0];
        }
        break;
    }

    spacer = document.createElement("spacer");
    spacer.setAttribute("flex", "1");
    hbox.appendChild(spacer);

    var toolbarbutton = document.createElement("toolbarbutton");
    toolbarbutton.className = "medium-delete-button";
    toolbarbutton.setAttribute("oncommand", "this.parentNode.parentNode.removeChild(this.parentNode)");
    hbox.appendChild(toolbarbutton);

    window.sizeToContent();
  }
}

// =============================================================================
// BGMediaLength - media length custom element
// =============================================================================
class BGMediaLength extends XULElement {

  connectedCallback() {
    // Build anonymous content (formerly XBL <content>)
    if (!this.querySelector('[anonid="lengthMenulist"]')) {
      var menulist = document.createElementNS(MEDIA_XUL_NS, "menulist");
      menulist.setAttribute("editable", "true");
      menulist.setAttribute("anonid", "lengthMenulist");
      var self = this;
      menulist.setAttribute("oncommand", "this.parentNode.onLengthMenulistCommand(this, false)");
      menulist.setAttribute("oninput", "this.parentNode.onLengthMenulistCommand(this, false)");

      var menupopup = document.createElementNS(MEDIA_XUL_NS, "menupopup");
      menupopup.setAttribute("onpopupshowing", "this.parentNode.parentNode.PopulateLengths(this)");
      menulist.appendChild(menupopup);

      this.insertBefore(menulist, this.firstChild);

      var spinbuttons = document.createElementNS(MEDIA_XUL_NS, "spinbuttons");
      spinbuttons.setAttribute("onup", "this.parentNode.IncreaseLength(this)");
      spinbuttons.setAttribute("ondown", "this.parentNode.DecreaseLength(this, false)");
      this.appendChild(spinbuttons);
    }
  }

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  get value() {
    return this.getChild('lengthMenulist').value;
  }

  set value(val) {
    this.getChild('lengthMenulist').value = val;
  }

  onLengthMenulistCommand(aElt, aAllowNegative) {
    var value;
    if (aElt.selectedItem)
      value = aElt.selectedItem.value;
    else
      value = aElt.value;
    aElt.value = value;
  }

  PopulateLengths(aElt) {
    var menuseparator = aElt.querySelector("menuseparator");
    if (menuseparator) {
      var child = aElt.firstChild;
      while (child && child != menuseparator) {
        var tmp = child.nextSibling;
        aElt.removeChild(child);
        child = tmp;
      }
    }
    else
      deleteAllChildren(aElt);

    var v = parseFloat(aElt.parentNode.value);
    if (isNaN(v))
      v = 0;
    var unitsArray;
    var unitsString = this.getAttribute("units");
    if (unitsString == " ")
      unitsArray = [""];
    else
      unitsArray = unitsString.split(" ");
    unitsArray.forEach(function(aArrayElt, aIndex, aArray) {
      var menuitem = document.createElement("menuitem");
      menuitem.setAttribute("label", v + aArrayElt);
      menuitem.setAttribute("value", v + aArrayElt);
      aElt.insertBefore(menuitem, menuseparator);
    });
  }

  IncreaseLength(aElt) {
    var value;
    var menulist = aElt.previousSibling;
    if (menulist.selectedItem)
      value = menulist.selectedItem.value;
    else
      value = menulist.value;
    var units = this.getAttribute("units").replace( / /g, "|");
    var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
    var match = value.match( r );
    if (match) {
      var unit = match[2];
      var v    = parseFloat(match[1]);
      switch (unit) {
        case "in":
        case "cm":
          v += 0.1;
          v = Math.round( v * 10) / 10;
          break;
        case "em":
        case "ex":
          v += 0.5;
          v = Math.round( v * 10) / 10;
          break;
        default:
          v += 1;
          break;
      }
      menulist.value = v + (unit ? unit : "");
      this.onLengthMenulistCommand(menulist, false);
    }
  }

  DecreaseLength(aElt, aAllowNegative) {
    var value;
    var menulist = aElt.previousSibling;
    if (menulist.selectedItem)
      value = menulist.selectedItem.value;
    else
      value = menulist.value;
    var units = this.getAttribute("units").replace( / /g, "|");
    var r = new RegExp( "([+-]?[0-9]*\\.[0-9]+|[+-]?[0-9]+)(" + units + ")*", "");
    var match = value.match( r );
    if (match) {
      var unit = match[2];
      var v    = parseFloat(match[1]);
      switch (unit) {
        case "in":
        case "cm":
          v -= 0.1;
          v = Math.round( v * 10) / 10;
          break;
        case "em":
        case "ex":
          v -= 0.5;
          v = Math.round( v * 10) / 10;
          break;
        default:
          v -= 1;
          break;
      }
      if (!aAllowNegative && v < 0)
        v = 0;
      menulist.value = v + (unit ? unit : "");
      this.onLengthMenulistCommand(menulist, aAllowNegative);
    }
  }
}

// Register custom elements (guard against double-registration)
if (!customElements.get("bg-medium")) {
  customElements.define("bg-medium", BGMedium);
}
if (!customElements.get("bg-medialength")) {
  customElements.define("bg-medialength", BGMediaLength);
}
