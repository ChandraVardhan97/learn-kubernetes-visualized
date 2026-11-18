# Local lab verification report

Verified on 2026-10-27. This report distinguishes executed mechanisms from optional or production-only behavior.

**Final status:** all 20 module mechanisms and all three capstones have passed with kubectl/server v1.37.0. The supported-client integration run passed m01–m19 and exposed a short stdin transfer failure in m20. After replacing that bounded fixture transfer with `kubectl cp`, the complete m20 runner passed, including checksums before and after Pod replacement. Historical executions and their limitations are retained below; the final verification section supersedes their pending status.

## Delivered artifacts

- 20 module labs (`m01`–`m20`) with the required `Lab` data contract in `src/data/labs.ts`.
- 122 canonical module downloads mirrored byte for byte under `public/labs/<id>/`, including a README, guarded runner and cleanup for every module.
- Three actual capstone procedures in m20: stateless diagnosis, PVC file backup/delete/restore, and custom resource/GitOps field ownership with a repeated operator loop.
- Shared digest-pinned `public/labs/kind.yaml`, bundle README, integration runner and validation script.
- `public/labs/kv-labs.zip`: **124 allowlisted files**, **83,377 bytes**. ZIP membership, CRC integrity and every entry's bytes were checked against the canonical published files. Runtime snapshots, kubeconfigs, backup directories and the ZIP itself are excluded.

ZIP SHA-256:

```
519bfd278cae22f6f5951a37116a829c94c7dbcfe60a1677b8b087660e8c1a9f
```

## Environment and scope

The existing disposable `kv-lab` cluster used kind v0.33.0, Kubernetes v1.37.0, one control plane and two workers. Its node image is pinned to `kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5`, confirmed against the [official release](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0). The existing Docker Desktop installation was started for local verification. The etcd image actually reported **3.7.0**. A later explicit version check found that the invoked client was `/usr/local/bin/kubectl` **v1.32.2**, while the server was **v1.37.0**. kubectl emitted a warning that this exceeds its supported ±1 minor version skew. The recommended v1.37 client prerequisite was therefore not met during the earlier executions: the recorded successes are actual local observations under this unsupported client/server combination, not verification of the recommended client baseline. This mismatch is a material remaining environment limitation; it is not proven to have caused the m20 failure described below.

Every lab targets `--context kind-kv-lab` and namespace `kv-lab`, checks the kubeconfig cluster mapping, and compares API node names with `kind get nodes --name kv-lab`. No runner changes the caller's active context. The optional recovery procedure uses a separate kubeconfig and creates only `kv-recovery`. The source cluster was never stopped or restored.

## Executed checks

| Check | Actual result |
| --- | --- |
| `node --import tsx scripts/validate-labs.ts` | Passed: 20 ordered module labs, 122 identical downloads, 55 Kubernetes documents; YAML, Bash and Python syntax valid |
| Strict server-side manifest validation | Passed for all 55 Kubernetes documents, including WebApp custom resources after establishing the CRD; m11 ServiceAccount was present for Pod admission |
| `bash scripts/run-labs.sh all` | Exit 0; all 20 module exercises passed and cleaned their module resources |
| m20 capstones | All three procedures passed, including failed/recovered HTTP, external file restore with content comparison and Pod replacement, SSA conflict, operator repair and garbage collection |
| Interrupted m14 cleanup | Passed: its known teaching finalizer was removed and the terminating ConfigMap disappeared |
| Optional m18 offline recovery | Earlier corrected runner exited 0; restored API served the saved marker through `kind-kv-recovery`. The later host-output path change was checked separately without another recovery cluster. |
| Bundle verification | Passed: exact allowlist, no archive self-inclusion, all CRCs and file bytes correct |

The full runner's successful output remains in `/tmp/kv-labs-all.log`; server validation in `/tmp/kv-labs-server-validation.log`; final recovery in `/tmp/kv-labs-recovery-final.log`; interrupted-finalizer cleanup in `/tmp/kv-labs-finalizer-cleanup.log`. These are local verification evidence, not published downloads. kubeconform was unavailable, so schema validation used actual Kubernetes server-side dry-run rather than claiming kubeconform success.

Server dry-run does not persist one object's prerequisite for another object's admission: m11 initially exposed that its ServiceAccount must exist before dry-running its Pod. The named lab prerequisites were established, all manifests then passed strict server validation, and m11 resources were cleaned afterward.

## Mechanisms observed

- Deployment/ReplicaSet reconciliation replaced a deleted Pod with a different UID and restored two ready replicas. The operator preserved Deployment UID and generation across repeated unchanged reconciliations.
- Removing the readiness sentinel produced an unready Pod with no usable endpoint for that Pod; restoring it recovered readiness. Rollout and undo completed.
- Service DNS and HTTP worked; a wrong selector yielded no usable endpoints and a failed request; repairing it recovered HTTP.
- An impossible node selector produced `Pending`, `PodScheduled=False` and `Unschedulable`; a separate workload reported Burstable QoS.
- The default pinned kind dataplane **enforced NetworkPolicy**: baseline request succeeded, deny blocked a new connection, and the allow policy permitted the labeled client. This agrees with kind's [out-of-the-box policy support introduced in v0.24.0](https://github.com/kubernetes-sigs/kind/releases/tag/v0.24.0). No additional CNI was needed on this tested configuration.
- PVC content survived Pod replacement. The stateful capstone actually deleted the file, restored an external backup, compared content and verified the restored content after another Pod replacement.
- RBAC allowed the reader ServiceAccount to list Pods and denied reading Secrets. The restricted Pod ran with UID 1000 and no automatic ServiceAccount token mount.
- The bounded memory-backed-volume workload terminated with `OOMKilled`. This did not exhaust the Docker host or prove node eviction behavior.
- The CRD/operator exercise created owned resources, repaired deletion, followed a custom-resource replica change, and garbage-collected children after owner deletion. Separate SSA field managers produced the intended custom-resource spec conflict.
- HPA existed but reported `FailedGetResourceMetric` because Metrics Server was absent. The runner explicitly reported that scaling was not demonstrated.
- etcd captured an external snapshot. The final offline restoration stopped the recovery API server and etcd, restored a new data directory with revision bump and compaction, restarted static Pods, and read the saved `m18` marker. An initial attempt could not find a snapshot staged under node `/tmp`; the corrected script stages it under `/var/lib` after both services stop and asserts its presence. The corrected end-to-end recovery passed.

## Limits and cleanup

Historical check, superseded by the 2026-10-28 content audit: the Argo CD v3.2.3 install URL was verified against the [official pinned manifest](https://raw.githubusercontent.com/argoproj/argo-cd/v3.2.3/manifests/install.yaml); Argo CD itself was **not installed or runtime-tested**. The install recipe has now been withdrawn because pinning did not establish support or compatibility with Kubernetes 1.37; the guide is compatibility research only. m19 and the platform capstone explicitly model declarative reconciliation with SSA rather than claiming a continuously running GitOps service.

Metrics Server, VPA, cloud node autoscaling, CSI snapshot support, Ingress/Gateway controllers, service meshes and full telemetry stacks were not installed. Snapshot API objects alone cannot create driver support. The default local-path provisioner is not a replicated data store. The file backup is not a consistent database backup. The polling Python controller does not implement production watches/caches, leader election, retry backoff or external-resource finalization.

kind nodes share one physical host. The recovered marker proves API-data restoration in a disposable single-member fixture; it does not prove production HA, failure-domain resilience, quorum recovery, worker-fleet migration, or RTO/RPO. Follow the matching [etcd 3.7 recovery guidance](https://etcd.io/docs/v3.7/op-guide/recovery/) and preserve real PKI, encryption configuration and external data in a production recovery plan.

The recovery cluster is removed after verification. Module cleanup removes labeled namespaced resources; the shared teaching WebApp CRD may remain for subsequent validation and can be removed after both m16/m20 are finished. Captured snapshots and recovery credentials remain outside `public/` and are excluded from the ZIP. Snapshot capture removes its temporary source-node snapshot file after successfully copying it out. Final cleanup checks passed: only `kv-lab` remains in `kind get clusters`; `kubectl config current-context` is still `kind-kv-lab`; no labeled lab resources remain in the `kv-lab` namespace; and `/var/lib/etcd/kv-lab.db` is absent from the source node. The shared WebApp CRD is the only intentionally retained lab API definition.


## Private-output correction and targeted verification

Final review found that direct m18 capture/recovery and m20 file backup could default into their local lab directories under `public/`. The integration runner's external override had hidden this risk. Both modules now include the same `backup-path.py` resolver and select `<OS-temp>/kubernetes-visualized-<uid>/m18` or `/m20` by default. Capture and restore use the same stable m18 location. Scripts set umask 077 and print the selected directory without printing snapshot or credential contents. Existing explicit `KV_LAB_BACKUP_DIR` overrides remain supported when the directory is owned by the user with mode 0700.

The resolver identifies the checkout from its script path and invocation directory, resolves symlinks before rejecting destinations under its `public/` or `dist/`, and also refuses artifact-file symlinks and files owned by another user. Runtime data is never part of the canonical download list or archive. Documentation retrieves the actual path with `python3 backup-path.py m18` or `m20`, and describes OS temporary storage as temporary rather than durable backup retention.

Targeted checks after this correction:

- Stable defaults for both modules resolve outside published assets, with mode-0700 directories. An explicit private override succeeds.
- Overrides into `public/` and `dist/` fail before creating those destinations. A directory symlink into public and a snapshot-file symlink into public also fail.
- A direct default m18 capture completed and produced a mode-0600 snapshot in the printed private OS temporary directory. Its temporary source-node snapshot was removed after copying.
- Direct default m20 backup produced a mode-0600 file. An initial run failed in the stdin-restore/first-content-comparison block before Pod replacement; its untraced log does not uniquely establish the failing command or actual live-file bytes. An isolated traced rerun passed the complete delete/restore/content-comparison and Pod-replacement procedure. No workload recovery mechanics were changed as part of this path correction. The passing rerun does not establish the cause or eliminate a possible race.
- Module resources were cleaned after the targeted executions. No new recovery cluster was created, and the full 20-module suite was not repeated because its successful earlier evidence remains applicable to the unchanged mechanisms.
- Final syntax/canonical validation passes: 20 labs, 122 identical module files and 55 unchanged Kubernetes documents. The rebuilt ZIP contains 124 allowlisted files (122 module files plus shared README/kind config), with exact-byte and CRC checks passing; the complete published lab tree matches that allowlist plus the ZIP.

Targeted execution evidence is in `/tmp/kv-labs-private-output-check.log` and `/tmp/kv-labs-private-m20-rerun.log`. These logs and runtime outputs are not published assets.


### Precise m20 failure limitation

The failed direct-run log contains Pod readiness, the expected remote `test -f` exit-1 message after deliberate file deletion, and then cleanup. That same expected exit-1 message appears in the successful traced run, so it is not itself the failure. The failed run never printed the runner's first `pod m20-data deleted` output. This localizes the failure to the stdin restore and first content comparison, before deliberate Pod replacement; there is insufficient tracing to assert which exact command failed. A content-comparison mismatch is consistent with the log, but the actual failed live-file byte count/content was not retained. The local backup file was observed as 19 bytes with mode0600 before the rerun; the cleanup had already deleted the failed PVC, and the rerun later rewrote that local backup. It is no longer possible to recover the original failed live bytes from these retained artifacts.

Retained normal Kubernetes events show the failed Pod UID `d7c021b7-6d11-4c1e-a256-48fbeb140f0e` started at 09:33:31Z and was stopped during cleanup at 09:33:33Z. The rerun Pod UID `6af4aa74-0896-4fd0-afa0-f707f08f1edc` started at 09:34:52Z, and its deliberate replacement UID `91de52b9-069d-4054-aabb-a34f32ed67f9` started at 09:34:56Z, all on 2026-10-27. The runs used different PVC UIDs and separately provisioned local-path volumes. These events show no overlapping old/new Pod from the failed attempt and no recorded storage or container warning. The workload container only sleeps; it does not independently write the file. Kubernetes events do not audit `kubectl exec` file writes, so they cannot exclude an unrecorded concurrent exec writer.

Client v1.32.2 versus server v1.37.0 is outside supported skew and remains a plausible environmental confounder, not a demonstrated root cause. No retry loop, wait, workload change or further rerun was added to mask the failure. The precise remaining limitation is an unreproduced pre-replacement restore/comparison failure with unavailable failed live bytes and an unsupported kubectl client. Future focused investigation should use a supported client and preserve non-content diagnostics (exit status, byte count and checksum) at the failing step; a successful rerun alone is not an explanation.


## Final supported-client verification

The project-local official kubectl v1.37.0 binary was checksum-verified and used with the v1.37.0 server. Every module now refuses a client outside v1.37.x before mutation. The full integration run in `/tmp/kv-labs-supported-client-all.log` passed m01–m19; m20 failed with a successful exec exit status but zero restored bytes at the first comparison. Retained private diagnostics establish the symptom; the exact underlying transport/runtime cause is unproven. Unsupported client skew does not explain this matching-client failure.

For the small, quiescent 19-byte teaching fixture, the final procedure uses the standard `kubectl cp` file-copy path and its required in-container `tar`. Five isolated copy/delete checks matched the expected bytes. The complete final m20 runner in `/tmp/kv-capstones-final.log` then passed all three capstones. Its stateful procedure recorded 19 bytes and the same SHA-256 digest at capture, after restoration, and after Pod replacement. It has no retry or sleep to conceal failures; assertions stop immediately and retain private diagnostics. The stateless path recovered HTTP, and the platform path verified field ownership, repeated reconciliation, repair and garbage collection.

This is bounded local execution evidence, not a general large-file transport or database-backup guarantee. The lesson, scene and download describe the actual file-copy procedure. m18/m20 outputs remain in private OS temporary directories outside public assets. Final m20 cleanup exited 0. The 124-entry ZIP was regenerated from the canonical list and checked entry by entry; its current size and hash appear above.

Final environment cleanup: the task-owned `kv-lab` cluster was deleted after all checks; `kv-recovery` had already been deleted. No Docker daemon shutdown or unrelated cluster deletion was performed.


## 2026-10-28 — corrections from full documentation audit

The [full curriculum audit](CONTENT-AUDIT.md) identified and corrected lab mismatches and missing assertions. Changes were mirrored in the canonical data and downloads before repacking the bundle.

Fresh runtime results on a clean, three-node kind 0.33.0 / Kubernetes 1.37.0 cluster with kubectl 1.37.0:

| Procedure | Observed result |
| --- | --- |
| m03 | Unique annotation update changed resourceVersion while preserving ConfigMap UID; no numeric subtraction used. |
| m04 | Init-file, ConfigMap and Secret gating command succeeded; app/companion observations passed. |
| m06 | DNS and baseline HTTP succeeded; bad selector produced zero ready endpoints and failed new HTTP; repair restored ready endpoints and HTTP success. |
| m08 | Working baseline, observed deny, then allowed-client HTTP recovery. Passed a second run without cleanup, after resetting only the module's named policies. |
| m12 | Captured actual crash message, observed broken-selector HTTP failure, repaired selector and observed HTTP recovery. |
| m16 | API rejected a spec-less WebApp with `spec: Required value`; valid reconciliation, stable child identity/generation, ConfigMap repair and two-replica change passed. |
| m20 platform | Parent field-ownership conflict, repeated reconciliation, owned ConfigMap repair and owner-reference garbage collection passed with the corrected CRD. |
| All 55 lab manifest documents | Strict server-side dry-run passed after establishing the WebApp CRD and required m11 ServiceAccount; the temporary ServiceAccount was removed. |

The first run exposed an audit-script reader bug: an empty EndpointSlice may serialize `endpoints: null`. The m06 reader now handles null as an empty list; the final clean-cluster run passed the negative/recovery assertions. After Docker was restarted, the older audit cluster's CoreDNS reported an unsynced API cache and DNS failed; that run stopped, and only the task-owned cluster was recreated. No passing claim is inferred from either failed attempt.

The final task-owned kv-lab cluster was deleted; `kind get clusters` reported none. A separate private kubeconfig was used throughout, and the user's global context was not changed. No new etcd recovery cluster was created. Unchanged mechanisms retain the earlier execution evidence above; this audit did not rerun every optional extension or all three complete capstones.

Final logs: `/tmp/kv-audit-labs-final.log`, `/tmp/kv-content-audit-server-schema.log`, and `/tmp/kv-content-audit-lab-static.log`. Fresh syntax/canonical validation passes: 20 modules, 122 identical downloads and 55 documents. The rebuilt archive has 124 allowlisted entries; CRC and exact bytes for every entry match the published downloads.

Argo CD remains uninstalled and unverified. Its EOL recipe was withdrawn in favor of a compatibility-research guide. The runtime results above concern manual SSA and the local polling operator, not a running GitOps service.

Current archive: **83,377 bytes**, SHA-256 `519bfd278cae22f6f5951a37116a829c94c7dbcfe60a1677b8b087660e8c1a9f`.
