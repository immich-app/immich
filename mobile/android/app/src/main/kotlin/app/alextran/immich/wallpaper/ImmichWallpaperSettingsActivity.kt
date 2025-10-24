package app.alextran.immich.wallpaper

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import app.alextran.immich.MainActivity
import app.alextran.immich.R

class ImmichWallpaperSettingsActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Directly open Immich settings without showing intermediate screen
    openImmichSettings()
  }

  private fun openImmichSettings() {
    val intent = Intent(Intent.ACTION_VIEW, SETTINGS_URI, this, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    startActivity(intent)
    finish()
  }

  companion object {
    private val SETTINGS_URI: Uri = Uri.parse("immich://live-wallpaper/settings")
  }
}
