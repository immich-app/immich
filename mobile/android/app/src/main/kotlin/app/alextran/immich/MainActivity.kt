package app.alextran.immich

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import app.alextran.immich.platform.MessagesImpl

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        flutterEngine.plugins.add(BackgroundServicePlugin())
        ImHostService.setUp(flutterEngine.dartExecutor.binaryMessenger, MessagesImpl(this))
    }
}
