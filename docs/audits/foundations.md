# Foundations technical audit

Reviewed on 2026-10-27 against live primary documentation. This is a bounded technical review, not a certification that no possible errors remain.

## Scope and method

- Read all 18 foundations MDX lessons, including frontmatter, examples, answers, caveats, and source links.
- Read all 18 associated JSON files: 36 scenes, 108 base frames, 36 alternate variants, and 108 variant frames. Reviewed assumptions, narration, node labels/details/states, edge directions/labels/states, and embedded commands. Every scene listed below includes its complete base path and its `-failure` variant; each lesson has six base and six alternate frames.
- Inspected all 30 files under `public/labs/m01` through `m06` for consistency with the lessons. Lab recommendations below were handed to the main audit owner; this scoped audit did not edit lab assets or `src/data/labs.ts`.
- Used Kubernetes documentation for documented behavior and the Kubernetes `v1.37.0` implementation for precise active-Pod filtering and probe-threshold semantics. Linux, Docker, OCI, and RFC primary sources cover the pre-Kubernetes material. All links below were actually opened during this review.
- Preserved lesson, concept, scene, variant, and node IDs, examples' teaching detail, and the Kubernetes 1.37 metadata. Release and kind image-pin verification is owned by the main audit, not inferred from these concept pages.

## Lesson-by-lesson findings

| Lesson | Primary sources consulted | Complete scene coverage | Findings and corrections |
| --- | --- | --- | --- |
| `m01-l01` Containers are processes | [Docker containers][docker-containers], [namespaces][linux-ns], [cgroups][linux-cg], [cgroup v2][linux-cgv2], [Volumes][volumes] | `m01-l01-isolation`, `m01-l01-resource-boundary`; both failure variants | Shared Linux kernel, visibility/resource distinction, writable-layer and volume lifetimes agree with the sources. Corrected the scene to identify cgroup v2 explicitly and express `memory.max` in bytes. Reclaim, temporary overshoot, OOM selection, and sandboxed runtimes remain declared simplifications. |
| `m01-l02` Images and registries | [Images][images], [OCI manifest][oci], [Docker layers][layers] | `m01-l02-image-layers`, `m01-l02-registry-pull`; both failure variants | Corrected scene claim that a successful pull is necessary: an allowed cached image can start without a registry pull. Mutable tags, digests, platform manifests, cache reuse with Always, and pull/application failures remain distinct. |
| `m01-l03` Networking before Kubernetes | [Docker port publishing][ports], [HTTP semantics][http], [DNS concepts][dns], [IPv6 DNS][dns6], [Pods][pods] | `m01-l03-port-path`, `m01-l03-dns`; both failure variants | Scoped the TCP walkthrough to the examples because HTTP/3 uses QUIC/UDP. Added Docker Engine 28.0.0 qualification for localhost-only port exposure; Docker documents same-L2 access in older releases. Corrected the Docker-only scene's stray Pod-interface label to container interface. Listener/port declaration and DNS/HTTP distinctions reviewed. |
| `m02-l01` Inside a Kubernetes cluster | [Components][components], [control-plane communication][communication], [CRI][cri] | `m02-l01-api-store`, `m02-l01-worker`; both failure variants | Component ownership, API/etcd boundary, ordinary scheduling, and runtime responsibility reviewed. Updated the redirected CRI source URL to its current canonical path. Managed control-plane visibility and API-outage behavior remain appropriately conditional. |
| `m02-l02` Desired state and reconciliation | [Controllers][controllers], [ReplicaSet][rs], [self-healing][healing], [active-Pod predicate][active], [ReplicaSet implementation][rs-code] | `m02-l02-reconcile`, `m02-l02-repair`; both failure variants | Clarified that replica repair counts active managed Pods, excluding terminal and deleting objects. Corrected prose that could imply image-pull failure repeatedly causes ReplicaSet replacement: kubelets retry pulls for still-active Pods. Scene count language now says active; readiness remains separate. |
| `m02-l03` From kubectl to a running Pod | [Pod lifecycle][lifecycle], [API concepts][api], [debug Pods][debug-pod], [Images][images], [Components][components] | `m02-l03-request`, `m02-l03-startup`; both failure variants | Corrected prose/scene timing: creation acknowledgement does not wait for startup, but observers can advance before the client receives it. Corrected startup variant inference that image availability proves live registry access. Preparation order stays an explicit abstraction. |
| `m03-l01` Objects, YAML, and apply | [Objects][objects], [declarative apply][apply], [kubectl explain][explain], [kubectl apply validation][apply-ref], [API concepts][api], [ConfigMaps][cm] | `m03-l01-object`, `m03-l01-apply`; both failure variants | Qualified unknown-field rejection by kubectl's default strict validation; warn/ignore differ. Identity, parent versus Pod-template metadata, non-spec object kinds, dry-run limitations, client-side apply, and competing writers reviewed. |
| `m03-l02` Labels, selectors, and namespaces | [Labels][labels], [Annotations][annotations], [Namespaces][namespaces], [Owners/dependents][owners], [ReplicaSet][rs], [ConfigMaps][cm], [Secrets][secrets] | `m03-l02-selection`, `m03-l02-scope`; both failure variants | No concrete correction identified. Reviewed AND/set matching, negative selectors, Pod-label selection, ownership/adoption, namespaced references, and absence of automatic network isolation. The scenes intentionally omit full label syntax. |
| `m03-l03` kubectl and your cluster context | [kubeconfig][kubeconfig], [multiple clusters][contexts], [kubectl][kubectl], [explain][explain], [logs][logs], [port-forward][forward] | `m03-l03-context`, `m03-l03-evidence`; both failure variants | No concrete correction identified. Context names versus actual mappings, credential-plugin risk, explicit scope, redaction, and command responsibilities reviewed. Examples assume a laptop client; in-cluster kubectl defaults are outside this walkthrough. |
| `m04-l01` The Pod lifecycle | [Pods][pods], [Pod lifecycle][lifecycle], [emptyDir][volumes], [ReplicaSet restart policy][rs] | `m04-l01-boundary`, `m04-l01-restart`; both failure variants | Fixed the scene's invalid implied OnFailure-to-ReplicaSet transition by explicitly switching to a separate managed Always Pod. Added that Deployment/ReplicaSet templates permit only Pod-level Always and scoped comparisons to standalone Pods with no per-container restart overrides. Phase/display status, local restart, new UID, and emptyDir behavior reviewed. |
| `m04-l02` Init containers and sidecars | [Init containers][init], [Sidecar containers][sidecar], [Volumes][volumes] | `m04-l02-init`, `m04-l02-sidecar`; both failure variants | No concrete correction identified. Reviewed regular-init completion, retries, native sidecar start/startupProbe gate, independent helper restart, shared mounts, circular waits, and file permissions. Native restartable sidecars are stable since 1.33; this is compatible with 1.37. The module lab explicitly uses the older ordinary-companion pattern. |
| `m04-l03` Configuration and Secrets | [ConfigMaps][cm], [Secrets][secrets], [Secret good practices][secret-practices], [credential projection][credentials] | `m04-l03-config`, `m04-l03-secret`; both failure variants | Changed subPath recovery scene to explicit Pod replacement/workload rollout rather than a vague new-container promise. Reviewed eventual file refresh, startup environment values, required namespaced references, application reload, base64, and indirect Secret access through workload creation. |
| `m05-l01` Deployments and ReplicaSets | [Deployments][deployment], [ReplicaSet][rs], [Owners/dependents][owners], [active-Pod predicate][active], [ReplicaSet implementation][rs-code] | `m05-l01-ownership`, `m05-l01-scale`; both failure variants | Clarified active-Pod count in the lesson. Ownership chain, scheduler/kubelet separation, scaling versus template revision, generated identities, selector overlap, and readiness/availability distinction reviewed. Replica count does not promise topology distribution or throughput. |
| `m05-l02` Rolling updates and rollback | [Deployments][deployment], [rollout status][rollout-status], [rollout undo][rollout-undo] | `m05-l02-rollout`, `m05-l02-rollback`; both failure variants | Added scene assumption that old replicas remain healthy; rollout budgets cannot prevent independent application/node failures. Reviewed three-plus-one arithmetic, terminating overlap, readiness/availability, capacity stall, retained history, deadline reporting without automatic rollback, and external data/config limitations. |
| `m05-l03` Probes and graceful recovery | [Pod lifecycle/probes/termination][lifecycle], [configure probes][probes], [probe worker][probe-code], [EndpointSlices][slices] | `m05-l03-probes`, `m05-l03-termination`; both failure variants | Corrected startup action to consecutive failures reaching the threshold, not exceeding it. Added startup-failure consequence to scene narration. Readiness does not restart; liveness/startup terminate and follow restart policy. Reviewed shared grace budget, signal caveats, concurrent endpoint updates, existing connections, and terminating-endpoint exceptions. The documented one-off two-second preStop extension does not provide a draining guarantee. |
| `m06-l01` Services and EndpointSlices | [Services][service], [EndpointSlices][slices], [virtual IP forwarding][virtual], [kubectl wait][wait], [kubectl logs][logs] | `m06-l01-selection`, `m06-l01-dataplane`; both failure variants | Added an explicit Succeeded-phase wait before reading/deleting the finite HTTP client, plus timeout diagnosis. Reviewed selector-to-slice mapping, all-slice discovery, targetPort, virtual frontend versus process, cached connections, readiness conditions, publishNotReadyAddresses, and asynchronous propagation. |
| `m06-l02` DNS and service exposure | [Service/Pod DNS][service-dns], [Services][service], [port-forward][forward], [debug DNS][debug-dns] | `m06-l02-dns`, `m06-l02-exposure`; both failure variants | No concrete correction identified. Reviewed configurable cluster domain/search paths, virtual-IP answers, caller network, node reachability, implementation-dependent LoadBalancer/NodePort allocation, and selected-Pod port-forward semantics. Local host reachability is intentionally conditional. |
| `m06-l03` Your first debugging workflow | [debug Pods][debug-pod], [debug Services][debug-service], [debug DNS][debug-dns], [logs][logs], [port-forward][forward] | `m06-l03-startup`, `m06-l03-request`; both failure variants | No concrete correction identified. Evidence selection, event/log retention, pre-execution versus exited-process failure, original caller-path verification, label mismatch, direct-backend narrowing, and limits of tunnel evidence reviewed. |

## Proposed lab corrections handed to the main owner

1. `public/labs/m06/run.sh`: immediately printing EndpointSlices after a selector patch is racy. Wait for and assert zero usable endpoints before restoring the selector; then wait for usable endpoints and repeat the original client HTTP request. The controller reconciles slices asynchronously. Matching canonical changes belong in `src/data/labs.ts` before regenerating public assets.
2. `public/labs/m04/resources.yaml`: the app command uses `test -n "$DEMO_PASSWORD"; sleep 3600`, so a failed test is masked by the successful sleep. If this check is intended to gate startup, chain it with `&&` (or explicitly fail). The lesson's separate example already uses a gating chain.
3. `public/labs/m05/README.md`: describe readiness loss as setting endpoint `ready: false`/removing ordinary traffic eligibility. An unready endpoint address can remain in an EndpointSlice; the script already checks the ready condition.
4. `public/labs/m03/README.md` and `run.sh`: the README promises resourceVersion advances, but the script neither snapshots nor compares it. Capture the version immediately before and after the deliberate annotation update, compare for inequality (resourceVersion is opaque), or narrow the expected-observation claim. Reapplying unchanged data need not create another meaningful update.

The lab companion-vs-native-sidecar distinction, versioned mutable image-tag caveat, explicit disposable context, and per-module cleanup labels were present and consistent with this review. No live lab was run here.

## Verification and limits

Verification performed after the edits:

- `npm run verify:content` exited 0: 60 lessons, 20 modules, 195 concepts, 121 scenes; no missing references or prerequisite cycles. These totals cover the repository as it existed during this shared audit.
- Parsed all foundations JSON and checked stable IDs against the staged input: 18 lessons, 36 scenes, 108 base frames, 36 variants, and 108 variant frames. Lesson identities, prerequisite lists, concept mappings, and Kubernetes version metadata were unchanged.
- Parsed all 15 YAML example blocks and ran `bash -n` on all 29 shell example blocks from the foundations lessons; no parse/syntax errors. This checks syntax, not API admission or runtime success.
- Scoped `git diff --check` exited 0.

No new tests, cluster operations, publication, or commits were performed by this audit.

Public registries, runtime details, provider controllers, DNS caches, installed security/network policy, actual node resources, timings, signal handling, and end-to-end application results cannot be proven from documentation alone. Image tags are training choices, not audited supply-chain identities or production upgrade recommendations. Diagram stages are instructional abstractions; they do not promise a total ordering of asynchronous observations. The review establishes agreement with the cited primary sources for the stated examples and assumptions, not universal behavior across every distribution or feature-gate combination.

[docker-containers]: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
[linux-ns]: https://man7.org/linux/man-pages/man7/namespaces.7.html
[linux-cg]: https://man7.org/linux/man-pages/man7/cgroups.7.html
[linux-cgv2]: https://docs.kernel.org/admin-guide/cgroup-v2.html
[images]: https://kubernetes.io/docs/concepts/containers/images/
[oci]: https://github.com/opencontainers/image-spec/blob/main/manifest.md
[layers]: https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/
[ports]: https://docs.docker.com/engine/network/port-publishing/
[http]: https://www.rfc-editor.org/rfc/rfc9110.html
[dns]: https://www.rfc-editor.org/rfc/rfc1034.html
[dns6]: https://www.rfc-editor.org/rfc/rfc3596.html
[components]: https://kubernetes.io/docs/concepts/overview/components/
[communication]: https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/
[cri]: https://kubernetes.io/docs/concepts/containers/cri/
[controllers]: https://kubernetes.io/docs/concepts/architecture/controller/
[rs]: https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/
[healing]: https://kubernetes.io/docs/concepts/architecture/self-healing/
[lifecycle]: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
[api]: https://kubernetes.io/docs/reference/using-api/api-concepts/
[objects]: https://kubernetes.io/docs/concepts/overview/working-with-objects/
[apply]: https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/
[apply-ref]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/
[explain]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_explain/
[labels]: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
[annotations]: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/
[namespaces]: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
[owners]: https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/
[kubeconfig]: https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/
[contexts]: https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/
[kubectl]: https://kubernetes.io/docs/reference/kubectl/
[pods]: https://kubernetes.io/docs/concepts/workloads/pods/
[volumes]: https://kubernetes.io/docs/concepts/storage/volumes/
[init]: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
[sidecar]: https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/
[cm]: https://kubernetes.io/docs/concepts/configuration/configmap/
[secrets]: https://kubernetes.io/docs/concepts/configuration/secret/
[secret-practices]: https://kubernetes.io/docs/concepts/security/secrets-good-practices/
[credentials]: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/
[deployment]: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
[rollout-status]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout/kubectl_rollout_status/
[rollout-undo]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout/kubectl_rollout_undo/
[probes]: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
[service]: https://kubernetes.io/docs/concepts/services-networking/service/
[slices]: https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/
[virtual]: https://kubernetes.io/docs/reference/networking/virtual-ips/
[service-dns]: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/
[forward]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_port-forward/
[debug-pod]: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
[debug-service]: https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/
[debug-dns]: https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/
[logs]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_logs/
[wait]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_wait/
[active]: https://raw.githubusercontent.com/kubernetes/kubernetes/v1.37.0/pkg/controller/controller_utils.go
[rs-code]: https://raw.githubusercontent.com/kubernetes/kubernetes/v1.37.0/pkg/controller/replicaset/replica_set.go
[probe-code]: https://raw.githubusercontent.com/kubernetes/kubernetes/v1.37.0/pkg/kubelet/prober/worker.go
