package com.alextran.immich

import ImmichHostService
import com.alextran.immich.platform.ImmichHostServiceImpl
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity: FlutterActivity() {
  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)

    // Register piegon handler
    ImmichHostService.setUp(flutterEngine.dartExecutor.binaryMessenger, ImmichHostServiceImpl())
  }
}
