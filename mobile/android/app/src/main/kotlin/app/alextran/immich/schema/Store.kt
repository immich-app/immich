package app.alextran.immich.schema

import com.google.gson.Gson
import java.net.URL
import java.util.Date

// Sealed interface representing storage types
sealed interface StorageType<T> {
  fun toDb(value: T): Any
  fun fromDb(value: Any): T

  data object IntStorage : StorageType<Int> {
    override fun toDb(value: Int) = value
    override fun fromDb(value: Any) = value as Int
  }

  data object BoolStorage : StorageType<Boolean> {
    override fun toDb(value: Boolean) = if (value) 1 else 0
    override fun fromDb(value: Any) = (value as Int) == 1
  }

  data object StringStorage : StorageType<String> {
    override fun toDb(value: String) = value
    override fun fromDb(value: Any) = value as String
  }

  data object DateStorage : StorageType<Date> {
    override fun toDb(value: Date) = value.time / 1000
    override fun fromDb(value: Any) = Date((value as Long) * 1000)
  }

  data object UrlStorage : StorageType<URL> {
    override fun toDb(value: URL) = value.toString()
    override fun fromDb(value: Any) = URL(value as String)
  }

  class JsonStorage<T>(
    private val clazz: Class<T>,
    private val gson: Gson = Gson()
  ) : StorageType<T> {
    override fun toDb(value: T) = gson.toJson(value)
    override fun fromDb(value: Any) = gson.fromJson(value as String, clazz)
  }
}

// Typed key wrapper
@JvmInline
value class TypedStoreKey<T>(val key: StoreKey) {
  companion object {
    // Factory methods for type-safe key creation
    inline fun <reified T> of(key: StoreKey): TypedStoreKey<T> = TypedStoreKey(key)
  }
}

// Registry mapping keys to their storage types
object StoreRegistry {
  private val intKeys = setOf(
    StoreKey.VERSION,
    StoreKey.DEVICE_ID_HASH,
    StoreKey.BACKUP_TRIGGER_DELAY
  )

  private val stringKeys = setOf(
    StoreKey.CURRENT_USER,
    StoreKey.DEVICE_ID,
    StoreKey.ACCESS_TOKEN
  )

  fun usesIntStorage(key: StoreKey): Boolean = key in intKeys
  fun usesStringStorage(key: StoreKey): Boolean = key in stringKeys
}

// Storage type registry for automatic selection
@Suppress("UNCHECKED_CAST")
object StorageTypes {
  inline fun <reified T> get(): StorageType<T> = when (T::class) {
    Int::class -> StorageType.IntStorage as StorageType<T>
    Boolean::class -> StorageType.BoolStorage as StorageType<T>
    String::class -> StorageType.StringStorage as StorageType<T>
    Date::class -> StorageType.DateStorage as StorageType<T>
    URL::class -> StorageType.UrlStorage as StorageType<T>
    else -> StorageType.JsonStorage(T::class.java)
  }
}

// Simplified extension functions with automatic storage
suspend inline fun <reified T> StoreDao.get(typedKey: TypedStoreKey<T>): T? {
  return get(typedKey, StorageTypes.get<T>())
}

suspend inline fun <reified T> StoreDao.set(typedKey: TypedStoreKey<T>, value: T) {
  set(typedKey, value, StorageTypes.get<T>())
}
