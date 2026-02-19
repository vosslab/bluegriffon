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

// Custom Element: <bg-floatingpanel>
// Replaces XBL binding from bindings/floatingpanel.xml
// Originally extended chrome://global/content/bindings/popup.xml#panel

// Resolve the base class: use the existing "panel" custom element if registered,
// otherwise fall back to XULElement so the file can load without errors.
var _BGFloatingPanelBase = customElements.get("panel")?.constructor || XULElement;

class BGFloatingPanel extends _BGFloatingPanelBase {

  constructor() {
    super();
    // Fields from XBL
    this._captured = false;
    this._captureX = 0;
    this._captureY = 0;
    this._initialW = 0;
    this._initialH = 0;
  }

  connectedCallback() {
    // Chain to parent connectedCallback if it exists
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    // Build anonymous content (no Shadow DOM)
    if (!this.querySelector('.titleholder')) {
      // Set panel attributes from the XBL <content> element
      this.setAttribute("noautohide", "true");
      this.setAttribute("level", "floating");

      // Title bar hbox
      let titleHolder = document.createXULElement("hbox");
      titleHolder.setAttribute("align", "center");
      titleHolder.setAttribute("class", "titleholder");

      // Close button
      let closeImg = document.createXULElement("image");
      closeImg.setAttribute("class", "floatingpanel-close");
      closeImg.setAttribute("tooltiptext", this.getAttribute("closelabel") || "");
      closeImg.addEventListener("click", () => { this.closePanel(); });
      titleHolder.appendChild(closeImg);

      // Title bar with label
      let titlebar = document.createXULElement("titlebar");
      titlebar.setAttribute("flex", "1");
      let label = document.createXULElement("label");
      if (this.hasAttribute("label")) {
        label.setAttribute("value", this.getAttribute("label"));
      }
      titlebar.appendChild(label);
      titleHolder.appendChild(titlebar);

      // Pin button
      let pinImg = document.createXULElement("image");
      pinImg.setAttribute("class", "pin");
      pinImg.setAttribute("tooltiptext", this.getAttribute("panlabel") || "");
      pinImg.addEventListener("click", () => { PinPanel(); });
      titleHolder.appendChild(pinImg);

      // Align button
      let alignImg = document.createXULElement("image");
      alignImg.setAttribute("class", "floatinpanel-align");
      alignImg.setAttribute("tooltiptext", this.getAttribute("alignlabel") || "");
      alignImg.addEventListener("click", () => { AlignAllPanels(); });
      titleHolder.appendChild(alignImg);

      // Insert title holder before existing children
      this.insertBefore(titleHolder, this.firstChild);

      // Resizer hbox at the bottom
      let resizerBox = document.createXULElement("hbox");
      resizerBox.setAttribute("style", "width: 25px;");
      resizerBox.setAttribute("align", "center");
      let spacer = document.createXULElement("spacer");
      spacer.setAttribute("flex", "1");
      resizerBox.appendChild(spacer);
      let resizer = document.createXULElement("box");
      resizer.setAttribute("anonid", "resizer");
      resizer.addEventListener("mousedown", (event) => { this.captureMouse(event, resizer); });
      resizer.addEventListener("mouseup", (event) => { this.releaseMouse(event, resizer); });
      resizer.addEventListener("mousemove", (event) => { this.resizePanel(event, resizer); });
      resizerBox.appendChild(resizer);
      this.appendChild(resizerBox);
    }

    // Constructor logic: if open==true, open panel after timeout
    if (this.getAttribute("open") == "true") {
      var _self = this;
      setTimeout(function() {
          _self.openPanel(null, true);
          NotifierUtils.notify("redrawPanel", _self.id);
        }, 500);
    }

    // Event handlers from XBL <handlers>
    this.addEventListener("popuphiding", () => {
      this.persistPosition();
    });

    this.addEventListener("mousedown", (event) => {
      this._onMouseDown(event);
    });
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) {
      super.disconnectedCallback();
    }
  }

  // --- Methods ---

  openPanel(aAnchorElement, aDoResize) {
    try {
      if (aAnchorElement)
        this.openPopup(aAnchorElement, "after_start", 0, 0,
                       false, true);
      else
        this.openPopup(document.documentElement, "start_before", 10, 10,
                       false, true);
      this.setAttribute("open", "true");
      document.persist(this.id, "open");
      if (aDoResize && this.hasAttribute("width") && this.hasAttribute("height"))
        this.sizeTo(this.getAttribute("width"), this.getAttribute("height"));
      BlueGriffonVars.lastPanelRaised = this;
    } catch(e) {}
  }

  PinPanel() {
    this.hidePopup();
    this.removeAttribute("style");
    this.setAttribute("open", "false");
    var menuitem = document.querySelector("#panelsMenuPopup > menuitem[panel='" + this.id + "']");
    menuitem.setAttribute("decked", "true");
    menuitem.setAttribute("checked", "true");
    var iframe = this.firstElementChild;
    var src = iframe.getAttribute("src");
    var wjo = iframe.contentWindow.wrappedJSObject;
    if (wjo && "Shutdown" in wjo)
      wjo.Shutdown();
    iframe.setAttribute("src", "about:blank");
    document.persist(this.id, "open");
    document.persist(menuitem.id, "decked");
    document.persist(menuitem.id, "checked");

    gDialog.deckedPanelsTabs.addPanel(this.getAttribute("label"),
                                      src,
                                      this.id);
  }

  closePanel(aNow) {
    if (aNow) {
      this.hidePopup();
      this.setAttribute("open", "false");
      document.persist(this.id, "open");
      return;
    }
    this.setAttribute("style", "opacity: 0");
    var _self = this;
    setTimeout(function() {
        _self.hidePopup();
        _self.removeAttribute("style");
        _self.setAttribute("open", "false");
        document.persist(_self.id, "open");
      }, 500);
  }

  persistPosition() {
    try {
      var screenX = this.boxObject.screenX;
      var screenY = this.boxObject.screenY;
      var width   = this.boxObject.width;
      var height  = this.boxObject.height;
      this.setAttribute("left",   screenX);
      this.setAttribute("top",    screenY);
      this.setAttribute("width",  width);
      this.setAttribute("height", height);
      document.persist(this.id, "left");
      document.persist(this.id, "top");
      document.persist(this.id, "width");
      document.persist(this.id, "height");
    } catch (e) {
    }
  }

  captureMouse(aEvent, aElt) {
    var panel = aElt.parentNode.parentNode;
    var screenX = panel.boxObject.screenX;
    var screenY = panel.boxObject.screenY;
    panel.moveTo(screenX, screenY);
    if (!panel._captured)
    {
      panel._captured = true;
      panel._captureX = aEvent.clientX;
      panel._captureY = aEvent.clientY;
      panel._initialW = panel.boxObject.width;
      panel._initialH = panel.boxObject.height;
      aElt.setCapture(false);
    }
  }

  releaseMouse(aEvent, aElt) {
    var panel = aElt.parentNode.parentNode;
    if (panel._captured)
    {
      this._captured = false;
      aElt.releaseCapture();
      var dx = aEvent.clientX - panel._captureX;
      var dy = aEvent.clientY - panel._captureY;
      panel.sizeTo(panel._initialW + dx, panel._initialH + dy);
    }
  }

  resizePanel(aEvent, aElt) {
    var panel = aElt.parentNode.parentNode;
    if (panel._captured)
    {
      var dx = aEvent.clientX - panel._captureX;
      var dy = aEvent.clientY - panel._captureY;
      panel.sizeTo( (panel._initialW + dx) , (panel._initialH + dy) );
    }
  }

  // --- Mousedown handler from XBL ---

  _onMouseDown(event) {
    if (BlueGriffonVars.lastPanelRaised != this ||
        BlueGriffonVars.lastPanelRaisedDidNotIntersect) {
      // this is ugly but there is no method to raise a panel above other existing panels...
      // XXX TODO : check if the panel to raise intersects with other visible panels
      // if not, nothing to do here after next line
      BlueGriffonVars.lastPanelRaised = this;
      var r1 = { x1: this.boxObject.screenX,
                 y1: this.boxObject.screenY,
                 x2: this.boxObject.screenX + this.boxObject.width,
                 y2: this.boxObject.screenY + this.boxObject.height };
      var panels = document.querySelectorAll('panel[floating="true"]');
      var intersecting = false;
      for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (p != this) {
          var r2 = { x1: p.boxObject.screenX,
                     y1: p.boxObject.screenY,
                     x2: p.boxObject.screenX + p.boxObject.width,
                     y2: p.boxObject.screenY + p.boxObject.height };
          var overlap =  (r1.x1 < r2.x2 && r1.x2 > r2.x1 &&
                            r1.y1 < r2.y2 && r1.y2 > r2.y1);
          intersecting = intersecting || overlap;
        }
      }
      if (!intersecting) { // we can take an early way out
        BlueGriffonVars.lastPanelRaisedDidNotIntersect = true;
        return;
      }
      BlueGriffonVars.lastPanelRaisedDidNotIntersect = false;
      this.hidePopup();
      this.openPanel(null, false);
    }
  }
}

// Register only if not already defined
if (!customElements.get("bg-floatingpanel")) {
  customElements.define("bg-floatingpanel", BGFloatingPanel);
}
