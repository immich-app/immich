package app.alextran.immich.schema

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters


@Database(
  entities = [
    AssetFace::class,
    AuthUser::class,
    LocalAlbum::class,
    LocalAlbumAsset::class,
    LocalAsset::class,
    MemoryAsset::class,
    Memory::class,
    Partner::class,
    Person::class,
    RemoteAlbum::class,
    RemoteAlbumAsset::class,
    RemoteAlbumUser::class,
    RemoteAsset::class,
    RemoteExif::class,
    Stack::class,
    Store::class,
    UploadTask::class,
    UploadTaskStat::class,
    User::class,
    UserMetadata::class
  ],
  version = 1,
  exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
  abstract fun localAssetDao(): LocalAssetDao
  abstract fun storeDao(): StoreDao
  abstract fun uploadTaskDao(): UploadTaskDao
  abstract fun uploadTaskStatDao(): UploadTaskStatDao

  companion object {
    @Volatile
    private var INSTANCE: AppDatabase? = null

    fun getDatabase(context: Context): AppDatabase {
      return INSTANCE ?: synchronized(this) {
        val instance = Room.databaseBuilder(
          context.applicationContext,
          AppDatabase::class.java,
          "app_database"
        ).build()
        INSTANCE = instance
        instance
      }
    }
  }
}
