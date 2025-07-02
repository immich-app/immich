package app.alextran.immich.widget

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.ui.graphics.Color
import androidx.datastore.preferences.core.MutablePreferences
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.layout.Box
import androidx.glance.layout.ContentScale
import androidx.glance.layout.fillMaxSize
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.Text
import app.alextran.immich.R
import java.io.File

class PhotoWidget : GlanceAppWidget() {
  override var stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition

  override suspend fun provideGlance(context: Context, id: GlanceId) {
      provideContent {
        val prefs = currentState<MutablePreferences>()

        val imageUUID = prefs[kImageUUID]
        val subtitle: String? = prefs[kSubtitleText]
        var bitmap: Bitmap? = null

        if (imageUUID != null) {
          // fetch a random photo from server
          val file = File(context.cacheDir, imageFilename(imageUUID))

          if (file.exists()) {
            bitmap = loadScaledBitmap(file, 500, 500)
          }
        }

        // WIDGET CONTENT
        Box(
          modifier = GlanceModifier
            .fillMaxSize()
            .background(Color.White)
        ) {
          if (bitmap != null) {
            Image(
              provider = ImageProvider(bitmap),
              contentDescription = "Widget Image",
              contentScale = ContentScale.Crop,
              modifier = GlanceModifier.fillMaxSize()
            )
            if (subtitle != null)
              Text(subtitle)
          } else {
            Image(
              provider = ImageProvider(R.drawable.splash),
              contentDescription = null,
            )
          }
        }
      }
  }

  override suspend fun onDelete(context: Context, glanceId: GlanceId) {
    super.onDelete(context, glanceId)
    ImageDownloadWorker.cancel(context, glanceId)
  }
}
