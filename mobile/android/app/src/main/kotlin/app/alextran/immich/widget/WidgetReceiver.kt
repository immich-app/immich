package app.alextran.immich.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import app.alextran.immich.widget.model.*
import es.antonborri.home_widget.HomeWidgetPlugin

abstract class WidgetReceiver(private val widgetType: WidgetType) : GlanceAppWidgetReceiver() {
  override val glanceAppWidget = PhotoWidget()

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)

    appWidgetIds.forEach { widgetID ->
      ImageDownloadWorker.enqueuePeriodic(context, widgetID, widgetType)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    val fromMainApp = intent.getBooleanExtra(HomeWidgetPlugin.TRIGGERED_FROM_HOME_WIDGET, false)
    val provider = ComponentName(context, this::class.java)
    val glanceIds = AppWidgetManager.getInstance(context).getAppWidgetIds(provider)

    // Launch coroutine to setup a single shot if the app requested the update
    if (fromMainApp) {
      glanceIds.forEach { widgetID ->
        ImageDownloadWorker.singleShot(context, widgetID, widgetType)
      }
    }

    // make sure the periodic jobs are running
    glanceIds.forEach { widgetID ->
      ImageDownloadWorker.enqueuePeriodic(context, widgetID, widgetType)
    }

    super.onReceive(context, intent)
  }

  override fun onDeleted(context: Context, appWidgetIds: IntArray) {
    super.onDeleted(context, appWidgetIds)
    appWidgetIds.forEach { id ->
      ImageDownloadWorker.cancel(context, id)
    }
  }
}

class MemoryReceiver : WidgetReceiver(WidgetType.MEMORIES)

class RandomReceiver : WidgetReceiver(WidgetType.RANDOM)
