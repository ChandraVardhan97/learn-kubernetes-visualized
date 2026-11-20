#!/usr/bin/env bash
source "$(dirname "$0")/_common.sh"
node=kv-lab-worker
key=labs.kv.example/p02
existing=$(k get node "$node" -o json | python3 -c 'import json,sys; n=json.load(sys.stdin); key=sys.argv[1]; print("yes" if key in n["metadata"].get("annotations",{}) or any(t["key"]==key for t in n["spec"].get("taints",[])) else "no")' "$key")
[ "$existing" = no ] || { echo "The teaching taint or ownership marker already exists. Clean up the previous exercise first." >&2; exit 2; }
k annotate node "$node" "$key=owned-by-p02"
k taint node "$node" "$key=reserved:NoSchedule"
k apply -f resources.yaml
k wait --for='jsonpath={.status.conditions[?(@.type=="PodScheduled")].reason}=Unschedulable' pod/p02 --timeout=90s
