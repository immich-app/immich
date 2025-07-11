package app.alextran.immich.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import es.antonborri.home_widget.HomeWidgetPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MemoryReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget = PhotoWidget()

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)

    appWidgetIds.forEach { widgetID ->
      ImageDownloadWorker.enqueuePeriodic(context, widgetID, WidgetType.MEMORIES)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    val fromMainApp = intent.getBooleanExtra(HomeWidgetPlugin.TRIGGERED_FROM_HOME_WIDGET, false)

    // Launch coroutine to setup a single shot if the app requested the update
    if (fromMainApp) {
      CoroutineScope(Dispatchers.Default).launch {
        val provider = ComponentName(context, MemoryReceiver::class.java)
        val glanceIds = AppWidgetManager.getInstance(context).getAppWidgetIds(provider)

        glanceIds.forEach { widgetID ->
          ImageDownloadWorker.singleShot(context, widgetID, WidgetType.MEMORIES)
        }
      }
    }

    super.onReceive(context, intent)
  }
}

