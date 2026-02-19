/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * menulist-element.js: Custom Element replacement for XBL bindings
 * menulist.xml (XBL removed in Gecko ESR 140).
 *
 * Contains 4 bindings converted to Custom Elements:
 *   BGMenuList         - menulist
 *   BGMenuListEditable - menulist-editable
 *   BGMenuListCompact  - menulist-compact (layout variant)
 *   BGMenuListDescription - menulist-description (layout variant)
 *
 * The built-in menulist in ESR 140 may already provide most behavior.
 * These Custom Elements add BG-specific overrides defensively.
 *
 * ***** END LICENSE BLOCK ***** */

const XULNS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// ============================================
// BGMenuList: main menulist custom element
// Replaces XBL binding menulist.xml#menulist
// ============================================
class BGMenuList extends HTMLElement {

  constructor() {
    super();
    this.mSelectedInternal = null;
    this._menuBoxObject = null;
  }

  connectedCallback() {
    // Build anonymous content if not already present
    if (!this.querySelector(".menulist-label-box")) {
      // Label box: icon + label
      var hbox = document.createXULElement("hbox");
      hbox.className = "menulist-label-box";
      hbox.setAttribute("flex", "1");

      var icon = document.createXULElement("image");
      icon.className = "menulist-icon";
      if (this.hasAttribute("image"))
        icon.setAttribute("src", this.getAttribute("image"));
      hbox.appendChild(icon);

      var label = document.createXULElement("label");
      label.className = "menulist-label";
      if (this.hasAttribute("label"))
        label.setAttribute("value", this.getAttribute("label"));
      if (this.hasAttribute("crop"))
        label.setAttribute("crop", this.getAttribute("crop"));
      if (this.hasAttribute("accesskey"))
        label.setAttribute("accesskey", this.getAttribute("accesskey"));
      label.setAttribute("crop", "right");
      label.setAttribute("flex", "1");
      hbox.appendChild(label);

      // Insert label box before first child (menupopup)
      this.insertBefore(hbox, this.firstChild);

      // Dropmarker
      var dropmarker = document.createXULElement("dropmarker");
      dropmarker.className = "menulist-dropmarker";
      dropmarker.setAttribute("type", "menu");
      if (this.hasAttribute("disabled"))
        dropmarker.setAttribute("disabled", this.getAttribute("disabled"));
      // Insert after hbox, before menupopup
      var popup = this.menupopup;
      if (popup)
        this.insertBefore(dropmarker, popup);
      else
        this.appendChild(dropmarker);
    }

    // Run initial selection
    this.setInitialSelection();

    // Attach event handlers
    this.addEventListener("command", this._onCommand.bind(this), true);
    this.addEventListener("popupshowing", this._onPopupShowing.bind(this));
    this.addEventListener("keypress", this._onKeyPress.bind(this));
  }

  disconnectedCallback() {
    // Destructor: clean up broadcast listeners or DOMAttrModified listener
    if (this.mSelectedInternal) {
      try {
        if (typeof Components !== "undefined" &&
            document instanceof Components.interfaces.nsIDOMXULDocument) {
          document.removeBroadcastListenerFor(this.mSelectedInternal, this, "value");
          document.removeBroadcastListenerFor(this.mSelectedInternal, this, "label");
          document.removeBroadcastListenerFor(this.mSelectedInternal, this, "image");
          document.removeBroadcastListenerFor(this.mSelectedInternal, this, "description");
        }
        else {
          this.mSelectedInternal.removeEventListener("DOMAttrModified", this, false);
        }
      } catch(e) {
        // nsIDOMXULDocument may not exist in ESR 140
        try {
          this.mSelectedInternal.removeEventListener("DOMAttrModified", this, false);
        } catch(e2) {}
      }
    }
  }

  // --- menuBoxObject accessor with null safety ---

  get menuBoxObject() {
    if (this._menuBoxObject)
      return this._menuBoxObject;
    try {
      this._menuBoxObject = this.boxObject.QueryInterface(
        Components.interfaces.nsIMenuBoxObject);
    } catch(e) {
      // nsIMenuBoxObject may not exist in ESR 140
      this._menuBoxObject = null;
    }
    return this._menuBoxObject;
  }

  // --- Properties ---

  get menupopup() {
    var popup = this.firstChild;
    while (popup && popup.localName != "menupopup")
      popup = popup.nextSibling;
    return popup;
  }

  get inputField() {
    return null;
  }

  get value() {
    return this.getAttribute("value");
  }

  set value(val) {
    // If the new value is null, clear selection
    if (val == null) {
      this.selectedItem = null;
      return;
    }

    var arr = null;
    var popup = this.menupopup;
    if (popup)
      arr = popup.getElementsByAttribute("value", val);

    if (arr && arr.item(0))
      this.selectedItem = arr[0];
    else {
      this.selectedItem = null;
      this.setAttribute("value", val);
    }
  }

  get crop() {
    return this.getAttribute("crop");
  }

  set crop(val) {
    this.setAttribute("crop", val);
  }

  get image() {
    return this.getAttribute("image");
  }

  set image(val) {
    this.setAttribute("image", val);
  }

  get label() {
    return this.getAttribute("label");
  }

  get description() {
    return this.getAttribute("description");
  }

  set description(val) {
    this.setAttribute("description", val);
  }

  get editable() {
    return this.getAttribute("editable") == "true";
  }

  set editable(val) {
    this.setAttribute("editable", val);
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(val) {
    if (this.menuBoxObject)
      this.menuBoxObject.openMenu(val);
  }

  get itemCount() {
    return this.menupopup ? this.menupopup.childNodes.length : 0;
  }

  get selectedIndex() {
    // Quick and dirty: no hierarchical menulists support
    if (!this.selectedItem ||
        !this.mSelectedInternal.parentNode ||
        this.mSelectedInternal.parentNode.parentNode != this)
      return -1;

    var children = this.mSelectedInternal.parentNode.childNodes;
    var i = children.length;
    while (i--)
      if (children[i] == this.mSelectedInternal)
        break;
    return i;
  }

  set selectedIndex(val) {
    var popup = this.menupopup;
    if (popup && 0 <= val) {
      if (val < popup.childNodes.length)
        this.selectedItem = popup.childNodes[val];
    }
    else
      this.selectedItem = null;
  }

  get selectedItem() {
    return this.mSelectedInternal;
  }

  set selectedItem(val) {
    var oldval = this.mSelectedInternal;
    if (oldval == val)
      return;

    if (val && !this.contains(val))
      return;

    // Remove old selection tracking
    if (oldval) {
      oldval.removeAttribute("selected");
      try {
        if (typeof Components !== "undefined" &&
            document instanceof Components.interfaces.nsIDOMXULDocument) {
          document.removeBroadcastListenerFor(oldval, this, "value");
          document.removeBroadcastListenerFor(oldval, this, "label");
          document.removeBroadcastListenerFor(oldval, this, "image");
          document.removeBroadcastListenerFor(oldval, this, "description");
        }
        else {
          oldval.removeEventListener("DOMAttrModified", this, false);
        }
      } catch(e) {
        // nsIDOMXULDocument may not exist in ESR 140; fall back
        try {
          oldval.removeEventListener("DOMAttrModified", this, false);
        } catch(e2) {}
      }
    }

    this.mSelectedInternal = val;
    if (val) {
      val.setAttribute("selected", "true");
      this.setAttribute("value", val.getAttribute("value"));
      this.setAttribute("image", val.getAttribute("image"));
      this.setAttribute("label", val.getAttribute("label"));
      this.setAttribute("description", val.getAttribute("description"));
      // Add tracking for attribute changes on selected item
      try {
        if (typeof Components !== "undefined" &&
            document instanceof Components.interfaces.nsIDOMXULDocument) {
          document.addBroadcastListenerFor(val, this, "value");
          document.addBroadcastListenerFor(val, this, "label");
          document.addBroadcastListenerFor(val, this, "image");
          document.addBroadcastListenerFor(val, this, "description");
        }
        else {
          val.addEventListener("DOMAttrModified", this, false);
        }
      } catch(e) {
        try {
          val.addEventListener("DOMAttrModified", this, false);
        } catch(e2) {}
      }
    }
    else {
      this.removeAttribute("value");
      this.removeAttribute("image");
      this.removeAttribute("label");
      this.removeAttribute("description");
    }

    // Fire select event
    var selectEvent = document.createEvent("Events");
    selectEvent.initEvent("select", true, true);
    this.dispatchEvent(selectEvent);

    // Fire ValueChange event
    var changeEvent = document.createEvent("Events");
    changeEvent.initEvent("ValueChange", true, true);
    this.dispatchEvent(changeEvent);
  }

  get accessibleType() {
    try {
      return (this.getAttribute("droppable") == "false") ?
             Components.interfaces.nsIAccessibleProvider.XULTextBox :
             Components.interfaces.nsIAccessibleProvider.XULCombobox;
    } catch(e) {
      return 0;
    }
  }

  // --- Methods ---

  setInitialSelection() {
    var popup = this.menupopup;
    if (popup) {
      var arr = popup.getElementsByAttribute("selected", "true");

      var editable = this.editable;
      var value = this.getAttribute("value");
      if (!arr.item(0) && value)
        arr = popup.getElementsByAttribute(editable ? "label" : "value", value);

      if (arr.item(0))
        this.selectedItem = arr[0];
      else if (!editable)
        this.selectedIndex = 0;
    }
  }

  contains(item) {
    if (!item)
      return false;

    var parent = item.parentNode;
    return (parent && parent.parentNode == this);
  }

  handleEvent(aEvent) {
    if (aEvent.type == "DOMAttrModified" &&
        aEvent.target == this.mSelectedInternal) {
      var attrName = aEvent.attrName;
      switch (attrName) {
        case "value":
        case "label":
        case "image":
        case "description":
          this.setAttribute(attrName, aEvent.newValue);
      }
    }
  }

  getIndexOfItem(item) {
    var popup = this.menupopup;
    if (popup) {
      var children = popup.childNodes;
      var i = children.length;
      while (i--)
        if (children[i] == item)
          return i;
    }
    return -1;
  }

  getItemAtIndex(index) {
    var popup = this.menupopup;
    if (popup) {
      var children = popup.childNodes;
      if (index >= 0 && index < children.length)
        return children[index];
    }
    return null;
  }

  appendItem(label, value, description) {
    var popup = this.menupopup ||
                this.appendChild(document.createElementNS(XULNS, "menupopup"));
    var item = document.createElementNS(XULNS, "menuitem");
    item.setAttribute("label", label);
    item.setAttribute("value", value);
    if (description)
      item.setAttribute("description", description);

    popup.appendChild(item);
    return item;
  }

  insertItemAt(index, label, value, description) {
    var popup = this.menupopup ||
                this.appendChild(document.createElementNS(XULNS, "menupopup"));
    var item = document.createElementNS(XULNS, "menuitem");
    item.setAttribute("label", label);
    item.setAttribute("value", value);
    if (description)
      item.setAttribute("description", description);

    if (index >= 0 && index < popup.childNodes.length)
      popup.insertBefore(item, popup.childNodes[index]);
    else
      popup.appendChild(item);
    return item;
  }

  removeItemAt(index) {
    var popup = this.menupopup;
    if (popup && 0 <= index && index < popup.childNodes.length) {
      var remove = popup.childNodes[index];
      popup.removeChild(remove);
      return remove;
    }
    return null;
  }

  removeAllItems() {
    this.selectedItem = null;
    var popup = this.menupopup;
    if (popup)
      this.removeChild(popup);
  }

  // --- Event handlers ---

  _onCommand(event) {
    if (event.target.parentNode.parentNode == this)
      this.selectedItem = event.target;
  }

  _onPopupShowing(event) {
    if (event.target.parentNode == this && this.selectedItem) {
      // Set active child when outermost menupopup opens
      if (this.menuBoxObject)
        this.menuBoxObject.activeChild = this.mSelectedInternal;
    }
  }

  _onKeyPress(event) {
    try {
      if (!event.defaultPrevented &&
          (event.keyCode == KeyEvent.DOM_VK_UP ||
           event.keyCode == KeyEvent.DOM_VK_DOWN ||
           event.keyCode == KeyEvent.DOM_VK_PAGE_UP ||
           event.keyCode == KeyEvent.DOM_VK_PAGE_DOWN ||
           event.keyCode == KeyEvent.DOM_VK_HOME ||
           event.keyCode == KeyEvent.DOM_VK_END ||
           event.keyCode == KeyEvent.DOM_VK_BACK_SPACE ||
           event.charCode > 0)) {
        // Start from currently selected item
        if (this.menuBoxObject) {
          this.menuBoxObject.activeChild = this.mSelectedInternal;
          if (this.menuBoxObject.handleKeyPress(event)) {
            this.menuBoxObject.activeChild.doCommand();
            event.preventDefault();
          }
        }
      }
    } catch(e) {
      // menuBoxObject may not exist in ESR 140
    }
  }
}


// ============================================
// BGMenuListEditable: editable menulist variant
// Replaces XBL binding menulist.xml#menulist-editable
// ============================================
class BGMenuListEditable extends BGMenuList {

  constructor() {
    super();
    this.mInputField = null;
  }

  connectedCallback() {
    // Build editable content if not already present
    if (!this.querySelector(".menulist-editable-box")) {
      // Editable input box
      var hbox = document.createXULElement("hbox");
      hbox.className = "menulist-editable-box textbox-input-box";
      hbox.setAttribute("flex", "1");
      if (this.hasAttribute("disabled"))
        hbox.setAttribute("disabled", this.getAttribute("disabled"));
      if (this.hasAttribute("readonly"))
        hbox.setAttribute("readonly", this.getAttribute("readonly"));
      if (this.hasAttribute("focused"))
        hbox.setAttribute("focused", this.getAttribute("focused"));

      var input = document.createElement("input");
      input.className = "menulist-editable-input";
      input.setAttribute("flex", "1");
      input.setAttribute("anonid", "input");
      input.setAttribute("allowevents", "true");
      // Inherit attributes
      if (this.hasAttribute("label"))
        input.value = this.getAttribute("label");
      if (this.hasAttribute("value"))
        input.value = this.getAttribute("value");
      if (this.hasAttribute("disabled"))
        input.disabled = true;
      if (this.hasAttribute("readonly"))
        input.readOnly = true;
      if (this.hasAttribute("placeholder"))
        input.placeholder = this.getAttribute("placeholder");

      hbox.appendChild(input);

      // Dropmarker
      var dropmarker = document.createXULElement("dropmarker");
      dropmarker.className = "menulist-dropmarker";
      dropmarker.setAttribute("type", "menu");
      if (this.hasAttribute("disabled"))
        dropmarker.setAttribute("disabled", this.getAttribute("disabled"));

      // Insert before menupopup
      var popup = this.menupopup;
      if (popup) {
        this.insertBefore(hbox, popup);
        this.insertBefore(dropmarker, popup);
      } else {
        this.appendChild(hbox);
        this.appendChild(dropmarker);
      }
    }

    // Run initial selection from parent
    this.setInitialSelection();

    // Attach command handler from parent
    this.addEventListener("command", this._onCommand.bind(this), true);

    // Editable-specific handlers
    this.addEventListener("focus", this._onFocus.bind(this), true);
    this.addEventListener("blur", this._onBlur.bind(this), true);
    this.addEventListener("popupshowing", this._onEditablePopupShowing.bind(this));
    this.addEventListener("keypress", this._onEditableKeyPress.bind(this));
  }

  // --- Properties ---

  get inputField() {
    if (!this.mInputField)
      this.mInputField = this.querySelector('[anonid="input"]');
    return this.mInputField;
  }

  get label() {
    return this.inputField.value;
  }

  set label(val) {
    this.inputField.value = val;
  }

  get value() {
    return this.inputField.value;
  }

  set value(val) {
    // Override menulist's value setter to refer to the inputField's value
    this.inputField.value = val;
    this.setAttribute("value", val);
    this.setAttribute("label", val);
    this._selectInputFieldValueInList();
  }

  get selectedItem() {
    // Ensure internal selection is in sync with inputField
    this._selectInputFieldValueInList();
    return this.mSelectedInternal;
  }

  set selectedItem(val) {
    var oldval = this.mSelectedInternal;
    if (oldval == val)
      return;

    if (val && !this.contains(val))
      return;

    // Set internal selection without triggering infinite loop
    this.setSelectionInternal(val);
    if (val) {
      // Editable menulist uses "label" as its "value"
      var labelVal = val.getAttribute("label");
      this.inputField.value = labelVal;
      this.setAttribute("value", labelVal);
      this.setAttribute("label", labelVal);
    }
    else {
      this.inputField.value = "";
      this.removeAttribute("value");
      this.removeAttribute("label");
    }

    // Fire events
    var selectEvent = document.createEvent("Events");
    selectEvent.initEvent("select", true, true);
    this.dispatchEvent(selectEvent);

    var changeEvent = document.createEvent("Events");
    changeEvent.initEvent("ValueChange", true, true);
    this.dispatchEvent(changeEvent);
  }

  get disableautoselect() {
    return this.hasAttribute("disableautoselect");
  }

  set disableautoselect(val) {
    if (val)
      this.setAttribute("disableautoselect", "true");
    else
      this.removeAttribute("disableautoselect");
  }

  get editor() {
    try {
      var nsIDOMNSEditableElement = Components.interfaces.nsIDOMNSEditableElement;
      return this.inputField.QueryInterface(nsIDOMNSEditableElement).editor;
    } catch(e) {
      return null;
    }
  }

  get readOnly() {
    return this.inputField.readOnly;
  }

  set readOnly(val) {
    this.inputField.readOnly = val;
    if (val)
      this.setAttribute("readonly", "true");
    else
      this.removeAttribute("readonly");
  }

  // --- Methods ---

  _selectInputFieldValueInList() {
    if (this.hasAttribute("disableautoselect"))
      return;

    // Find and select the menuitem that matches inputField's value
    var arr = null;
    var popup = this.menupopup;

    if (popup)
      arr = popup.getElementsByAttribute("label", this.inputField.value);

    this.setSelectionInternal(arr ? arr.item(0) : null);
  }

  setSelectionInternal(val) {
    // Set selected item internally without triggering infinite loop
    if (this.mSelectedInternal == val)
      return val;

    if (this.mSelectedInternal)
      this.mSelectedInternal.removeAttribute("selected");

    this.mSelectedInternal = val;

    if (val)
      val.setAttribute("selected", "true");

    // Do NOT change the "value", which is owned by inputField
    return val;
  }

  select() {
    this.inputField.select();
  }

  // --- Event handlers ---

  _onFocus(event) {
    this.setAttribute("focused", "true");
  }

  _onBlur(event) {
    this.removeAttribute("focused");
  }

  _onEditablePopupShowing(event) {
    if (event.target.parentNode == this) {
      // Focus the input field when popup opens
      try {
        if (document.commandDispatcher.focusedElement != this.inputField)
          this.inputField.focus();
      } catch(e) {}

      if (this.selectedItem && this.menuBoxObject) {
        this.menuBoxObject.activeChild = this.mSelectedInternal;
      }
    }
  }

  _onEditableKeyPress(event) {
    // Open popup on arrow up/down or F4
    if (!event.ctrlKey && !event.shiftKey) {
      if (event.keyCode == KeyEvent.DOM_VK_UP ||
          event.keyCode == KeyEvent.DOM_VK_DOWN ||
          (event.keyCode == KeyEvent.DOM_VK_F4 && !event.altKey)) {
        event.preventDefault();
        this.open = true;
      }
    }
  }
}


// ============================================
// BGMenuListCompact: compact menulist layout
// Replaces XBL binding menulist.xml#menulist-compact
// Minimal class - just changes the content layout order
// ============================================
class BGMenuListCompact extends BGMenuList {

  connectedCallback() {
    // Build compact layout: dropmarker, icon, label, menupopup
    if (!this.querySelector(".menulist-dropmarker")) {
      // Dropmarker comes first in compact layout
      var dropmarker = document.createXULElement("dropmarker");
      dropmarker.className = "menulist-dropmarker";
      dropmarker.setAttribute("type", "menu");
      if (this.hasAttribute("disabled"))
        dropmarker.setAttribute("disabled", this.getAttribute("disabled"));

      var icon = document.createXULElement("image");
      icon.className = "menulist-icon";
      if (this.hasAttribute("image"))
        icon.setAttribute("src", this.getAttribute("image"));

      var label = document.createXULElement("label");
      label.className = "menulist-label";
      if (this.hasAttribute("label"))
        label.setAttribute("value", this.getAttribute("label"));
      if (this.hasAttribute("crop"))
        label.setAttribute("crop", this.getAttribute("crop"));
      if (this.hasAttribute("accesskey"))
        label.setAttribute("accesskey", this.getAttribute("accesskey"));
      label.setAttribute("crop", "right");
      label.setAttribute("flex", "1");

      // Insert before menupopup
      var popup = this.menupopup;
      if (popup) {
        this.insertBefore(label, popup);
        this.insertBefore(icon, label);
        this.insertBefore(dropmarker, icon);
      } else {
        this.appendChild(dropmarker);
        this.appendChild(icon);
        this.appendChild(label);
      }
    }

    // Run initial selection and attach handlers from parent
    this.setInitialSelection();
    this.addEventListener("command", this._onCommand.bind(this), true);
    this.addEventListener("popupshowing", this._onPopupShowing.bind(this));
    this.addEventListener("keypress", this._onKeyPress.bind(this));
  }
}


// ============================================
// BGMenuListDescription: menulist with description label
// Replaces XBL binding menulist.xml#menulist-description
// ============================================
class BGMenuListDescription extends BGMenuList {

  connectedCallback() {
    // Build description layout: hbox(icon, label, description), dropmarker, menupopup
    if (!this.querySelector(".menulist-label-box")) {
      var hbox = document.createXULElement("hbox");
      hbox.className = "menulist-label-box";
      hbox.setAttribute("flex", "1");

      var icon = document.createXULElement("image");
      icon.className = "menulist-icon";
      if (this.hasAttribute("image"))
        icon.setAttribute("src", this.getAttribute("image"));
      hbox.appendChild(icon);

      var label = document.createXULElement("label");
      label.className = "menulist-label";
      if (this.hasAttribute("label"))
        label.setAttribute("value", this.getAttribute("label"));
      if (this.hasAttribute("crop"))
        label.setAttribute("crop", this.getAttribute("crop"));
      if (this.hasAttribute("accesskey"))
        label.setAttribute("accesskey", this.getAttribute("accesskey"));
      label.setAttribute("crop", "right");
      label.setAttribute("flex", "1");
      hbox.appendChild(label);

      // Description label (extra field)
      var descLabel = document.createXULElement("label");
      descLabel.className = "menulist-label menulist-description";
      if (this.hasAttribute("description"))
        descLabel.setAttribute("value", this.getAttribute("description"));
      descLabel.setAttribute("crop", "right");
      descLabel.setAttribute("flex", "10000");
      hbox.appendChild(descLabel);

      var dropmarker = document.createXULElement("dropmarker");
      dropmarker.className = "menulist-dropmarker";
      dropmarker.setAttribute("type", "menu");
      if (this.hasAttribute("disabled"))
        dropmarker.setAttribute("disabled", this.getAttribute("disabled"));

      // Insert before menupopup
      var popup = this.menupopup;
      if (popup) {
        this.insertBefore(dropmarker, popup);
        this.insertBefore(hbox, dropmarker);
      } else {
        this.appendChild(hbox);
        this.appendChild(dropmarker);
      }
    }

    // Run initial selection and attach handlers from parent
    this.setInitialSelection();
    this.addEventListener("command", this._onCommand.bind(this), true);
    this.addEventListener("popupshowing", this._onPopupShowing.bind(this));
    this.addEventListener("keypress", this._onKeyPress.bind(this));
  }
}


// --- Registration ---
// Register only if not already defined
if (!customElements.get("bg-menulist")) {
  customElements.define("bg-menulist", BGMenuList);
}
if (!customElements.get("bg-menulist-editable")) {
  customElements.define("bg-menulist-editable", BGMenuListEditable);
}
if (!customElements.get("bg-menulist-compact")) {
  customElements.define("bg-menulist-compact", BGMenuListCompact);
}
if (!customElements.get("bg-menulist-description")) {
  customElements.define("bg-menulist-description", BGMenuListDescription);
}
