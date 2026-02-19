/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * multistate-element.js: Custom Element replacement for XBL binding
 * multistate.xml#multistatebutton (XBL removed in Gecko ESR 140).
 *
 * The Original Code is BlueGriffon.
 * The Initial Developer of the Original Code is
 * Disruptive Innovations SARL.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Daniel Glazman (daniel.glazman@disruptive-innovations.com), Original Author
 *
 * ***** END LICENSE BLOCK ***** */

// Custom Element: <bg-multistatebutton>
// Replaces XBL binding from bindings/multistate.xml
class BGMultistateButton extends XULElement {

  connectedCallback() {
    // Create the inner toolbarbutton if it does not already exist
    if (!this.querySelector('[anonid="button"]')) {
      var btn = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
      btn.setAttribute("anonid", "button");
      btn.className = "multistate-button";
      // Inherit key attributes from the host element
      var inheritAttrs = ["value", "label", "image", "disabled"];
      for (var i = 0; i < inheritAttrs.length; i++) {
        if (this.hasAttribute(inheritAttrs[i]))
          btn.setAttribute(inheritAttrs[i], this.getAttribute(inheritAttrs[i]));
      }
      this.insertBefore(btn, this.firstChild);
    }

    // Constructor logic: if no value and has state children, adopt first state
    if (!this.mButton.hasAttribute("value") && this.firstChild)
      this._adoptNextState(this.firstChild);

    // Attach command handler for cycling through states
    this.addEventListener("command", this._onCommand.bind(this), true);
  }

  get mButton() {
    return this.querySelector('[anonid="button"]');
  }

  get value() {
    return this.mButton.getAttribute("value");
  }

  set value(val) {
    this.mButton.setAttribute("value", val);
  }

  get disabled() {
    return this.mButton.getAttribute("disabled");
  }

  set disabled(val) {
    this.mButton.setAttribute("disabled", val);
  }

  _isState(aNode) {
    if (!aNode)
      throw Components.results.NS_ERROR_NULL_POINTER;

    return (aNode.nodeType == Node.ELEMENT_NODE &&
            aNode.nodeName == "state" &&
            aNode.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
  }

  _adoptNextState(aSeed) {
    var child = aSeed;
    while (child)
    {
      if (this._isState(child))
      {
        this._cloneAttributes(child, this.mButton);
        return true;
      }
      child = child.nextSibling;
    }
    return false;
  }

  _cloneAttributes(aSrc, aDest) {
    if (!aSrc || !aDest)
      throw Components.results.NS_ERROR_NULL_POINTER;

    if (aSrc.nodeType  != Node.ELEMENT_NODE ||
        aDest.nodeType != Node.ELEMENT_NODE)
      throw Components.results.NS_ERROR_INVALID_ARG;

    var attributes = aSrc.attributes;
    for (var i = 0 ; i < attributes.length; i++)
      aDest.setAttributeNS(attributes[i].namespaceURI,
                           attributes[i].localName,
                           attributes[i].nodeValue);
  }

  _onCommand(event) {
    var done = false;
    if (this.mButton.hasAttribute("value"))
    {
      var states = this.getElementsByAttribute("value", this.value);
      for (var i = 0 ; i < states.length; i++)
        if (this._isState(states[i]))
        {
          done = this._adoptNextState(states[i].nextSibling);
          break;
        }
    }
    if (!done)
      this._adoptNextState(this.firstChild);
  }
}

// Register the custom element only if not already defined
if (!customElements.get("bg-multistatebutton")) {
  customElements.define("bg-multistatebutton", BGMultistateButton);
}
