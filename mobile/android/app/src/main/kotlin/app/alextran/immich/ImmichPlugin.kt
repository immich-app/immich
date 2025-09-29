package app.alextran.immich

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

fun <T> dispatch(
  dispatcher: CoroutineDispatcher = Dispatchers.IO,
  callback: (Result<T>) -> Unit,
  block: () -> T
) {
  CoroutineScope(dispatcher).launch {
    callback(runCatching { block() })
  }
}
