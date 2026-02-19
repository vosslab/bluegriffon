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

// Custom Element: <bg-deckedpanelstabs>
// Replaces XBL binding from bindings/deckedPanelsTabs.xml
class BGDeckedPanelsTabs extends XULElement {

  connectedCallback() {
    // Build the context menu popup that was formerly anonymous content
    if (!this.querySelector("#deckedPanelsTabsContextMenu")) {
      var popup = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "popup");
      popup.id = "deckedPanelsTabsContextMenu";

      var closeItem = document.createElementNS(
        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "menuitem");
      // Use the DTD entity string; at runtime the localized value is resolved
      closeItem.setAttribute("label", "Close Panel");
      closeItem.setAttribute("oncommand", "CloseDeckedPanel()");
      popup.appendChild(closeItem);

      this.insertBefore(popup, this.firstChild);
    }
  }

  addPanel(aLabel, aURL, aPanelId) {
    var tab = document.createElement("label");
    tab.setAttribute("value", aLabel);
    tab.setAttribute("url", aURL);
    tab.setAttribute("panelid", aPanelId);
    tab.setAttribute("context", "deckedPanelsTabsContextMenu");
    this.appendChild(tab);
    var _self = this;
    tab.addEventListener("click", function(e) { _self.deckedPanelSelected(e); }, false);

    var child = this.firstElementChild;
    while (child) {
      child.removeAttribute("selected");
      child = child.nextElementSibling;
    }
    tab.setAttribute("selected", "true");

    gDialog.deckPanelsIframe.setAttribute("src", aURL);
  }

  deckedPanelSelected(aEvent) {
    var tab = aEvent.target;
    gDialog.deckPanelsIframe.setAttribute("src", tab.getAttribute("url"));

    var child = this.firstElementChild;
    while (child) {
      child.removeAttribute("selected");
      child = child.nextElementSibling;
    }
    tab.setAttribute("selected", "true");
  }

  UnDock() {
    var tab = document.popupNode;
    var panelid = tab.getAttribute("panelid");
    var menuitem = document.querySelector("menuitem[panel='" + panelid + "'][url]");
    var panel = document.getElementById(panelid);
    this.CloseDeckedPanel();
    menuitem.setAttribute("decked", "false");
    document.persist(menuitem.id, "decked");
    start_panel(menuitem);
  }

  doCloseDeckedPanel(tab) {
    var newTab = null;
    if (tab.nextElementSibling)
      newTab = tab.nextElementSibling;
    else if (tab.previousElementSibling)
      newTab = tab.previousElementSibling;

    var panelid = tab.getAttribute("panelid");
    var panel = document.getElementById(panelid);
    tab.parentNode.removeChild(tab);

    if (newTab) {
      newTab.setAttribute("selected", "true");
      gDialog.deckPanelsIframe.setAttribute("src", newTab.getAttribute("url"));
    }
    else
      gDialog.deckPanelsIframe.setAttribute("src", "about:blank");

    UpdatePanelsStatusInMenu();
  }

  CloseDeckedPanel() {
    var tab = document.popupNode;
    this.doCloseDeckedPanel(tab);
  }
}

// Register the custom element only if not already defined
if (!customElements.get("bg-deckedpanelstabs")) {
  customElements.define("bg-deckedpanelstabs", BGDeckedPanelsTabs);
}
