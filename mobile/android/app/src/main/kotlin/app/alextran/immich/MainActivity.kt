package app.alextran.immich

import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterFragmentActivity() {
  override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    flutterEngine.plugins.add(BackgroundServicePlugin())
    flutterEngine.plugins.add(HttpSSLOptionsPlugin())
    // No need to set up method channel here as it's now handled in the plugin
  }
}
