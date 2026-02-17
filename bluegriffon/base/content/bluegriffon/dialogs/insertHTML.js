var { EditorUtils } = ChromeUtils.importESModule("resource://gre/modules/editorHelper.sys.mjs");

function Startup()
{
  GetUIElements();
#ifndef XP_MACOSX
  CenterDialogOnOpener();
#endif
}

function onAccept()
{
  var editor = EditorUtils.getCurrentEditor();

  editor.beginTransaction();
  editor.insertHTML(gDialog.htmlTextbox.value);
  window.opener.MakePhpAndCommentsVisible(EditorUtils.getCurrentDocument());
  editor.endTransaction();

  return true;
}
