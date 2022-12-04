# Tagging system

This feature implements a tagging system for Immich. The goal is to achieve the following features:

- Users can create tags
- Users can delete tags
- Users can edit tags
- Users can view tags
- Users can add tags to an asset
- Users can remove tags from an asset
- Albums can be created from tags
- Search can be performed on tags

## Implementation

- Tags are stored in a separate table.
- Tags type are defined as an enum (i.e Objects, Faces, Custom (User Defined)...etc).
- Migrate the current `smart_info` album to the tags table - How to do this undisruptively? - add then delete entry?
- Search interface for tags
  - tags are displayed in search suggestion
  - tags can be search as text similar to exif table
- Tags are displayed in the asset view
- Smart album creation from tags?
- Tags can only be added by the owner

## Tag types (extensible)

- Objects (system generated)
- Faces (system generated)
- Custom (user defined)

