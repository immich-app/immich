package com.alextran.immich

import ImHostService
import com.alextran.immich.platform.ImHostServiceImpl
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity: FlutterActivity() {
  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    // Register pigeon handler
    ImHostService.setUp(flutterEngine.dartExecutor.binaryMessenger, ImHostServiceImpl())

    super.configureFlutterEngine(flutterEngine)
  }
}
