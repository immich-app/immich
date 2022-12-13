# User defined storage structure

* Introduce `consume` directory where all newly uploaded file will be temporarily stored in.
  * Example `${baseDir}/${userId}/consume/` 
* Remove `deviceId` in upload path

# Folder structure
* Year is the top level
  * Different parsing sequence will be the second level 

# Filename
* Filename will always be appended by a unique ID. Maybe use https://github.com/ai/nanoid
  * Example: `notes.md` -> `notes-1234567890.md`
* Filename will be unique in the same folder