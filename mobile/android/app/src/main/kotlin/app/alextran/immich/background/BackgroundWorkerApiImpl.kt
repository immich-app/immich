package app.alextran.immich.background

import android.content.Context
import android.content.SharedPreferences
import android.provider.MediaStore
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

private const val TAG = "BackgroundWorkerApiImpl"

class BackgroundWorkerApiImpl(context: Context) : BackgroundWorkerFgHostApi {
  private val ctx: Context = context.applicationContext

  override fun enable() {
    enqueueMediaObserver(ctx)
  }

  override fun configure(settings: BackgroundWorkerSettings) {
    BackgroundWorkerPreferences(ctx).updateSettings(settings)
    enqueueMediaObserver(ctx)
  }

  override fun disable() {
    WorkManager.getInstance(ctx).apply {
      cancelUniqueWork(OBSERVER_WORKER_NAME)
      cancelUniqueWork(BACKGROUND_WORKER_NAME)
    }
    Log.i(TAG, "Cancelled background upload tasks")
  }

  companion object {
    const val BACKGROUND_WORKER_NAME = "immich/BackgroundWorkerV1"
    private const val OBSERVER_WORKER_NAME = "immich/MediaObserverV1"

    fun enqueueMediaObserver(ctx: Context) {
      val settings = BackgroundWorkerPreferences(ctx).getSettings()
      val constraints = Constraints.Builder().apply {
        addContentUriTrigger(MediaStore.Images.Media.INTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Video.Media.INTERNAL_CONTENT_URI, true)
        addContentUriTrigger(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true)
        setTriggerContentUpdateDelay(settings.minimumDelaySeconds, TimeUnit.SECONDS)
        setTriggerContentMaxDelay(settings.minimumDelaySeconds * 10, TimeUnit.MINUTES)
        setRequiresCharging(settings.requiresCharging)
      }.build()

      val work = OneTimeWorkRequest.Builder(MediaObserver::class.java)
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(OBSERVER_WORKER_NAME, ExistingWorkPolicy.REPLACE, work)

      Log.i(
        TAG,
        "Enqueued media observer worker with name: $OBSERVER_WORKER_NAME and settings: $settings"
      )
    }

    fun enqueueBackgroundWorker(ctx: Context) {
      val constraints = Constraints.Builder().setRequiresBatteryNotLow(true).build()

      val work = OneTimeWorkRequest.Builder(BackgroundWorker::class.java)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
        .build()
      WorkManager.getInstance(ctx)
        .enqueueUniqueWork(BACKGROUND_WORKER_NAME, ExistingWorkPolicy.KEEP, work)

      Log.i(TAG, "Enqueued background worker with name: $BACKGROUND_WORKER_NAME")
    }
  }
}

private class BackgroundWorkerPreferences(private val ctx: Context) {
  companion object {
    private const val SHARED_PREF_NAME = "Immich::BackgroundWorker"
    private const val SHARED_PREF_MIN_DELAY_KEY = "BackgroundWorker::minDelaySeconds"
    private const val SHARED_PREF_REQUIRE_CHARGING_KEY = "BackgroundWorker::requireCharging"

    private const val DEFAULT_MIN_DELAY_SECONDS = 30L
    private const val DEFAULT_REQUIRE_CHARGING = false
  }

  private val sp: SharedPreferences by lazy {
    ctx.getSharedPreferences(SHARED_PREF_NAME, Context.MODE_PRIVATE)
  }

  fun updateSettings(settings: BackgroundWorkerSettings) {
    sp.edit().apply {
      putLong(SHARED_PREF_MIN_DELAY_KEY, settings.minimumDelaySeconds)
      putBoolean(SHARED_PREF_REQUIRE_CHARGING_KEY, settings.requiresCharging)
      apply()
    }
  }

  fun getSettings(): BackgroundWorkerSettings {
    return BackgroundWorkerSettings(
      minimumDelaySeconds = sp.getLong(SHARED_PREF_MIN_DELAY_KEY, DEFAULT_MIN_DELAY_SECONDS),
      requiresCharging = sp.getBoolean(SHARED_PREF_REQUIRE_CHARGING_KEY, DEFAULT_REQUIRE_CHARGING),
    )
  }
}
