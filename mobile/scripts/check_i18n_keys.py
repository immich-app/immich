#!/usr/bin/env python3
import json
import subprocess

def main():
    with open('assets/i18n/en-US.json', 'r') as f:
        data = json.load(f)

        for k in data.keys():
            print(k)
            sp = subprocess.run(['sh', '-c', f'grep -r --include="*.dart" "{k}"'])

            if sp.returncode != 0:
                print("Not found in source code!")
                return 1

if __name__ == '__main__':
    main()