/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * BGCommandController and BGCommandParams: pure JS replacements for removed
 * XPCOM components @mozilla.org/embedcomp/base-command-controller;1 and
 * @mozilla.org/embedcomp/command-params;1 (removed in Gecko ESR 140).
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * BGCommandParams: replacement for nsICommandParams XPCOM component.
 * Stores typed key-value pairs used by command controllers.
 */
class BGCommandParams {
  constructor() {
    this._params = new Map();
  }

  // nsICommandParams interface methods
  getValueType(name) {
    const entry = this._params.get(name);
    return entry ? entry.type : 0;
  }

  getBooleanValue(name) {
    const entry = this._params.get(name);
    return entry ? !!entry.value : false;
  }

  setCStringValue(name, value) {
    this._params.set(name, { type: "cstring", value: value });
  }

  getCStringValue(name) {
    const entry = this._params.get(name);
    return entry ? String(entry.value) : "";
  }

  getStringValue(name) {
    return this.getCStringValue(name);
  }

  setStringValue(name, value) {
    this.setCStringValue(name, value);
  }

  setBooleanValue(name, value) {
    this._params.set(name, { type: "boolean", value: !!value });
  }

  setLongValue(name, value) {
    this._params.set(name, { type: "long", value: Number(value) });
  }

  getLongValue(name) {
    const entry = this._params.get(name);
    return entry ? Number(entry.value) : 0;
  }

  setDoubleValue(name, value) {
    this._params.set(name, { type: "double", value: Number(value) });
  }

  getDoubleValue(name) {
    const entry = this._params.get(name);
    return entry ? Number(entry.value) : 0.0;
  }

  setISupportsValue(name, value) {
    this._params.set(name, { type: "isupports", value: value });
  }

  getISupportsValue(name) {
    const entry = this._params.get(name);
    return entry ? entry.value : null;
  }

  removeValue(name) {
    this._params.delete(name);
  }

  // nsISupports
  QueryInterface(iid) {
    return this;
  }
}

/**
 * BGCommandController: replacement for nsIControllerContext XPCOM component
 * (@mozilla.org/embedcomp/base-command-controller;1, removed in ESR 140).
 * Implements nsIController, nsIControllerContext, nsIInterfaceRequestor.
 */
class BGCommandController {
  constructor() {
    this._commandTable = null;
    this._context = null;
  }

  // nsIControllerContext
  init(context) {
    this._context = context;
    this._commandTable = new BGCommandTable();
  }

  setCommandContext(context) {
    this._context = context;
  }

  // nsIController
  supportsCommand(command) {
    return this._commandTable ? this._commandTable.supportsCommand(command) : false;
  }

  isCommandEnabled(command) {
    if (!this._commandTable) return false;
    return this._commandTable.isCommandEnabled(command, this._context);
  }

  doCommand(command) {
    if (this._commandTable) {
      this._commandTable.doCommand(command, this._context);
    }
  }

  doCommandWithParams(command, params) {
    if (this._commandTable) {
      this._commandTable.doCommandWithParams(command, params, this._context);
    }
  }

  getCommandStateWithParams(command, params) {
    if (this._commandTable) {
      this._commandTable.getCommandStateWithParams(command, params, this._context);
    }
  }

  onEvent(eventName) {}

  // nsIInterfaceRequestor
  getInterface(iid) {
    // When asked for nsIControllerCommandTable, return our command table
    if (this._commandTable) {
      return this._commandTable;
    }
    return this;
  }

  // nsISupports
  QueryInterface(iid) {
    return this;
  }
}

/**
 * BGCommandTable: replacement for nsIControllerCommandTable.
 * Stores registered command handlers and dispatches to them.
 */
class BGCommandTable {
  constructor() {
    this._commands = new Map();
  }

  registerCommand(commandName, command) {
    this._commands.set(commandName, command);
  }

  unregisterCommand(commandName) {
    this._commands.delete(commandName);
  }

  supportsCommand(commandName) {
    return this._commands.has(commandName);
  }

  isCommandEnabled(commandName, context) {
    const cmd = this._commands.get(commandName);
    if (cmd && typeof cmd.isCommandEnabled === "function") {
      return cmd.isCommandEnabled(commandName, context);
    }
    return false;
  }

  doCommand(commandName, context) {
    const cmd = this._commands.get(commandName);
    if (cmd && typeof cmd.doCommand === "function") {
      cmd.doCommand(commandName, context);
    }
  }

  doCommandWithParams(commandName, params, context) {
    const cmd = this._commands.get(commandName);
    if (cmd) {
      if (typeof cmd.doCommandParams === "function") {
        cmd.doCommandParams(commandName, params, context);
      } else if (typeof cmd.doCommand === "function") {
        cmd.doCommand(commandName, context);
      }
    }
  }

  getCommandStateWithParams(commandName, params, context) {
    const cmd = this._commands.get(commandName);
    if (cmd && typeof cmd.getCommandStateParams === "function") {
      cmd.getCommandStateParams(commandName, params, context);
    }
  }
}
