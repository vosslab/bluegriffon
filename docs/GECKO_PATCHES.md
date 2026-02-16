# Gecko patches

Documentation of the Gecko patches required for BlueGriffon. These patches
were written for the 2017-era Gecko (commit `042b84a`, roughly Firefox 55)
and need to be regenerated for modern Gecko (ESR 140+).

## gecko_dev_content.patch

The main patch modifies 103 files across the Gecko source tree. It covers
seven areas of functionality that BlueGriffon requires from Gecko.

### Editor core (primary focus)

The largest group of changes. BlueGriffon needs a richer editing API than
Firefox exposes.

| File | Change |
| --- | --- |
| `editor/libeditor/EditorBase.cpp` | Add mouse observer interface, custom event handling, preference-driven paragraph creation on Enter key (`bluegriffon.returnKey.createsParagraph`) |
| `editor/libeditor/EditorBase.h` | Declare mouse observer methods and new editor capabilities |
| `editor/libeditor/EditorEventListener.cpp` | Route mouse events to the BlueGriffon mouse observer interface |
| `editor/libeditor/EditorEventListener.h` | Declare mouse event routing |
| `editor/libeditor/HTMLEditor.cpp` | Extend HTML editor with BlueGriffon-specific behaviors, use its own `EditorOverride.css` |
| `editor/libeditor/HTMLEditor.h` | Declare extended HTML editor interface |
| `editor/libeditor/HTMLEditorDataTransfer.cpp` | Custom drag-and-drop handling for images (`bluegriffon.drag_n_drop.images.as_url`), paste behavior |
| `editor/libeditor/HTMLEditorEventListener.cpp` | Custom mouse event handling for the WYSIWYG editor |
| `editor/libeditor/HTMLEditorEventListener.h` | Declare custom event listener |
| `editor/libeditor/HTMLEditorObjectResizer.cpp` | Object resizing handles in the editor |
| `editor/libeditor/HTMLAbsPositionEditor.cpp` | Absolute positioning editor for drag-to-position elements |
| `editor/libeditor/HTMLAnonymousNodeEditor.cpp` | Anonymous node management for editor UI overlays |
| `editor/libeditor/HTMLEditRules.cpp` | Custom edit rules for HTML editing behavior |
| `editor/libeditor/HTMLEditUtils.cpp` | Editor utility functions |
| `editor/libeditor/HTMLStyleEditor.cpp` | CSS style manipulation from the editor |
| `editor/libeditor/CSSEditUtils.cpp` | CSS property editing, preference-driven color output (`bluegriffon.css.colors.type`, `bluegriffon.css.colors.names.enabled`) |
| `editor/libeditor/CSSEditUtils.h` | Declare CSS editing utilities |
| `editor/libeditor/TextEditorDataTransfer.cpp` | Text editor paste/transfer handling |
| `editor/libeditor/WSRunObject.cpp` | Whitespace run handling in the editor |
| `editor/composer/nsComposerCommands.cpp` | Composer command implementations |
| `editor/composer/nsEditorSpellCheck.cpp` | Spell checking integration |
| `editor/moz.build` | Build system: include BlueGriffon editor IDL files |
| `editor/nsIEditor.idl` | Extend the editor IDL interface with new methods |
| `editor/nsIHTMLEditor.idl` | Extend the HTML editor IDL interface |

### Serialization and encoding

Changes to how Gecko serializes HTML/XHTML for copy, save, and source view.
Critical for a WYSIWYG editor that needs clean, correct output.

| File | Change |
| --- | --- |
| `dom/base/nsHTMLContentSerializer.cpp` | Hide elements in the BlueGriffon namespace (`http://disruptive-innovations.com/zoo/bluegriffon`) during serialization, improved indentation for table elements |
| `dom/base/nsXHTMLContentSerializer.cpp` | Remove forced output wrapping, add line breaks for table structure elements (`thead`, `tfoot`, `td`), fix entity encoding in `script`/`style` |
| `dom/base/nsXMLContentSerializer.cpp` | Attribute wrapping at column limit, duplicate xmlns attribute prevention |
| `dom/base/nsDocumentEncoder.cpp` | Skip `script`/`style` content during copy, preference-controlled absolute links (`clipboard.absoluteLinks`), disable range promotion for copy (marked `// BLUEGRIFFON`) |
| `dom/base/nsIDocumentEncoder.idl` | Add `OutputEncodeCharacterEntities` flag (bit 29) for numeric entity output |
| `dom/base/nsDocument.cpp` | Add `GetHasXMLDeclaration()` method to detect XML declarations |
| `dom/interfaces/core/nsIDOMDocument.idl` | Expose XML declaration detection in the DOM interface |

### Clipboard and copy-paste

Enable XHTML-aware clipboard handling for the editor.

| File | Change |
| --- | --- |
| `dom/base/nsCopySupport.cpp` | Treat `application/xhtml+xml` as HTML for clipboard, preference-controlled absolute links |
| `widget/cocoa/nsClipboard.mm` | macOS RTF clipboard support (`bluegriffon.osx.clipboard.rtf.enabled`) |
| `widget/cocoa/nsCocoaUtils.mm` | macOS clipboard utilities |

### Color picker

BlueGriffon adds an enhanced color picker with alpha channel support.

| File | Change |
| --- | --- |
| `dom/ipc/ColorPickerParent.cpp` | IPC color picker with alpha support |
| `dom/ipc/ColorPickerParent.h` | Declare color picker parent |
| `dom/ipc/PBrowser.ipdl` | IPC protocol for color picker messages |
| `dom/ipc/TabChild.cpp` | Tab child color picker handler |
| `dom/ipc/TabChild.h` | Declare tab child handler |
| `dom/ipc/TabParent.cpp` | Tab parent color picker handler |
| `dom/ipc/TabParent.h` | Declare tab parent handler |
| `widget/nsIColorPicker.idl` | Color picker IDL with alpha channel |
| `widget/nsColorPickerProxy.cpp` | Color picker proxy implementation |
| `widget/cocoa/nsColorPicker.h` | macOS color picker with alpha |
| `widget/cocoa/nsColorPicker.mm` | macOS color picker implementation |
| `widget/gtk/nsColorPicker.cpp` | GTK color picker with alpha |
| `widget/gtk/nsColorPicker.h` | GTK color picker header |
| `widget/windows/nsColorPicker.cpp` | Windows color picker with alpha |
| `widget/windows/nsColorPicker.h` | Windows color picker header |
| `layout/forms/nsColorControlFrame.cpp` | Color control frame for the picker |

### DOM and focus

Changes to focus management and DOM handling for the editor.

| File | Change |
| --- | --- |
| `dom/base/nsFocusManager.cpp` | Reorder popup focus logic so content shell caret position takes priority over XUL popups |
| `dom/base/nsGkAtomList.h` | Add `showtransparency` atom |
| `dom/html/HTMLInputElement.cpp` | Custom input element behavior |
| `dom/html/HTMLInputElement.h` | Declare custom input behavior |

### Parser and content sinks

XML/HTML parser modifications for editor-aware content loading.

| File | Change |
| --- | --- |
| `dom/xbl/nsXBLContentSink.cpp` | XBL content sink for editor |
| `dom/xbl/nsXBLContentSink.h` | Declare XBL content sink |
| `dom/xml/nsXMLContentSink.cpp` | XML content sink modifications |
| `dom/xml/nsXMLFragmentContentSink.cpp` | XML fragment sink for paste operations |
| `dom/xslt/xslt/txMozillaStylesheetCompiler.cpp` | XSLT stylesheet handling |
| `dom/xul/nsXULContentSink.cpp` | XUL content sink |
| `parser/htmlparser/nsExpatDriver.cpp` | Expat XML parser driver modifications |
| `parser/htmlparser/nsIExpatSink.idl` | Expat sink IDL changes |
| `parser/xml/nsSAXXMLReader.cpp` | SAX XML reader |
| `rdf/base/nsRDFContentSink.cpp` | RDF content sink |

### CSS and layout

CSS property handling and rendering changes for the editor.

| File | Change |
| --- | --- |
| `layout/style/Declaration.cpp` | Prevent `border` shorthand from resetting `border-image` (marked `/* BLUEGRIFFON */`) |
| `layout/style/nsCSSParser.cpp` | CSS parser modifications |
| `layout/style/nsCSSProps.cpp` | CSS property definitions |
| `layout/style/nsCSSValue.cpp` | CSS value handling |
| `layout/base/nsPresContext.cpp` | Presentation context |
| `layout/base/nsPresContext.h` | Declare presentation context changes |

### Graphics and fonts

| File | Change |
| --- | --- |
| `gfx/src/nsColor.cpp` | Color conversion utilities |
| `gfx/src/nsColor.h` | Color utility declarations |
| `gfx/webrender_bindings/src/bindings.rs` | WebRender bindings |
| `third_party/rust/core-text/.cargo-checksum.json` | macOS font descriptor checksum |
| `third_party/rust/core-text/src/font_descriptor.rs` | macOS font descriptor |

### Security

| File | Change |
| --- | --- |
| `caps/nsScriptSecurityManager.cpp` | Early return for URI loads with certain flags, allowing the editor to load local resources |

### Platform and build

| File | Change |
| --- | --- |
| `extensions/moz.build` | Build system for extensions |
| `netwerk/protocol/res/nsResProtocolHandler.cpp` | Resource protocol handler |
| `python/mozboot/mozboot/osx.py` | macOS bootstrap script |
| `storage/StorageBaseStatementInternal.h` | Storage API header |
| `toolkit/mozapps/installer/packager.mk` | Packaging makefile |
| `toolkit/content/xul.css` | XUL stylesheet |
| `widget/PuppetWidget.cpp` | Puppet widget for content processes |
| `widget/ScreenManager.cpp` | Screen manager |
| `widget/nsIScreenManager.idl` | Screen manager IDL |
| `widget/uikit/nsScreenManager.mm` | UIKit screen manager |
| `widget/cocoa/nsCocoaWindow.mm` | macOS window management |
| `widget/cocoa/nsMenuItemX.mm` | macOS menu items |
| `widget/cocoa/nsNativeThemeCocoa.mm` | macOS native theme |
| `widget/gtk/mozgtk/mozgtk.c` | GTK widget library |

### Toolkit and UI

| File | Change |
| --- | --- |
| `browser/base/content/baseMenuOverlay.xul` | Fix keyboard shortcut entity name |
| `browser/locales/en-US/chrome/browser/baseMenuOverlay.dtd` | Fix DTD entity name |
| `toolkit/components/passwordmgr/nsLoginManagerPrompter.js` | Login manager |
| `toolkit/components/satchel/FormHistory.jsm` | Form history |
| `toolkit/components/telemetry/TelemetryStartup.js` | Telemetry startup |
| `toolkit/content/widgets/menu.xml` | Menu widget |
| `toolkit/content/widgets/menulist.xml` | Menulist widget |
| `toolkit/content/widgets/tree.xml` | Tree widget |
| `toolkit/mozapps/extensions/content/extensions.js` | Extensions manager, window type check for `bluegriffon` |
| `toolkit/mozapps/extensions/content/extensions.xul` | Extensions UI |
| `toolkit/mozapps/extensions/internal/XPIProvider.jsm` | XPI extension provider |
| `toolkit/mozapps/handling/nsContentDispatchChooser.js` | Content dispatch chooser |
| `image/imgICache.idl` | Image cache IDL |

## gecko_dev_idl.patch

A single new file addition.

| File | Change |
| --- | --- |
| `editor/nsIEditorMouseObserver.idl` | **New file.** Defines the `nsIEditorMouseObserver` XPCOM interface with three methods: `MouseDown`, `MouseUp`, `MouseMove`. Each takes client coordinates, a target DOM node, and a shift-key flag. Returns boolean to indicate if the event was handled. This enables BlueGriffon to observe and intercept mouse events in the editor canvas. |

## BlueGriffon-specific preferences

The patch introduces several BlueGriffon preferences read via `Preferences::GetBool`
or `GetCharPref`:

| Preference | Default | Purpose |
| --- | --- | --- |
| `bluegriffon.returnKey.createsParagraph` | `true` | Enter key creates `<p>` instead of `<br>` |
| `bluegriffon.drag_n_drop.images.as_url` | `true` | Drag-and-drop images insert as URL reference |
| `bluegriffon.osx.clipboard.rtf.enabled` | (unset) | Enable RTF clipboard on macOS |
| `bluegriffon.css.colors.type` | (unset) | CSS color output format |
| `bluegriffon.css.colors.names.enabled` | (unset) | Output CSS color names instead of hex |
| `clipboard.absoluteLinks` | `true` | Convert relative links to absolute on copy |

## Summary

The content patch makes BlueGriffon possible by:

1. **Extending the editor API** with mouse observation, custom event handling,
   and richer HTML manipulation methods
2. **Fixing HTML/XHTML serialization** for correct source output, including
   a custom BlueGriffon namespace that hides editor-internal elements
3. **Adding an alpha-aware color picker** across all three platforms
4. **Adjusting clipboard behavior** for XHTML and preference-controlled link
   handling
5. **Modifying CSS parsing** to preserve `border-image` and support configurable
   color output formats
