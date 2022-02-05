// Generated file.
// If you wish to remove Flutter's multidex support, delete this entire file.

package io.flutter.app;

import android.content.Context;
import androidx.annotation.CallSuper;
import androidx.multidex.MultiDex;

/**
 * Extension of {@link io.flutter.app.FlutterApplication}, adding multidex support.
 */
public class FlutterMultiDexApplication extends FlutterApplication {
  @Override
  @CallSuper
  protected void attachBaseContext(Context base) {
    super.attachBaseContext(base);
    MultiDex.install(this);
  }
}
