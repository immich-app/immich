package app.alextran.immich.media

import android.webkit.MimeTypeMap
import java.io.File

fun guessMimeType(nameOrPath: String): String? {
  val extension = MimeTypeMap.getFileExtensionFromUrl(nameOrPath)
    .ifEmpty { nameOrPath.substringAfterLast('.', "") }
  return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.lowercase())
}

fun reserveUniqueFile(dir: File, name: String): File {
  val base = name.substringBeforeLast('.', name)
  val extension = name.substringAfterLast('.', "")
  val suffix = if (extension.isEmpty()) "" else ".$extension"

  var candidate = File(dir, name)
  var occurrence = 0
  while (!candidate.createNewFile()) {
    occurrence += 1
    candidate = File(dir, "$base ($occurrence)$suffix")
  }
  return candidate
}
