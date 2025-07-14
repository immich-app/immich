package app.alextran.immich.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import es.antonborri.home_widget.HomeWidgetPlugin
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class RandomReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget = PhotoWidget()

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)

    appWidgetIds.forEach { widgetID ->
      ImageDownloadWorker.enqueuePeriodic(context, widgetID, WidgetType.RANDOM)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    val fromMainApp = intent.getBooleanExtra(HomeWidgetPlugin.TRIGGERED_FROM_HOME_WIDGET, false)

    // Launch coroutine to setup a single shot if the app requested the update
    if (fromMainApp) {
      CoroutineScope(Dispatchers.Default).launch {
        val provider = ComponentName(context, RandomReceiver::class.java)
        val glanceIds = AppWidgetManager.getInstance(context).getAppWidgetIds(provider)

        glanceIds.forEach { widgetID ->
          ImageDownloadWorker.singleShot(context, widgetID, WidgetType.RANDOM)
        }
      }
    }

    super.onReceive(context, intent)
  }

  override fun onDeleted(context: Context, appWidgetIds: IntArray) {
    super.onDeleted(context, appWidgetIds)
    CoroutineScope(Dispatchers.Default).launch {
      appWidgetIds.forEach { id ->
        ImageDownloadWorker.cancel(context, id)
      }
    }
  }
}
