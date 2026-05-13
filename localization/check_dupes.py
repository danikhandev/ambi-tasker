import json

def find_duplicates(obj, path=""):
    if isinstance(obj, dict):
        keys = set()
        for k, v in obj.items():
            if k in keys:
                print(f"Duplicate key found: {path}.{k}")
            keys.add(k)
            find_duplicates(v, f"{path}.{k}")

# Since JSON doesn't allow duplicate keys by default in many parsers,
# we need a custom parser that can detect them.
from collections import Counter

def check_json_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def dict_raise_on_duplicates(ordered_pairs):
        """Reject duplicate keys."""
        d = {}
        for k, v in ordered_pairs:
            if k in d:
                print(f"Duplicate key: {k}")
            d[k] = v
        return d

    try:
        json.loads(content, object_pairs_hook=dict_raise_on_duplicates)
    except Exception as e:
        print(f"Error parsing JSON: {e}")

check_json_duplicates('d:/FYP/15-jan-2026/ambi-tasker/localization/ur.json')
