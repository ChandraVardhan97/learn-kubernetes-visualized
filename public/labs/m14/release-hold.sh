#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"

# Only remove our marker on the known teaching object. Test identity and array index before the patch.
object=$(k get configmap m14 --ignore-not-found -o json)
[ -n "$object" ] || exit 0
patch=$(python3 -c '
import json, sys
m = json.load(sys.stdin)["metadata"]
markers = m.get("finalizers", [])
key = "labs.kv.example/hold"
if m.get("labels", {}).get("lab") == "m14" and key in markers:
    print(json.dumps([
      {"op": "test", "path": "/metadata/uid", "value": m["uid"]},
      {"op": "test", "path": "/metadata/resourceVersion", "value": m["resourceVersion"]},
      {"op": "remove", "path": "/metadata/finalizers/" + str(markers.index(key))}
    ]))
' <<< "$object")
if [ -n "$patch" ]; then k patch configmap m14 --type=json -p "$patch"; fi
