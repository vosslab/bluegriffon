var { CssInspector, CSSParser } = ChromeUtils.importESModule("resource://gre/modules/cssInspector.sys.mjs");

function OnStylesPaneLoad()
{
  GetUIElements();
  TogglePolicyRadiogroup(gDialog.cssPolicyRadiogroup);
}

function TogglePolicyRadiogroup(aElt)
{
  switch (aElt.value) {
    case "automatic":
      SetEnabledElementAndControl(gDialog.cssPrefixLabel, true);
      break;
    default:
      SetEnabledElementAndControl(gDialog.cssPrefixLabel, false);
      break;
  }
}

function CleanPrefixes()
{
  CssInspector.cleanPrefixes();
}