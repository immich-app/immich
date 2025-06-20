package app.alextran.immich.widget

import HomeWidgetGlanceState
import HomeWidgetGlanceStateDefinition
import android.content.Context
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.state.GlanceStateDefinition


class RandomWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<HomeWidgetGlanceState>
    get() = HomeWidgetGlanceStateDefinition()

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val bitmap = downloadBitmap("https://picsum.photos/600")

    // fetch a random photo from server
    provideContent {
      val prefs = currentState<HomeWidgetGlanceState>().preferences

      val serverURL = prefs.getString("widget_auth_token", "")
      val sessionKey = prefs.getString("widget_auth_token", "")


      PhotoWidget(imageURI = null, error = null, subtitle = id.hashCode().toString())
    }
  }
}
