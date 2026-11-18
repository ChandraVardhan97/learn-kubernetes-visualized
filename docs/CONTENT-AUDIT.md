# Full curriculum correctness audit

Completed 2026-10-28; primary-source review performed on 2026-10-27–28. This supersedes the earlier eight-lesson sample review. It is a technical review with recorded corrections and bounded execution evidence, not a guarantee of zero errors or a Kubernetes/CNCF certification.

## Coverage

| Level | Lessons | Scenes / alternate paths | Base / alternate narrated frames | Detailed findings |
| --- | ---: | ---: | ---: | --- |
| Foundations | 18 | 36 / 36 | 108 / 108 | [Foundations audit](audits/foundations.md) |
| Intermediate | 21 | 42 / 42 | 168 / 126 | [Intermediate audit](audits/intermediate.md) |
| Advanced | 21 | 43 / 43 | 130 / 129 | [Advanced audit](audits/advanced.md) |
| Total | **60** | **121 / 121** | **406 / 363** | **769 narrated states** |

Review included lesson prose, YAML and commands, prediction answers, failure cases, scene assumptions, narration, nodes, edges, alternate paths, and alignment with all 20 baseline lab downloads. The shared live experiments were also inspected for consistency between controls, manifest fragments and placement/eligibility results. Stable content IDs and prerequisites were preserved.

Kubernetes claims were checked against official Kubernetes documentation and, where precise implementation semantics mattered, the pinned upstream v1.37.0 source. Docker, Linux, OCI, RFCs, Gateway API, CSI, etcd and ecosystem mechanisms were checked against their primary project sources. The [reference inventory](audits/source-links.md) records **186 lesson reference entries / 140 unique URLs**, all returning HTTP 200 in this audit. Reachability alone does not validate a claim.

## Material corrections

| Area | Correction and reason | Primary evidence |
| --- | --- | --- |
| ReplicaSet reconciliation | Count active managed Pods rather than only ready/running Pods. Image-pull failure is normally retried by the kubelet for an existing active Pod. | [ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/), [upstream active-Pod predicate](https://raw.githubusercontent.com/kubernetes/kubernetes/v1.37.0/pkg/controller/controller_utils.go) |
| Startup / restart behavior | Creation acknowledgement can race scheduling; an allowed cached image can start without a registry pull. Separate standalone OnFailure from ReplicaSet-managed Always examples. Startup probe action occurs when consecutive failures reach its threshold. | [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/), [images](https://kubernetes.io/docs/concepts/containers/images/), [probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) |
| Service readiness | An unready address can remain in an EndpointSlice. Distinguish ready, serving, terminating and publishNotReadyAddresses; bound the simplified traffic model explicitly. | [EndpointSlices](https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/) |
| Scheduling | Correct contradictory CPU/affinity/topology scene values. Explain feasible-node scoring versus the shared experiment's first-feasible simplification. GPU selection updates displayed YAML and is explicitly a label constraint, not device allocation. | [Scheduler](https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/), [topology spread](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
| Storage / networking | Access modes do not enforce ordinary read-only filesystem protection. Explain snapshot Delete/Retain behavior, NetworkPolicy additive rules and own-node exceptions, and implementation-specific translation. | [PersistentVolumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), [snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/), [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) |
| API watches / admission | Replace the blanket resourceVersion ordering prohibition with the current same-group/resource arbitrary-size decimal ordering contract, including extension API caveats. It is still neither a clock nor an event counter. Explain admission failurePolicy versus explicit denial and status observedGeneration versus desired generation. | [API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/#resource-versions), [admission webhooks](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) |
| CRD validation | Require the parent spec field at the schema root in m16 and m20; nested required fields alone did not require spec. A missing-spec WebApp could otherwise make the minimal operator fail. Add a negative server dry-run assertion before the valid example. | [CRD validation](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#validation) |
| Optional Argo CD | Withdraw the EOL 3.2.3 install recipe. Its matrix lists Kubernetes 1.31–1.34; the reviewed stable 3.5 matrix lists 1.33–1.36, not the 1.37 baseline. The extension now requires compatibility research and separate runtime verification. No incompatibility is inferred solely from an absent matrix entry. | [Tested versions](https://argo-cd.readthedocs.io/en/stable/operator-manual/tested-kubernetes-versions/), [support policy](https://argo-cd.readthedocs.io/en/stable/developer-guide/release-process-and-cadence/) |
| Lab evidence | Add bounded negative/recovered HTTP assertions, handle empty/null EndpointSlice endpoints, reset only the named m08 policies on rerun, assert a real m03 annotation/version update, and stop masking m04 command failures. Align prose with the actual m10/m13 baselines and m20 private backup/copy mechanism. | [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/), [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/), [kubectl cp](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cp/) |

The per-level reports provide the complete lesson-by-lesson findings, including smaller scene label corrections and retained assumptions. The table above highlights material changes rather than assigning a severity score to every wording improvement.

## Version and execution boundaries

The reviewed Kubernetes documentation baseline is **1.37**. The reproducible local environment remains **kind 0.33.0 / Kubernetes 1.37.0 / kubectl 1.37.0**, with the [official node-image digest](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0). A newer patch appearing upstream does not silently change the tested image. Recheck release/support metadata before publication and after changing a pin.

Fresh post-correction verification and exact local lab results are recorded in [VERIFICATION.md](VERIFICATION.md) and [labs-report.md](labs-report.md). Source/content checks, 13 unit checks, five production browser journeys, all 65 normal HTTP routes, canonical downloads and the production build pass. All 55 manifest documents passed strict real-API dry-run. Changed m03/m04/m06/m08/m12/m16 procedures and the m20 platform capstone passed; m08 also passed a repeat without cleanup. The task-owned cluster was removed. Earlier successful lab executions are retained as historical evidence; they are not presented as a new execution of every optional extension.

The audit does not establish production HA, database-consistent recovery, arbitrary CNI/CSI behavior, telemetry coverage or add-on compatibility. Metrics Server, VPA, CSI snapshots, Ingress/Gateway, meshes and telemetry stacks are explicitly optional and were not installed by this audit. The minimal operator is a bounded polling implementation, not a production controller framework. Argo CD has no verified installation in this release.

## Maintaining accuracy

For a technical contribution, check the claim and its scene together, link the relevant primary section, and record the reviewed version/date. Check base and failure paths, supported manifest values and the actual lab outcome. Distinguish API acceptance, controller status and application-level success. Revalidate changed mechanisms in a disposable environment; do not infer full correctness from parsing, HTTP 200 links, or a green build. Update this audit and the lab report when changing an assumption or a version pin.
