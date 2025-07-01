package app.alextran.immich.widget

import HomeWidgetGlanceState
import HomeWidgetGlanceStateDefinition
import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.datastore.preferences.core.MutablePreferences
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import java.io.File
import java.util.prefs.Preferences

class RandomWidget : GlanceAppWidget() {
  override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

  override suspend fun provideGlance(context: Context, id: GlanceId) {

      provideContent {
        val prefs = currentState<MutablePreferences>()
        val imageUUID = prefs[stringPreferencesKey("uuid")]
        var bitmap: Bitmap? = null

        if (imageUUID != null) {
          // fetch a random photo from server
          val file = File(context.cacheDir, "widget_image_$imageUUID.jpg")

          if (file.exists()) {
            bitmap = loadScaledBitmap(file, 500, 500)
          }
        }

        PhotoWidget(image = bitmap, error = "NOPE", subtitle = "hello")
      }
  }


  override suspend fun onDelete(context: Context, glanceId: GlanceId) {
    super.onDelete(context, glanceId)
    ImageDownloadWorker.cancel(context, glanceId)
  }
}
