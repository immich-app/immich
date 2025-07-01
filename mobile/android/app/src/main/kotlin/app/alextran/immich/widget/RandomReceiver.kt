package app.alextran.immich.widget

import HomeWidgetGlanceWidgetReceiver
import android.appwidget.AppWidgetManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class RandomReceiver : HomeWidgetGlanceWidgetReceiver<RandomWidget>() {
  override val glanceAppWidget = RandomWidget()

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    super.onUpdate(context, appWidgetManager, appWidgetIds)

    val cfg = WidgetConfig(WidgetType.RANDOM, HashMap())

    appWidgetIds.forEach { widgetID ->
      ImageDownloadWorker.enqueue(context, widgetID, cfg)
      Log.w("WIDGET_UPDATE", "WORKER ENQUEUE CALLED: $widgetID")
    }
  }
}

