package app.alextran.immich

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import android.os.Bundle
import android.content.Intent

class MainActivity: FlutterActivity() {

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.getPlugins().add(BackgroundServicePlugin())
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            startService(Intent(getBaseContext(), AppClearedService::class.java));
        } catch (e: Exception) {
            // startService must not be called when app is in background (crashes app)
            // there is nothing we can do
        }
    }

}
