package com.alextran.immich.platform

import ImmichHostService
import android.util.Log
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.FileInputStream
import java.security.MessageDigest

class ImmichHostServiceImpl: ImmichHostService {

  @OptIn(DelicateCoroutinesApi::class)
  override fun digestFiles(paths: List<String>, callback: (Result<List<ByteArray?>?>) -> Unit) {
    GlobalScope.launch(Dispatchers.IO) {
      val buf = ByteArray(Companion.BUFFER_SIZE)
      val digest: MessageDigest = MessageDigest.getInstance("SHA-1")
      val hashes = arrayOfNulls<ByteArray>(paths.size)
      for (i in paths.indices) {
        val path = paths[i]
        var len = 0
        try {
          val file = FileInputStream(path)
          file.use { assetFile ->
            while (true) {
              len = assetFile.read(buf)
              if (len != Companion.BUFFER_SIZE) break
              digest.update(buf)
            }
          }
          digest.update(buf, 0, len)
          hashes[i] = digest.digest()
        } catch (e: Exception) {
          // skip this file
          Log.w(TAG, "Failed to hash file ${paths[i]}: $e")
        }
      }
      callback(Result.success(hashes.asList()))
    }
  }

  companion object {
    private const val BUFFER_SIZE = 2 * 1024 * 1024;
    private const val TAG = "ImmichHostServiceImpl"
  }
}
