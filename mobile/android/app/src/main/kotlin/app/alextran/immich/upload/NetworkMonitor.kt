package app.alextran.immich.upload

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest

object NetworkMonitor {
  @Volatile
  private var isConnected = false

  @Volatile
  private var isWifi = false

  fun initialize(context: Context) {
    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    val networkRequest = NetworkRequest.Builder()
      .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
      .build()

    connectivityManager.registerNetworkCallback(networkRequest, object : ConnectivityManager.NetworkCallback() {
      override fun onAvailable(network: Network) {
        isConnected = true
        checkWifi(connectivityManager, network)
      }

      override fun onLost(network: Network) {
        isConnected = false
        isWifi = false
      }

      override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
        checkWifi(connectivityManager, network)
      }

      private fun checkWifi(cm: ConnectivityManager, network: Network) {
        val capabilities = cm.getNetworkCapabilities(network)
        isWifi = capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
      }
    })
  }

  fun isConnected(): Boolean = isConnected

  fun isWifiConnected(context: Context): Boolean {
    if (!isConnected) return false

    val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
    return capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
  }
}
