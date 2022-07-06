#!/usr/bin/env python3
import json
import subprocess

def main():
    print("CHECK GERMAN TRANSLATIONS")
    with open('assets/i18n/de-DE.json', 'r') as f:
        data = json.load(f)

        for k in data.keys():
            print(k)
            sp = subprocess.run(['sh', '-c', f'grep -r --include="./assets/i18n/en-US.json" "{k}"'])

            if sp.returncode != 0:
                print(f"Outdated Key! {k}")
                return 1

if __name__ == '__main__':
    main()