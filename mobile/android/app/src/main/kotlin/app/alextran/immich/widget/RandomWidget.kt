package app.alextran.immich.widget

import HomeWidgetGlanceState
import HomeWidgetGlanceStateDefinition
import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.state.GlanceStateDefinition
import java.io.File

class RandomWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<HomeWidgetGlanceState>
    get() = HomeWidgetGlanceStateDefinition()

  override suspend fun provideGlance(context: Context, id: GlanceId) {
      Log.w("WIDGET_UPDATE", "PROVIDED GLANCE")
      // fetch a random photo from server
      val appWidgetId = GlanceAppWidgetManager(context).getAppWidgetId(id)
      val file = File(context.cacheDir, "widget_image_$appWidgetId.jpg")

      var bitmap: Bitmap? = null

      if (file.exists()) {
        bitmap = loadScaledBitmap(file, 500, 500)
      }

      provideContent {
        PhotoWidget(image = bitmap, error = null, subtitle = "hello")
      }
  }


  override suspend fun onDelete(context: Context, glanceId: GlanceId) {
    super.onDelete(context, glanceId)
    ImageDownloadWorker.cancel(context, glanceId)
  }
}
