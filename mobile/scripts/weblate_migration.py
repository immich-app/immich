#!/usr/bin/env python3
import json
import subprocess
import os
import re
import glob
from collections import defaultdict

# Mapping from mobile locale codes to root locale codes
LOCALE_MAPPING = {
    "en-US": "en",
    "fr-FR": "fr",
    "fr-CA": "fr",
    "de-DE": "de",
    "es-ES": "es",
    "es-PE": "es",
    "it-IT": "it",
    "ja-JP": "ja",
    "ko-KR": "ko",
    "nl-NL": "nl",
    "pl-PL": "pl",
    "pt-PT": "pt",
    "pt-BR": "pt_BR",
    "ru-RU": "ru",
    "sv-SE": "sv",
    "sv-FI": "sv",
    "tr-TR": "tr",
    "uk-UA": "uk",
    "zh-CN": "zh_SIMPLIFIED",
    "zh-TW": "zh_Hant",
    "id-ID": "id",
    "th-TH": "th",
    "el-GR": "el",
    "ro-RO": "ro",
    "hu-HU": "hu",
    "sk-SK": "sk",
    "lv-LV": "lv",
    "vi-VN": "vi",
    "lt-LT": "lt",
    "mn-MN": "mn",
    "sr-Latn": "sr_Latn",
    "da-DK": "da",
    "nb-NO": "nb_NO",
    "ar-JO": "ar",
    "ca": "ca",
    "cs-CZ": "cs",
    "gl-ES": "gl",
    "sr-Cyrl": "sr_Cyrl",
    "sl-SI": "sl",
    "he-IL": "he",
    "fi-FI": "fi",
    "es-MX": "es",
    "hi-IN": "hi",
    # Add more mappings as needed
}

# Regex pattern to find translation keys in Dart code
TRANSLATION_KEY_PATTERN = r'["\']([\w_\.]+)["\']\.tr\(\)'

def find_mobile_i18n_files():
    mobile_i18n_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "i18n")
    if not os.path.exists(mobile_i18n_dir):
        print(f"Mobile i18n directory not found: {mobile_i18n_dir}")
        return []
    
    return [f for f in os.listdir(mobile_i18n_dir) if f.endswith('.json')]

def find_root_i18n_dir():
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(current_dir)
    i18n_dir = os.path.join(root_dir, "i18n")
    
    if not os.path.exists(i18n_dir):
        print(f"Root i18n directory not found: {i18n_dir}")
        return None
    
    return i18n_dir

def shorten_key(key):
    """Try to shorten translation keys by removing common prefixes"""
    # Define prefixes to remove
    prefixes = [
     
    ]
    
    # Check if key starts with any of the prefixes
    for prefix in prefixes:
        if key.startswith(prefix):
            return key[len(prefix):]
    
    return key

def find_all_dart_files():
    """Find all Dart files in the mobile app"""
    mobile_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lib_dir = os.path.join(mobile_dir, "lib")
    
    if not os.path.exists(lib_dir):
        print(f"Mobile lib directory not found: {lib_dir}")
        return []
    
    return glob.glob(os.path.join(lib_dir, "**", "*.dart"), recursive=True)

def extract_translation_keys_from_dart_files():
    """Extract all translation keys used in the Dart code"""
    dart_files = find_all_dart_files()
    translation_keys = set()
    
    for dart_file in dart_files:
        with open(dart_file, 'r') as f:
            content = f.read()
            matches = re.findall(TRANSLATION_KEY_PATTERN, content)
            translation_keys.update(matches)
    
    return translation_keys

def check_for_unused_keys():
    """Check for unused translation keys in the mobile app and returns a list of them."""
    mobile_i18n_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "i18n")
    en_us_path = os.path.join(mobile_i18n_dir, "en-US.json")
    
    with open(en_us_path, 'r') as f:
        data = json.load(f)
        keys_to_delete = []

        for k in data.keys():
            sp = subprocess.run(['sh', '-c', f'grep -q -r --include="*.dart" "{k}" {os.path.dirname(mobile_i18n_dir)}/lib'], capture_output=True)

            if sp.returncode != 0:
                print("Not found in source code, key:", k)
                keys_to_delete.append(k)
        
    return keys_to_delete, data

def migrate_translations():
    """Migrate translations from mobile to root i18n directory WITHOUT modifying source files"""
    mobile_i18n_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "i18n")
    root_i18n_dir = find_root_i18n_dir()
    
    if not root_i18n_dir:
        print("Could not find root i18n directory")
        return {}
    
    # Get list of mobile translation files
    mobile_files = find_mobile_i18n_files()
    if not mobile_files:
        print("No mobile translation files found")
        return {}
    
    # Dictionary to store key mappings (old_key -> new_key)
    key_mapping = {}
    
    # First, find all unused keys (but don't delete them)
    unused_keys, _ = check_for_unused_keys()
    print(f"Found {len(unused_keys)} unused keys (will be migrated but marked)")
    
    # Process each mobile translation file
    for mobile_file in mobile_files:
        mobile_locale = mobile_file.split('.')[0]  # e.g., "en-US"
        
        if mobile_locale not in LOCALE_MAPPING:
            print(f"No mapping found for locale {mobile_locale}, skipping")
            continue
        
        root_locale = LOCALE_MAPPING[mobile_locale]
        root_file = f"{root_locale}.json"
        root_file_path = os.path.join(root_i18n_dir, root_file)
        
        # Load mobile translations
        with open(os.path.join(mobile_i18n_dir, mobile_file), 'r') as f:
            mobile_translations = json.load(f)
        
        # Load root translations if they exist
        if os.path.exists(root_file_path):
            with open(root_file_path, 'r') as f:
                root_translations = json.load(f)
        else:
            root_translations = {}
        
        # Keys to migrate (including all keys)
        keys_to_migrate = {}
        
        # Migrate all keys from mobile to root
        for k, v in mobile_translations.items():
            if k not in root_translations:  # Only migrate if not already in root
                # Try to shorten the key
                new_key = shorten_key(k)
                
                # If shortened key already exists in root, use the original key
                if new_key != k and new_key in root_translations:
                    keys_to_migrate[k] = v
                    key_mapping[k] = k  # Map to itself (no change)
                else:
                    keys_to_migrate[new_key] = v
                    key_mapping[k] = new_key  # Map old key to new key
            else:
                # If the key already exists in root, just record the mapping
                key_mapping[k] = k
        
        # If there are keys to migrate, update the root file
        if keys_to_migrate:
            print(f"Migrating {len(keys_to_migrate)} keys from {mobile_file} to {root_file}")
            
            # Update the root translations with the new keys
            root_translations.update(keys_to_migrate)
            
            # Write the updated translations back to the root file
            with open(root_file_path, 'w') as f:
                json.dump(root_translations, f, indent=2, ensure_ascii=False, sort_keys=True)
        else:
            print(f"No new keys to migrate from {mobile_file} to {root_file}")
    
    # IMPORTANT: We do NOT modify the source files at all, just return the key mappings
    return key_mapping

def generate_migration_report(key_mapping, unused_keys):
    """Generate a detailed report of the migration"""
    report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "translation_migration_report.md")
    
    with open(report_path, 'w') as f:
        f.write("# Translation Migration Report\n\n")
        
        f.write("## Summary\n")
        f.write(f"- Total keys migrated: {len(key_mapping)}\n")
        f.write(f"- Keys shortened: {sum(1 for k, v in key_mapping.items() if k != v)}\n")
        f.write(f"- Unused keys identified: {len(unused_keys)}\n\n")
        
        f.write("## Key Mappings\n")
        f.write("The following keys were migrated to the root i18n directory:\n\n")
        f.write("| Original Key | New Key | Shortened |\n")
        f.write("|-------------|---------|----------|\n")
        
        for old_key, new_key in sorted(key_mapping.items()):
            shortened = "Yes" if old_key != new_key else "No"
            f.write(f"| `{old_key}` | `{new_key}` | {shortened} |\n")
        
        f.write("\n\n## Unused Keys\n")
        f.write("The following keys were identified as unused in the codebase:\n\n")
        f.write("```\n")
        for key in sorted(unused_keys):
            f.write(f"{key}\n")
        f.write("```\n\n")
        
        f.write("## Next Steps\n")
        f.write("1. Review the key mappings to ensure they are correct\n")
        f.write("2. Test the application thoroughly to ensure all translations work properly\n")
        f.write("3. Consider removing unused keys from the source files if they are no longer needed\n")
    
    print(f"Migration report generated at {report_path}")
    return report_path

def update_dart_code_references(key_mapping):
    """Update translation key references in Dart files"""
    if not key_mapping:
        print("No key mappings provided, skipping Dart code update")
        return []
    
    # Get all Dart files
    dart_files = find_all_dart_files()
    updated_files = []
    
    # Process each Dart file
    for dart_file in dart_files:
        with open(dart_file, 'r') as f:
            content = f.read()
        
        updated_content = content
        file_updated = False
        file_updates = []
        
        # Replace each old key with the new key
        for old_key, new_key in key_mapping.items():
            if old_key != new_key:  # Only update if the key has changed
                # Pattern to match the key used in tr() calls
                pattern = f'["\']({re.escape(old_key)})["\']\.tr\(\)'
                replacement = f'"{new_key}".tr()'
                
                # Perform the replacement
                new_content = re.sub(pattern, replacement, updated_content)
                
                if new_content != updated_content:
                    file_updates.append(f"{old_key} -> {new_key}")
                    updated_content = new_content
                    file_updated = True
        
        # Write the updated content back to the file if changes were made
        if file_updated:
            with open(dart_file, 'w') as f:
                f.write(updated_content)
            updated_files.append((dart_file, file_updates))
            print(f"Updated {os.path.basename(dart_file)} with new translation keys: {', '.join(file_updates)}")
    
    print(f"Updated {len(updated_files)} Dart files with new translation keys")
    return updated_files

def check_for_duplicate_keys():
    """Check for duplicate keys between mobile and root i18n"""
    mobile_i18n_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "i18n")
    root_i18n_dir = find_root_i18n_dir()
    
    if not root_i18n_dir:
        print("Could not find root i18n directory")
        return []
    
    # Load English translations as reference
    mobile_en_path = os.path.join(mobile_i18n_dir, "en-US.json")
    root_en_path = os.path.join(root_i18n_dir, "en.json")
    
    if not os.path.exists(mobile_en_path) or not os.path.exists(root_en_path):
        print("Missing English translation files")
        return []
    
    with open(mobile_en_path, 'r') as f:
        mobile_en = json.load(f)
    
    with open(root_en_path, 'r') as f:
        root_en = json.load(f)
    
    # Find duplicate keys
    duplicates = set(mobile_en.keys()) & set(root_en.keys())
    
    if duplicates:
        print(f"Found {len(duplicates)} duplicate keys between mobile and root i18n:")
        for key in sorted(duplicates):
            mobile_val = mobile_en[key]
            root_val = root_en[key]
            if mobile_val == root_val:
                status = "SAME"
            else:
                status = "DIFFERENT"
            print(f"  {key}: {status}")
            print(f"    Mobile: {mobile_val}")
            print(f"    Root: {root_val}")
    else:
        print("No duplicate keys found between mobile and root i18n")
    
    return duplicates

def main():
    print("Checking for duplicate keys between mobile and root i18n...")
    duplicates = check_for_duplicate_keys()
    
    print("\nExtracting translation keys used in Dart code...")
    translation_keys = extract_translation_keys_from_dart_files()
    print(f"Found {len(translation_keys)} translation keys in use")
    
    # Get unused keys (but don't delete them)
    unused_keys, _ = check_for_unused_keys()
    
    print("\nMigrating translations from mobile to root i18n...")
    key_mapping = migrate_translations()
    print(f"Created mappings for {len(key_mapping)} keys")
    
    print("\nUpdating translation references in Dart code...")
    updated_files = update_dart_code_references(key_mapping)
    
    # Generate a detailed report
    report_path = generate_migration_report(key_mapping, unused_keys)
    
    print("\nMigration completed! See the report for details:", report_path)
    print("\nNote: Source translation files were NOT modified or deleted.")

if __name__ == '__main__':
    main()