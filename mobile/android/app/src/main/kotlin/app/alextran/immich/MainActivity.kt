package app.alextran.immich

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import app.alextran.immich.platform.ImHostApiImpl

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(BackgroundServicePlugin())
        ImHostApi.setUp(flutterEngine.dartExecutor.binaryMessenger, ImHostApiImpl(this))
    }
}
