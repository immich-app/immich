package app.alextran.immich

import android.os.Build
import android.os.ext.SdkExtensions
import androidx.annotation.NonNull
import app.alextran.immich.sync.NativeSyncApi
import app.alextran.immich.sync.NativeSyncApiImpl26
import app.alextran.immich.sync.NativeSyncApiImpl30
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterFragmentActivity() {
  override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    flutterEngine.plugins.add(BackgroundServicePlugin())
    flutterEngine.plugins.add(HttpSSLOptionsPlugin())
    // No need to set up method channel here as it's now handled in the plugin

    val nativeSyncApiImpl =
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) < 1) {
        NativeSyncApiImpl26(this)
      } else {
        NativeSyncApiImpl30(this)
      }
    NativeSyncApi.setUp(flutterEngine.dartExecutor.binaryMessenger, nativeSyncApiImpl)
  }
}
