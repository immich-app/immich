package app.alextran.immich

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

fun <T> dispatch(
  dispatcher: CoroutineDispatcher = Dispatchers.IO,
  callback: (Result<T>) -> Unit,
  block: () -> T
) {
  CoroutineScope(dispatcher).launch {
    val result = runCatching { block() }
    withContext(Dispatchers.Main) {
      callback(result)
    }
  }
}
