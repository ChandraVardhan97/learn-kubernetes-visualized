# Local labs

The catalog includes 20 module labs, three cumulative capstones within m20, offline restore within m18, and four optional practice challenges. The lab data under src/data supplies both the website and the generated README for each download. Manifests and helpers live under public/labs. Use the complete ZIP to keep each exercise’s files together.

## Create the disposable environment

Install Docker, kind **v0.33.0**, kubectl **v1.37.x**, and Python 3. Docker must be running and able to pull public images. Use the official [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/) and check release checksums when installing binaries. Start Docker Desktop with enough memory for a control plane and workers; 6–8 GiB available to Docker is a useful starting allocation, not a measured minimum. The offline restore needs resources for another control plane.

Use Terminal on macOS and Ubuntu's Bash shell on Windows. The website's [platform setup instructions](https://k8s-visualized.pages.dev/labs/#setup) cover Docker Desktop, WSL 2 integration, and which binaries to install. The full suite was verified on Apple Silicon macOS. Windows via WSL 2 still needs an end-to-end run.

The node image is pinned to the multiarchitecture digest published by the [kind v0.33.0 release](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0):

```
kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5
```

From the extracted bundle directory containing `kind.yaml`:

```bash
# A separate kubeconfig file prevents kind creation from changing your usual current context.
export KUBECONFIG="$PWD/kv-lab.kubeconfig"
kind create cluster --name kv-lab --config kind.yaml --wait 180s
kubectl --context kind-kv-lab wait --for=condition=Ready nodes --all --timeout=180s
kubectl --context kind-kv-lab get nodes
```

Leave that `KUBECONFIG` set while running downloaded labs, or merge it yourself after reviewing contexts. All lab scripts verify `kind-kv-lab` maps to the expected cluster and that its API node names match `kind get nodes --name kv-lab`. Every Kubernetes operation explicitly selects the context; namespaced operations select `kv-lab`. Scripts do not call `use-context` or `set-context`. A missing dependency, absent cluster or identity mismatch fails before the exercise changes resources.

Application images use explicit version tags (`nginx:1.28.0-alpine`, `busybox:1.37.0`). These tags are repeatable version choices but can be republished; production supply chains should resolve and retain digests. The kind node is digest pinned. The example Secret is a disposable teaching value.

## Execute and verify

Follow the README in the downloaded exercise directory. Run Setup, inspect the diagnostic evidence, and attempt the task before opening Solution. Use Verify to check the result, then follow Clean up. Some guided demonstrations also use a convenience runner called run.sh.

Contributors can regenerate and test the downloads with:

```bash
npm run build:lab-downloads
npm run verify:labs
bash scripts/run-labs.sh m06
bash scripts/run-labs.sh all
```

The integration runner extracts the ZIP and runs the published command blocks against a fresh three-node kind cluster with a private kubeconfig. It requires that the kv-lab and kv-recovery names are free. It runs cleanup after each exercise and checks that its resources are gone. The full run also checks interrupted finalizer cleanup and validates manifests with Kubernetes server dry-run. See [the run report](labs-report.md) for execution evidence.

Use smoke for a representative subset, all for the complete catalog, or pass an exercise ID such as m20-stateful or p02. Running m18 selects snapshot capture. Selecting m18-offline-restore also captures its prerequisite snapshot. The static validator checks the instructions, ZIP parity, namespaces, and Bash, Python and YAML syntax. With kubeconform on PATH, it checks compatible standard manifests against Kubernetes 1.37 schemas.

## Lab coverage

| Module | Exercise | Boundary |
| --- | --- | --- |
| m01 | Container process, hostname, Pod IP and HTTP port | No internet exposure |
| m02 | Deployment → ReplicaSet → replacement Pod | No application state replication |
| m03 | Apply, UID, labels and annotation | No active-context change |
| m04 | Init ordering, shared emptyDir, ConfigMap and Secret | Companion is a regular container |
| m05 | Readiness and EndpointSlice, rollout and undo | Probe effect differs from restart |
| m06 | DNS, Service selector and EndpointSlice | No cloud load balancer installed |
| m07 | Burstable resources and unschedulable placement | No host resource exhaustion |
| m08 | Baseline, deny and allow HTTP policy probes | Dataplane enforcement must be measured |
| m09 | PVC file survives consuming Pod replacement | No node-loss or CSI snapshot claim |
| m10 | Stable identity, per-node work, Job/CronJob and PDB | No drain of the shared node |
| m11 | RBAC allow/deny and restricted container settings | Impersonation tests authorization |
| m12 | Crash evidence and broken Service diagnosis | No observability stack installed |
| m13 | Kustomize render and HPA conditions | Resource HPA requires Metrics Server |
| m14 | SSA conflict and a terminating finalizer | No real external cleanup operation |
| m15 | Lease inspection, repeated apply and bounded watch | Manual Lease is not leader election |
| m16 | CRD schema and Python polling operator | No production controller framework |
| m17 | Container OOM with a bounded memory allocation | No node eviction or capacity benchmark |
| m18 | etcd snapshot and optional offline restoration | No HA/quorum or production DR proof |
| m19 | Declarative drift replay and Argo CD compatibility research | Replay is not a running GitOps controller |
| m20 | Three complete cumulative procedures | File backup is not database backup |

## Four optional practice challenges

| ID | Task | Verification |
| --- | --- | --- |
| p01 | Correct a Service backend port | The original client reaches the same Service. |
| p02 | Tolerate a teaching taint | The Pod lands on the designated worker, then cleanup restores its metadata. |
| p03 | Recover an unbound claim with the correct class | The replacement claim binds and the mounted marker is readable. |
| p04 | Grant one cross-namespace read | The named ConfigMap is accessible while other reads and writes remain denied. |

## Three cumulative capstones

1. **Stateless operations:** inspect healthy Pods, the Service selector and EndpointSlices; observe a failed client request; repair the selector and assert HTTP recovery. Resources: `m20/stateless.yaml`, runner: `capstone-stateless.sh`.
2. **Stateful recovery:** write a PVC file, stream a backup outside the cluster, delete the file, restore it, compare its content, then replace the Pod and verify persistence. Resources: `m20/stateful.yaml`, runner: `capstone-stateful.sh`. The backup must not be confused with a database-consistent backup or snapshot.
3. **GitOps and operator:** declare a WebApp through SSA manager `kv-gitops`, reject a conflicting `kv-human` spec update, reconcile with a separate operator manager, verify repeated desired state, delete an owned ConfigMap and repair it, then delete the custom resource and assert owner-reference garbage collection. Runner: `capstone-platform.sh`. It models declarative ownership with actual APIs; select and verify a supported Argo CD / Kubernetes pair separately to explore continuous Git reconciliation.

## Add-on dependencies and material limits

**NetworkPolicy:** creating a policy object does not establish isolation. An enforcing CNI/policy controller is required. kind introduced out-of-the-box support through kube-network-policies in [v0.24.0](https://github.com/kubernetes-sigs/kind/releases/tag/v0.24.0); do not repeat the outdated blanket claim that all default kind networks ignore policies. m08 probes the exact installed dataplane. If deny traffic still succeeds, it exits with an explicit message and requires a compatible enforcing implementation before the policy exercise can be considered successful. [Kubernetes policy requirements](https://kubernetes.io/docs/concepts/services-networking/network-policies/).

**Storage snapshots:** the default local-path StorageClass provides local persistence, not a snapshot-capable CSI backend. VolumeSnapshot CRDs, a snapshot controller, a supporting CSI driver and a matching VolumeSnapshotClass are required for snapshot exercises. m09 deliberately proves Pod replacement persistence. m20 performs an actual file backup/restore. [Snapshot prerequisites](https://kubernetes.io/docs/concepts/storage/volume-snapshots/).

**Autoscaling:** Metrics Server supplies the resource metrics API needed by CPU/memory HPA. Requests must be declared, and a controlled load plus sufficient observation time is needed to prove scaling. m13 reports absent metrics without claiming scaling. VPA and cloud node autoscalers are additional controllers. [HPA requirements](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/).

**Private runtime outputs:** m18 snapshot capture/recovery and m20 file recovery share `backup-path.py`. Their default is `<OS-temp>/kubernetes-visualized-<uid>/m18` or `/m20`, with owned mode-0700 directories and umask 077. Both runners print the selected path. Use `python3 backup-path.py m18` (or `m20`) from that module directory to retrieve it; use the same explicit `KV_LAB_BACKUP_DIR` override for capture and recovery if choosing a durable private location. The resolver refuses public/dist destinations from this checkout after resolving symlinks, as well as symlink artifact files. OS temporary storage is not a durable backup service; preserve wanted data separately. Neither a direct repository run nor the integration runner defaults outputs into static assets.

**Control plane:** kind nodes share one physical host. Even a multi-control-plane kind topology cannot validate real failure domains, infrastructure HA or production RTO/RPO. m18 snapshots etcd and includes a separate offline rehearsal. Snapshot data contains Secrets; protect the backup and do not publish it with site assets. The script never restores over the source cluster. Real recovery must also preserve PKI, encryption keys, volume data and other external dependencies. [etcd recovery](https://etcd.io/docs/v3.7/op-guide/recovery/).

**GitOps, meshes, ingress and telemetry:** their controllers are not implicitly present because a resource is accepted. m19's Argo CD guide is research-only: the reviewed 3.5 matrix lists Kubernetes 1.33–1.36, excluding the 1.37 baseline. The old 3.2.3 recipe has been withdrawn. A supported pair and separate runtime verification are prerequisites for adding a runnable extension. Service meshes, Ingress/Gateway controllers, certificate automation, OpenTelemetry collectors, Prometheus and Grafana require separate setup and trust choices.

## Cleanup

Every module runner creates labeled resources and its cleanup script removes them. m16 and m20 share a namespaced WebApp API; their cleanup removes their custom resources. Delete `webapps.labs.kv.example` only after both exercises are finished. Removing a PVC destroys local data when its reclaim policy is Delete. Preserve wanted backups outside the cluster before cleanup.

```bash
# Only after all lab work is finished:
kind delete cluster --name kv-lab
# If the optional recovery exercise was run, from its m18 directory:
bash cleanup-recovery.sh
```

Do not substitute a production cluster name into these destructive commands. The scripts' fixed names are an intentional scope boundary.

All common lab runners, the standalone WebApp operator and offline recovery now fail before cluster actions unless the invoked client is kubectl v1.37.x, matching the pinned server minor version. In this checkout, place the checksum-verified runtime first with `export PATH="$PWD/.runtime/bin:$PATH"` from the repository root. Downloaded bundles require the documented client installation on PATH.
