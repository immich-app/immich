package app.alextran.immich

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Catches the event when either the system or the user kills the app
 * (does not apply on force close!) 
 */
class AppClearedService() : Service() {

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
        return START_NOT_STICKY;
    }

    override fun onTaskRemoved(rootIntent: Intent) {
        ContentObserverWorker.workManagerAppClearedWorkaround(applicationContext)
        stopSelf();
    }
}