package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import java.io.File

class RandomWidget : GlanceAppWidget() {
  override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

  override suspend fun provideGlance(context: Context, id: GlanceId) {

      provideContent {
        val prefs = currentState<MutablePreferences>()
        val imageUUID = prefs[stringPreferencesKey("uuid")]

        val subtitle: String? = prefs[stringPreferencesKey("subtitle")]
        var bitmap: Bitmap? = null
        var loggedIn = true

        if (imageUUID != null) {
          // fetch a random photo from server
          val file = File(context.cacheDir, "widget_image_$imageUUID.jpg")

          if (file.exists()) {
            bitmap = loadScaledBitmap(file, 500, 500)
          }
        } else if (ImmichAPI.getServerConfig(context) == null) {
          loggedIn = false
        }

        PhotoView(image = bitmap, subtitle = subtitle, loggedIn = loggedIn)
      }
  }


  override suspend fun onDelete(context: Context, glanceId: GlanceId) {
    super.onDelete(context, glanceId)
    ImageDownloadWorker.cancel(context, glanceId)
  }
}
