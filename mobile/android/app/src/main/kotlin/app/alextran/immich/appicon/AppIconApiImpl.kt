package app.alextran.immich.appicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager

/**
 * Switches the launcher icon by toggling the `.AppIcon*` activity-aliases
 * declared in the AndroidManifest. Exactly one alias is enabled at a time;
 * the aliases all target MainActivity.
 */
class AppIconApiImpl(context: Context) : AppIconApi {
  private val ctx: Context = context.applicationContext

  companion object {
    private const val DEFAULT_ICON = "classic"
    private val ICONS =
      listOf("classic", "midnight", "ocean", "sunset", "forest", "blossom", "ink", "neon", "gold")
  }

  private fun componentFor(iconId: String): ComponentName {
    val alias = "AppIcon" + iconId.replaceFirstChar { it.uppercase() }
    return ComponentName(ctx.packageName, "app.alextran.immich.$alias")
  }

  override fun setAppIcon(iconId: String, callback: (Result<Unit>) -> Unit) {
    if (iconId !in ICONS) {
      callback(Result.failure(FlutterError("invalid_icon", "Unknown app icon: $iconId")))
      return
    }

    val pm = ctx.packageManager
    for (icon in ICONS) {
      val state = if (icon == iconId) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      } else {
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      }
      pm.setComponentEnabledSetting(componentFor(icon), state, PackageManager.DONT_KILL_APP)
    }
    callback(Result.success(Unit))
  }

  override fun getAppIcon(): String {
    val pm = ctx.packageManager
    for (icon in ICONS) {
      if (pm.getComponentEnabledSetting(componentFor(icon)) ==
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      ) {
        return icon
      }
    }
    return DEFAULT_ICON
  }
}
