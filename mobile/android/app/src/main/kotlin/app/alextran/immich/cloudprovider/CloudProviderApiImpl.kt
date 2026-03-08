package app.alextran.immich.cloudprovider

import android.content.Context

class CloudProviderApiImpl(private val context: Context) : CloudProviderApi {

  override fun getAdbSetupCommand(): String {
    val packageName = context.packageName
    return "adb shell device_config override mediaprovider allowed_cloud_providers $packageName"
  }

  override fun getAdbDisableCommand(): String {
    return "adb shell device_config clear_override mediaprovider allowed_cloud_providers"
  }
}
