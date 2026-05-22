package com.immich.app

import android.content.Context
import android.os.Build
import android.os.ext.SdkExtensions
import com.immich.app.background.BackgroundEngineLock
import com.immich.app.background.BackgroundWorkerApiImpl
import com.immich.app.background.BackgroundWorkerFgHostApi
import com.immich.app.background.BackgroundWorkerLockApi
import com.immich.app.connectivity.ConnectivityApi
import com.immich.app.connectivity.ConnectivityApiImpl
import com.immich.app.core.HttpClientManager
import com.immich.app.core.ImmichPlugin
import com.immich.app.core.NetworkApiPlugin
import me.albemala.native_video_player.NativeVideoPlayerPlugin
import com.immich.app.images.LocalImageApi
import com.immich.app.images.LocalImagesImpl
import com.immich.app.images.RemoteImageApi
import com.immich.app.images.RemoteImagesImpl
import com.immich.app.sync.NativeSyncApi
import com.immich.app.sync.NativeSyncApiImpl26
import com.immich.app.sync.NativeSyncApiImpl30
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterFragmentActivity() {
  override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    registerPlugins(this, flutterEngine)
  }

  companion object {
    fun registerPlugins(ctx: Context, flutterEngine: FlutterEngine) {
      HttpClientManager.initialize(ctx)
      NativeVideoPlayerPlugin.dataSourceFactory = HttpClientManager::createDataSourceFactory
      flutterEngine.plugins.add(NetworkApiPlugin())

      val messenger = flutterEngine.dartExecutor.binaryMessenger
      val backgroundEngineLockImpl = BackgroundEngineLock(ctx)
      BackgroundWorkerLockApi.setUp(messenger, backgroundEngineLockImpl)
      val nativeSyncApiImpl =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R || SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) < 1) {
          NativeSyncApiImpl26(ctx)
        } else {
          NativeSyncApiImpl30(ctx)
        }
      NativeSyncApi.setUp(messenger, nativeSyncApiImpl)
      LocalImageApi.setUp(messenger, LocalImagesImpl(ctx))
      RemoteImageApi.setUp(messenger, RemoteImagesImpl(ctx))

      BackgroundWorkerFgHostApi.setUp(messenger, BackgroundWorkerApiImpl(ctx))
      ConnectivityApi.setUp(messenger, ConnectivityApiImpl(ctx))

      flutterEngine.plugins.add(BackgroundServicePlugin())
      flutterEngine.plugins.add(backgroundEngineLockImpl)
      flutterEngine.plugins.add(nativeSyncApiImpl)
    }

    fun cancelPlugins(flutterEngine: FlutterEngine) {
      val nativeApi =
        flutterEngine.plugins.get(NativeSyncApiImpl26::class.java) as ImmichPlugin?
          ?: flutterEngine.plugins.get(NativeSyncApiImpl30::class.java) as ImmichPlugin?
      nativeApi?.detachFromEngine()
    }
  }
}
