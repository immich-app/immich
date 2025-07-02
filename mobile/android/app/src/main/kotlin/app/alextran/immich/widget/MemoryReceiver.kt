package app.alextran.immich.widget

import HomeWidgetGlanceWidgetReceiver
import android.appwidget.AppWidgetManager
import android.content.Context

class MemoryReceiver : HomeWidgetGlanceWidgetReceiver<PhotoWidget>() {
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
}

