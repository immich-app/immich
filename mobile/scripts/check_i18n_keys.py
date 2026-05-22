#!/usr/bin/env python3
import json
import subprocess
def main():
    with open('assets/i18n/en-US.json', 'r+') as f:
        data = json.load(f)
        keys_to_delete = []

        for k in data.keys():
            sp = subprocess.run(['sh', '-c', f'grep -q -r --include="*.dart" "{k}"'])

            if sp.returncode != 0:
                print("Not found in source code, key:", k)
                keys_to_delete.append(k)

        for k in keys_to_delete:
            del data[k]

        f.seek(0)
        f.truncate()
        json.dump(data, f, indent=4)

if __name__ == '__main__':
    main()