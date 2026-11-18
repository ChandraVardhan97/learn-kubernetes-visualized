# m13: Render configuration and inspect HPA prerequisites

## Requirements
Docker Desktop or Docker Engine running; kind v0.33.0; kubectl v1.37.x; Python 3; named disposable cluster kv-lab and namespace kv-lab. Download every file into one directory, then run bash run.sh. See /labs/kind.yaml and the lab guide for cluster setup.

This exercise changes only the disposable kind-kv-lab context. Each script verifies its cluster and uses an explicit namespace. Do not run with production credentials. No script changes your active context.

## Run
```bash
bash run.sh
```

## Expected observations
kubectl kustomize renders two replicas with a generated ConfigMap. HPA exists but cannot compute CPU utilization until Metrics Server supplies metrics and requests are set.

## Inspect if results differ
```bash
kubectl --context kind-kv-lab -n kv-lab get pods -l lab=m13 -o wide
kubectl --context kind-kv-lab -n kv-lab get events --sort-by=.metadata.creationTimestamp
kubectl --context kind-kv-lab -n kv-lab describe pods -l lab=m13
```

## Scope and prerequisites
Metrics Server is required for resource HPA. The default kind cluster does not include it. No load-based autoscaling success is claimed. VPA and node autoscaling require their own controllers; kind does not provision cloud nodes. Helm templating is optional and separate from Kustomize. This baseline generates a ConfigMap with name hashing disabled; the Deployment does not consume it. It demonstrates rendering, not an automatic configuration-triggered rollout. To explore that extension, enable name hashing and reference the generated ConfigMap from the Pod template.

Application images use explicit version tags (nginx 1.28.0-alpine and BusyBox 1.37.0), not latest. Tags can be republished; production delivery should resolve and record registry digests. The kind node image is digest pinned.

## Cleanup
```bash
bash cleanup.sh
# When ALL labs are finished, destroy only the named disposable cluster:
kind delete cluster --name kv-lab
```
Cleanup removes this module's labeled resources. Some exercises create cluster-scoped CRDs or admission policy: their cleanup explicitly names those disposable resources. PVC cleanup deletes local data. Keep backups outside the cluster before cleanup.
