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

// rotator-element.js: Custom Element replacement for XBL bindings
// from bindings/rotator.xml (XBL removed in Gecko ESR 140).
//
// Defines two classes:
//   BGRotator       - the rotator widget, registered as <bg-rotator>
//   BGRotateGrippy  - the rotation grippy, registered as <bg-rotategrippy>

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// =============================================================================
// BGRotator - rotator custom element
// =============================================================================
class BGRotator extends XULElement {

  connectedCallback() {
    // Build anonymous content (formerly XBL <content>)
    if (!this.querySelector('[anonid="outerRotator"]')) {
      var outerRotator = document.createElementNS(XUL_NS, "hbox");
      outerRotator.setAttribute("anonid", "outerRotator");

      var innerRotator = document.createElementNS(XUL_NS, "hbox");
      innerRotator.setAttribute("anonid", "innerRotator");
      innerRotator.setAttribute("align", "center");

      var spacer = document.createElementNS(XUL_NS, "spacer");
      spacer.setAttribute("flex", "1");
      innerRotator.appendChild(spacer);

      var grippy = document.createElement("bg-rotategrippy");
      if (this.getAttribute("disabled"))
        grippy.setAttribute("disabled", this.getAttribute("disabled"));
      innerRotator.appendChild(grippy);

      outerRotator.appendChild(innerRotator);
      this.insertBefore(outerRotator, this.firstChild);

      var textbox = document.createElementNS(XUL_NS, "textbox");
      textbox.setAttribute("anonid", "textbox");
      textbox.setAttribute("size", "4");
      textbox.setAttribute("type", "number");
      textbox.setAttribute("min", "-1000");
      textbox.setAttribute("max", "1000");
      if (this.getAttribute("disabled"))
        textbox.setAttribute("disabled", this.getAttribute("disabled"));
      textbox.setAttribute("value", "0");
      var self = this;
      textbox.addEventListener("change", function(event) {
        self.reflectPosition(event, true);
      });
      textbox.addEventListener("input", function(event) {
        self.reflectPosition(event, true);
      });
      this.insertBefore(textbox, outerRotator.nextSibling);

      // The label uses a DTD entity &degrees.label; which resolves at runtime.
      // We use a static label attribute; the localized value should be set
      // by the DTD or overlay system.
      var label = document.createElementNS(XUL_NS, "label");
      label.setAttribute("value", "\u00B0");
      if (this.getAttribute("disabled"))
        label.setAttribute("disabled", this.getAttribute("disabled"));
      this.appendChild(label);
    }

    // Constructor logic: set initial value from attribute
    if (this.getAttribute("value"))
      this.value = this.getAttribute("value");
  }

  get value() {
    return this.getChild("textbox").value;
  }

  set value(val) {
    this.getChild("textbox").value = val;
    this.getChild("innerRotator").style.MozTransform = "rotate(" + (val-90) + "deg)";
  }

  get disabled() {
    return (this.getAttribute("disabled") == "true");
  }

  set disabled(val) {
    if (val)
      this.setAttribute("disabled", val);
    else
      this.removeAttribute("disabled");
  }

  getChild(aChildName) {
    return this.querySelector('[anonid="' + aChildName + '"]');
  }

  reflectPosition(aEvent, aForceCallback) {
    var textbox = this.getChild("textbox");
    var angle = aEvent.originalTarget.value;
    if (textbox.value != angle)
      textbox.value = angle;
    this.getChild("innerRotator").style.MozTransform = "rotate(" + (parseFloat(angle)-90) + "deg)";
    this.callCallback(angle, aForceCallback);
  }

  callCallback(aAngle, aForceCallback) {
    if (this.getAttribute("onchange") &&
        (aForceCallback || this.getAttribute("onlyonrelease") != "true")) {
      try {
        var fn = new Function("angle", this.getAttribute("onchange"));
        fn.call(window, aAngle);
      }
      catch(e) {}
    }
  }
}

// =============================================================================
// BGRotateGrippy - rotation grippy custom element
// =============================================================================
class BGRotateGrippy extends XULElement {

  constructor() {
    super();
    this.mStartX = 0;
    this.mStartY = 0;
    this.mCenterX = 0;
    this.mCenterY = 0;
    this.mRotating = false;
    this.mAngle = 0;
    this.mRotator = null;
    this.mNegated = false;
  }

  connectedCallback() {
    this.addEventListener("mousedown", this._onMouseDown);
    this.addEventListener("mousemove", this._onMouseMove);
    this.addEventListener("mouseup",   this._onMouseUp);
  }

  _onMouseDown(event) {
    if (!this.mRotator)
      this.mRotator = this.parentNode.parentNode.parentNode;
    this.mNegated = (this.mRotator.getAttribute("negated") == "true");
    if (this.getAttribute("disabled") == "true")
      return;
   var bo = this.parentNode.boxObject;
    this.mCenterX = bo.screenX + (bo.width / 2);
    this.mCenterY = bo.screenY + (bo.height / 2);
    this.mStartX = this.mCenterX;
    this.mStartY = this.mCenterY - 16;
    this.mRotating = true;
    this.setAttribute("rotating", "true");
    this.setCapture(true);
  }

  _onMouseMove(event) {
    if (!this.mRotating)
      return;
    var x = event.screenX;
    var y = event.screenY;
    var p0c = Math.sqrt(Math.pow(this.mCenterX - this.mStartX,2) +
                        Math.pow(this.mCenterY - this.mStartY,2)); // p0->c (b)
    var p1c = Math.sqrt(Math.pow(this.mCenterX - x,2) +
                        Math.pow(this.mCenterY - y,2)); // p1->c (a)
    var p0p1 = Math.sqrt(Math.pow(x - this.mStartX,2) +
                         Math.pow(y - this.mStartY,2)); // p0->p1 (c)
    this.mAngle = Math.floor(Math.acos((p1c*p1c + p0c*p0c - p0p1*p0p1)/(2*p1c*p0c)) * 180 / Math.PI);
    if (x <= this.mCenterX)
      this.mAngle = 360 - this.mAngle;

    this.parentNode.style.MozTransform = "rotate(" + (this.mAngle-90) + "deg)";
    this.mRotator.getChild("textbox").value = this.mAngle;
    this.mRotator.callCallback(this.mAngle, false);
  }

  _onMouseUp(event) {
    if (!this.mRotating)
      return;
    this.releaseCapture();
    this.removeAttribute("rotating");
    this.mRotating = false;
    var x = event.screenX;
    var y = event.screenY;
    var rotator = this.parentNode.parentNode.parentNode;
    var p0c = Math.sqrt(Math.pow(this.mCenterX - this.mStartX,2) +
                        Math.pow(this.mCenterY - this.mStartY,2)); // p0->c (b)
    var p1c = Math.sqrt(Math.pow(this.mCenterX - x,2) +
                        Math.pow(this.mCenterY - y,2)); // p1->c (a)
    var p0p1 = Math.sqrt(Math.pow(x - this.mStartX,2) +
                         Math.pow(y - this.mStartY,2)); // p0->p1 (c)
    this.mAngle = Math.floor(Math.acos((p1c*p1c + p0c*p0c - p0p1*p0p1)/(2*p1c*p0c)) * 180 / Math.PI);
    if (x <= this.mCenterX)
      this.mAngle = 360 - this.mAngle;

    this.parentNode.style.MozTransform = "rotate(" + (this.mAngle-90) + "deg)";
    this.mRotator.getChild("textbox").value = this.mAngle;
    this.mRotator.callCallback(this.mAngle, true);
  }
}

// Register custom elements (guard against double-registration)
if (!customElements.get("bg-rotator")) {
  customElements.define("bg-rotator", BGRotator);
}
if (!customElements.get("bg-rotategrippy")) {
  customElements.define("bg-rotategrippy", BGRotateGrippy);
}
