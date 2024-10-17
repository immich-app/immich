package com.alextran.immich.platform

import ImHostService
import android.util.Log
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.FileInputStream
import java.security.MessageDigest

class ImHostServiceImpl(): ImHostService {

  @OptIn(DelicateCoroutinesApi::class)
  override fun digestFiles(paths: List<String>, callback: (Result<List<ByteArray?>>) -> Unit) {
    GlobalScope.launch(Dispatchers.IO) {
      val digest: MessageDigest = MessageDigest.getInstance("SHA-1")
      val buffer = ByteArray(BUFFER_SIZE)

      val hashes = paths.map { path ->
        try {
          FileInputStream(path).use { inputStream ->
            digest.reset()
            var bytesRead: Int
            while (inputStream.read(buffer).also { bytesRead = it } != -1) {
              digest.update(buffer, 0, bytesRead)
            }
            digest.digest()
          }
        } catch (e: Exception) {
          Log.e(TAG, "Failed to hash file $path", e)
          null
        }
      }
      callback(Result.success(hashes))
    }
  }

  companion object {
    private const val BUFFER_SIZE = 8192 // 8KB buffer
    private const val TAG = "ImHostServiceImpl"
  }
}
