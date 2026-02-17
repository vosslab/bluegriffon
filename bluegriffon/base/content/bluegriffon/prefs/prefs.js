ChromeUtils.importESModule("resource://gre/modules/l10nHelper.sys.mjs");
ChromeUtils.importESModule("resource://gre/modules/prompterHelper.sys.mjs");

function Startup()
{
  //window.sizeToContent();
  GetUIElements();

  var site = "";
  try {
    site = Services.prefs.getBoolPref("bluegriffon.license.site");
  }
  catch(e) {}

  if (site) {
    document.documentElement.setAttribute("sitelicense", "true");
    document.documentElement.showPane(gDialog.generalPrefPane);
  }
}
