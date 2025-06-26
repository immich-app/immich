package app.alextran.immich.widget

import HomeWidgetGlanceState
import HomeWidgetGlanceStateDefinition
import android.content.Context
import androidx.glance.appwidget.*
import androidx.glance.*
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.GlanceStateDefinition


class RandomWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<HomeWidgetGlanceState>
    get() = HomeWidgetGlanceStateDefinition()

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    // fetch a random photo from server
    provideContent {

      val prefs = currentState<HomeWidgetGlanceState>().preferences

      val serverURL = prefs.getString("widget_auth_token", "")
      val sessionKey = prefs.getString("widget_auth_token", "")



      PhotoWidget(image = null, error = null, subtitle = id.hashCode().toString())
    }
  }

  override suspend fun onDelete(context: Context, glanceId: GlanceId) {
    super.onDelete(context, glanceId)
    ImageDownloadWorker.cancel(context, glanceId)
  }
}

class RefreshAction : ActionCallback {
  override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
    // Clear the state to show loading screen
    updateAppWidgetState(context, glanceId) { prefs ->
      prefs.clear()
    }
    ImageGlanceWidget().update(context, glanceId)

    parameters.

    // Enqueue a job for each size the widget can be shown in the current state
    // (i.e landscape/portrait)
    GlanceAppWidgetManager(context).getAppWidgetSizes(glanceId).forEach { size ->
      ImageWorker.enqueue(context, size, glanceId, force = true)
    }
  }
}
