#!/usr/bin/env python3
import glob
import os
import logging
import json
import sys


class Translation:
    def __init__(self, translation_tuple):
        self.key, self.translation = translation_tuple

    def __repr__(self):
        return f'{self.key} => {self.translation}'

    def get_key(self):
        return self.key

    def get_translation(self):
        return self.translation


def parse_language_json(filename):
    with open(filename, 'r') as file:
        return [Translation(t) for t in json.load(file).items()]


def generate_mobile_translations(lang, translations):
    with open(os.path.join('..', 'mobile', 'assets', 'i18n', f'{lang}.json'), 'w') as file:
        translations_obj = {}
        for t in translations:
            translations_obj[t.get_key()] = t.get_translation()

        file.write(json.dumps(translations_obj, indent=2))


def generate_language_files():
    for file in glob.glob(os.path.join('translations', '*.json'), recursive=False):
        language_code = os.path.basename(file)[:-5]
        logging.info('Language Code: %s', language_code)

        translations = parse_language_json(file)
        logging.debug(translations)

        generate_mobile_translations(language_code, translations)


def get_translation_keys(translations):
    return [i.get_key() for i in translations]


def check_keys():
    en_us_keys = get_translation_keys(parse_language_json(os.path.join('translations', 'en-US.json')))

    ok = True

    for file in glob.glob(os.path.join('translations', '*.json'), recursive=False):
        keys = get_translation_keys(parse_language_json(file))

        for k in en_us_keys:
            if k not in keys:
                logging.error('File %s: missing key %s', file, k)
                ok = False

        for k in keys:
            if k not in en_us_keys:
                logging.error('File %s: contains unused key %s', file, k)
                ok = False

    if ok:
        logging.info('No key errors found!')

    return ok


if __name__ == '__main__':
    logging.basicConfig(format='%(levelname)s : %(message)s', level=logging.DEBUG)

    if len(sys.argv) < 2:
        generate_language_files()

    elif sys.argv[1] == 'check-keys':
        sys.exit(0 if check_keys() else 1)

