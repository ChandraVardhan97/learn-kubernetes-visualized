# Concept and scene coverage

Generated from the validated curriculum: 60 lessons, 195 concepts, 121 scenes.

## m01: Before the cluster

| Lesson | Concept | Scene |
| --- | --- | --- |
| m01-l01: Containers are processes | Containers | m01-l01-isolation |
| m01-l01: Containers are processes | Linux namespaces | m01-l01-isolation |
| m01-l01: Containers are processes | Control groups | m01-l01-resource-boundary |
| m01-l02: Images and registries | Container images | m01-l02-image-layers |
| m01-l02: Images and registries | Tags and digests | m01-l02-image-layers |
| m01-l02: Images and registries | Registries and image pulls | m01-l02-registry-pull |
| m01-l03: Networking before Kubernetes | Ports and interfaces | m01-l03-port-path |
| m01-l03: Networking before Kubernetes | HTTP request and response | m01-l03-port-path |
| m01-l03: Networking before Kubernetes | DNS resolution | m01-l03-dns |

## m02: A cluster that reconciles

| Lesson | Concept | Scene |
| --- | --- | --- |
| m02-l01: Inside a Kubernetes cluster | API server | m02-l01-api-store |
| m02-l01: Inside a Kubernetes cluster | etcd | m02-l01-api-store |
| m02-l01: Inside a Kubernetes cluster | Scheduler | m02-l01-worker |
| m02-l01: Inside a Kubernetes cluster | Controllers | m02-l01-worker |
| m02-l01: Inside a Kubernetes cluster | Kubelet | m02-l01-worker |
| m02-l01: Inside a Kubernetes cluster | Container Runtime Interface | m02-l01-worker |
| m02-l02: Desired state and reconciliation | Reconciliation | m02-l02-reconcile |
| m02-l02: Desired state and reconciliation | Desired and observed state | m02-l02-reconcile |
| m02-l02: Desired state and reconciliation | Eventual convergence and limits | m02-l02-repair |
| m02-l03: From kubectl to a running Pod | Pod request lifecycle | m02-l03-request |
| m02-l03: From kubectl to a running Pod | Node startup and status | m02-l03-startup |

## m03: The language of Kubernetes

| Lesson | Concept | Scene |
| --- | --- | --- |
| m03-l01: Objects, YAML, and apply | Kubernetes objects | m03-l01-object |
| m03-l01: Objects, YAML, and apply | YAML structure | m03-l01-object |
| m03-l01: Objects, YAML, and apply | Metadata and identity | m03-l01-object |
| m03-l01: Objects, YAML, and apply | Spec and status | m03-l01-apply |
| m03-l01: Objects, YAML, and apply | Declarative apply | m03-l01-apply |
| m03-l02: Labels, selectors, and namespaces | Labels and selectors | m03-l02-selection |
| m03-l02: Labels, selectors, and namespaces | Annotations | m03-l02-selection |
| m03-l02: Labels, selectors, and namespaces | Kubernetes namespaces | m03-l02-scope |
| m03-l02: Labels, selectors, and namespaces | Owner references | m03-l02-scope |
| m03-l03: kubectl and your cluster context | kubeconfig | m03-l03-context |
| m03-l03: kubectl and your cluster context | Contexts and namespaces | m03-l03-context |
| m03-l03: kubectl and your cluster context | kubectl inspection workflow | m03-l03-evidence |

## m04: Life inside a Pod

| Lesson | Concept | Scene |
| --- | --- | --- |
| m04-l01: The Pod lifecycle | Pods and shared resources | m04-l01-boundary |
| m04-l01: The Pod lifecycle | Shared network and volumes | m04-l01-boundary |
| m04-l01: The Pod lifecycle | Pod lifecycle and identity | m04-l01-restart |
| m04-l01: The Pod lifecycle | Restart policy | m04-l01-restart |
| m04-l02: Init containers and sidecars | Regular init containers | m04-l02-init |
| m04-l02: Init containers and sidecars | Restartable sidecars | m04-l02-sidecar |
| m04-l02: Init containers and sidecars | Shared volume collaboration | m04-l02-sidecar |
| m04-l03: Configuration and Secrets | ConfigMaps | m04-l03-config |
| m04-l03: Configuration and Secrets | Configuration update semantics | m04-l03-config |
| m04-l03: Configuration and Secrets | Secrets and confidentiality | m04-l03-secret |

## m05: Keep the application running

| Lesson | Concept | Scene |
| --- | --- | --- |
| m05-l01: Deployments and ReplicaSets | Deployments | m05-l01-ownership |
| m05-l01: Deployments and ReplicaSets | ReplicaSets | m05-l01-ownership |
| m05-l01: Deployments and ReplicaSets | Replicas and availability | m05-l01-scale |
| m05-l02: Rolling updates and rollback | Rolling updates | m05-l02-rollout |
| m05-l02: Rolling updates and rollback | Surge and availability budgets | m05-l02-rollout |
| m05-l02: Rolling updates and rollback | Revision history and rollback | m05-l02-rollback |
| m05-l03: Probes and graceful recovery | Startup probes | m05-l03-probes |
| m05-l03: Probes and graceful recovery | Readiness probes | m05-l03-probes |
| m05-l03: Probes and graceful recovery | Liveness probes | m05-l03-probes |
| m05-l03: Probes and graceful recovery | Graceful termination | m05-l03-termination |

## m06: Connect and investigate

| Lesson | Concept | Scene |
| --- | --- | --- |
| m06-l01: Services and EndpointSlices | Services | m06-l01-selection |
| m06-l01: Services and EndpointSlices | EndpointSlices | m06-l01-selection |
| m06-l01: Services and EndpointSlices | ClusterIP and port mapping | m06-l01-dataplane |
| m06-l01: Services and EndpointSlices | Service forwarding | m06-l01-dataplane |
| m06-l02: DNS and service exposure | Service DNS | m06-l02-dns |
| m06-l02: DNS and service exposure | NodePort | m06-l02-exposure |
| m06-l02: DNS and service exposure | LoadBalancer Services | m06-l02-exposure |
| m06-l02: DNS and service exposure | Exposure and port-forward | m06-l02-exposure |
| m06-l03: Your first debugging workflow | Container logs | m06-l03-startup |
| m06-l03: Your first debugging workflow | Events and conditions | m06-l03-startup |
| m06-l03: Your first debugging workflow | Layered debugging | m06-l03-request |
| m06-l03: Your first debugging workflow | Request-path verification | m06-l03-request |

## m07: Placement and resources

| Lesson | Concept | Scene |
| --- | --- | --- |
| m07-l01: Requests, limits, and QoS | Resource requests | m07-l01-accounting |
| m07-l01: Requests, limits, and QoS | CPU and memory limits | m07-l01-accounting |
| m07-l01: Requests, limits, and QoS | Quality of Service classes | m07-l01-qos |
| m07-l02: Scheduling constraints | Node selectors and node affinity | m07-l02-affinity |
| m07-l02: Scheduling constraints | Pod affinity and anti-affinity | m07-l02-affinity |
| m07-l02: Scheduling constraints | Taints and tolerations | m07-l02-taints |
| m07-l03: Topology and resource governance | Topology spread constraints | m07-l03-spread |
| m07-l03: Topology and resource governance | ResourceQuota | m07-l03-budget |
| m07-l03: Topology and resource governance | LimitRange | m07-l03-budget |

## m08: Networking beyond discovery

| Lesson | Concept | Scene |
| --- | --- | --- |
| m08-l01: Pod networks and service routing | Container Network Interface | m08-l01-pod-path |
| m08-l01: Pod networks and service routing | Pod-to-Pod routing | m08-l01-pod-path |
| m08-l01: Pod networks and service routing | Service routing implementations | m08-l01-service-path |
| m08-l01: Pod networks and service routing | EndpointSlice readiness | m08-l01-service-path |
| m08-l01: Pod networks and service routing | Kube-proxy rule programming | m08-l01-service-path |
| m08-l01: Pod networks and service routing | eBPF-based Service forwarding | m08-l01-service-path |
| m08-l02: NetworkPolicy and isolation | NetworkPolicy direction and isolation | m08-l02-directions |
| m08-l02: NetworkPolicy and isolation | Additive allow rules | m08-l02-directions |
| m08-l02: NetworkPolicy and isolation | Peer selector logic | m08-l02-selectors |
| m08-l02: NetworkPolicy and isolation | Policy enforcement verification | m08-l02-selectors |
| m08-l03: Ingress, Gateway API, and TLS | Ingress and its controller | m08-l03-attachment |
| m08-l03: Ingress, Gateway API, and TLS | Gateway API attachment | m08-l03-attachment |
| m08-l03: Ingress, Gateway API, and TLS | TLS termination and certificates | m08-l03-tls |

## m09: Data that outlives a Pod

| Lesson | Concept | Scene |
| --- | --- | --- |
| m09-l01: Volumes and persistent claims | Volume lifetimes | m09-l01-lifetime |
| m09-l01: Volumes and persistent claims | PersistentVolumeClaims and PersistentVolumes | m09-l01-lifetime |
| m09-l01: Volumes and persistent claims | Storage access modes | m09-l01-access |
| m09-l01: Volumes and persistent claims | PV reclaim policy | m09-l01-access |
| m09-l02: Dynamic provisioning and CSI | StorageClass and dynamic provisioning | m09-l02-binding |
| m09-l02: Dynamic provisioning and CSI | WaitForFirstConsumer binding | m09-l02-binding |
| m09-l02: Dynamic provisioning and CSI | Container Storage Interface | m09-l02-csi-path |
| m09-l02: Dynamic provisioning and CSI | Volume expansion | m09-l02-csi-path |
| m09-l03: Snapshots and storage recovery | VolumeSnapshot lifecycle | m09-l03-snapshot |
| m09-l03: Snapshots and storage recovery | Snapshot consistency | m09-l03-snapshot |
| m09-l03: Snapshots and storage recovery | Storage restoration | m09-l03-restore |
| m09-l03: Snapshots and storage recovery | Recovery verification | m09-l03-restore |

## m10: Choose the workload

| Lesson | Concept | Scene |
| --- | --- | --- |
| m10-l01: StatefulSets and stable identity | StatefulSet identity | m10-l01-identity |
| m10-l01: StatefulSets and stable identity | Headless Service discovery | m10-l01-identity |
| m10-l01: StatefulSets and stable identity | Per-replica persistent claims | m10-l01-claims |
| m10-l01: StatefulSets and stable identity | Ordered StatefulSet rollout | m10-l01-claims |
| m10-l02: DaemonSets, Jobs, and CronJobs | DaemonSet node-local coverage | m10-l02-daemon |
| m10-l02: DaemonSets, Jobs, and CronJobs | Job completion and retries | m10-l02-completion |
| m10-l02: DaemonSets, Jobs, and CronJobs | CronJob scheduling and concurrency | m10-l02-completion |
| m10-l03: Termination, disruption, and drain | Graceful Pod termination | m10-l03-termination |
| m10-l03: Termination, disruption, and drain | Endpoint removal and connection draining | m10-l03-termination |
| m10-l03: Termination, disruption, and drain | PodDisruptionBudget | m10-l03-drain |
| m10-l03: Termination, disruption, and drain | Node cordon and drain | m10-l03-drain |

## m11: Trust and boundaries

| Lesson | Concept | Scene |
| --- | --- | --- |
| m11-l01: Authentication, RBAC, and ServiceAccounts | API authentication | m11-l01-identity |
| m11-l01: Authentication, RBAC, and ServiceAccounts | ServiceAccounts | m11-l01-identity |
| m11-l01: Authentication, RBAC, and ServiceAccounts | Projected bound tokens | m11-l01-identity |
| m11-l01: Authentication, RBAC, and ServiceAccounts | RBAC roles and bindings | m11-l01-authorization |
| m11-l01: Authentication, RBAC, and ServiceAccounts | Additive authorization permissions | m11-l01-authorization |
| m11-l02: Security contexts and Pod Security | Container security context | m11-l02-process-boundary |
| m11-l02: Security contexts and Pod Security | Filesystem ownership and writable paths | m11-l02-process-boundary |
| m11-l02: Security contexts and Pod Security | Pod Security Standards | m11-l02-admission |
| m11-l02: Security contexts and Pod Security | Pod Security Admission | m11-l02-admission |
| m11-l03: Protecting Secrets and tenant boundaries | Secret encoding and encryption | m11-l03-secret-path |
| m11-l03: Protecting Secrets and tenant boundaries | Credential delivery and rotation | m11-l03-secret-path |
| m11-l03: Protecting Secrets and tenant boundaries | Tenant boundary controls | m11-l03-tenant-controls |
| m11-l03: Protecting Secrets and tenant boundaries | Layered least privilege | m11-l03-tenant-controls |

## m12: Observe and diagnose

| Lesson | Concept | Scene |
| --- | --- | --- |
| m12-l01: Debug the failing workload | Pending workload diagnosis | m12-l01-failure-boundary |
| m12-l01: Debug the failing workload | ImagePullBackOff diagnosis | m12-l01-failure-boundary |
| m12-l01: Debug the failing workload | CrashLoopBackOff diagnosis | m12-l01-failure-boundary |
| m12-l01: Debug the failing workload | Ephemeral debug containers | m12-l01-debug-container |
| m12-l01: Debug the failing workload | Evidence-driven workload debugging | m12-l01-debug-container |
| m12-l02: Debug network and storage failures | Service and EndpointSlice debugging | m12-l02-network-ladder |
| m12-l02: Debug network and storage failures | DNS and path comparison | m12-l02-network-ladder |
| m12-l02: Debug network and storage failures | Network policy diagnosis | m12-l02-network-ladder |
| m12-l02: Debug network and storage failures | Storage lifecycle diagnosis | m12-l02-storage-ladder |
| m12-l02: Debug network and storage failures | Application filesystem access | m12-l02-storage-ladder |
| m12-l03: Metrics, logs, and traces | Metrics and label cardinality | m12-l03-metrics-pipeline |
| m12-l03: Metrics, logs, and traces | Prometheus collection | m12-l03-metrics-pipeline |
| m12-l03: Metrics, logs, and traces | Grafana visualization | m12-l03-metrics-pipeline |
| m12-l03: Metrics, logs, and traces | Structured logs | m12-l03-request-context |
| m12-l03: Metrics, logs, and traces | Distributed tracing | m12-l03-request-context |
| m12-l03: Metrics, logs, and traces | OpenTelemetry collection and context | m12-l03-request-context |

## m13: Deliver and scale

| Lesson | Concept | Scene |
| --- | --- | --- |
| m13-l01: Kustomize and Helm | Kustomize bases and overlays | m13-l01-overlay |
| m13-l01: Kustomize and Helm | Rendered manifest review | m13-l01-overlay |
| m13-l01: Kustomize and Helm | Helm charts and values | m13-l01-chart-release |
| m13-l01: Kustomize and Helm | Helm release lifecycle | m13-l01-chart-release |
| m13-l02: HPA, VPA, and node autoscaling | Horizontal Pod Autoscaler | m13-l02-hpa-loop |
| m13-l02: HPA, VPA, and node autoscaling | Metrics and request-based utilization | m13-l02-hpa-loop |
| m13-l02: HPA, VPA, and node autoscaling | Vertical Pod Autoscaler | m13-l02-capacity-loops |
| m13-l02: HPA, VPA, and node autoscaling | Node autoscaling | m13-l02-capacity-loops |
| m13-l02: HPA, VPA, and node autoscaling | Scaling feedback interactions | m13-l02-capacity-loops |
| m13-l03: Release configuration and safe delivery | Reproducible release configuration | m13-l03-release-inputs |
| m13-l03: Release configuration and safe delivery | Configuration rollout semantics | m13-l03-release-inputs |
| m13-l03: Release configuration and safe delivery | Readiness-gated delivery | m13-l03-delivery-gates |
| m13-l03: Release configuration and safe delivery | Evidence-based promotion | m13-l03-delivery-gates |
| m13-l03: Release configuration and safe delivery | Rollback compatibility | m13-l03-delivery-gates |

## m14: Inside the API

| Lesson | Concept | Scene |
| --- | --- | --- |
| m14-l01: Request lifecycle and admission | Identity, permission, admission, persistence | m14-l01-request-gates |
| m14-l01: Request lifecycle and admission | Mutating webhook and CEL validation | m14-l01-admission-mechanisms |
| m14-l02: Watches and server-side apply | List, resume, and rebuild a watch | m14-l02-watch-cursor |
| m14-l02: Watches and server-side apply | Two managers and one declared field | m14-l02-apply-owners |
| m14-l03: Finalizers, garbage collection, and API evolution | A named barrier requires a controller | m14-l03-finalizer-hold |
| m14-l03: Finalizers, garbage collection, and API evolution | Garbage collection follows owner identity | m14-l03-owner-uid |
| m14-l03: Finalizers, garbage collection, and API evolution | Migrate consumers before removing an API | m14-l03-api-evolution |

## m15: Control loops under the hood

| Lesson | Concept | Scene |
| --- | --- | --- |
| m15-l01: Informers, caches, and workqueues | Observation feeds a cache and a queue | m15-l01-informer-cache |
| m15-l01: Informers, caches, and workqueues | Dedupe, delay, and retry safely | m15-l01-queue-retries |
| m15-l02: Scheduler internals | Feasibility precedes preference | m15-l02-filter-score |
| m15-l02: Scheduler internals | A chosen node still needs binding | m15-l02-bind-cycle |
| m15-l03: Leases and leader election | Renewal and takeover through the API | m15-l03-lease-election |
| m15-l03: Leases and leader election | A Lease does not reject stale external writes | m15-l03-lease-fencing |

## m16: Extend the control plane

| Lesson | Concept | Scene |
| --- | --- | --- |
| m16-l01: CRDs, schemas, and conversion | API registration precedes reconciliation | m16-l01-crd-registration |
| m16-l01: CRDs, schemas, and conversion | Representation, storage, and observed generation | m16-l01-crd-version-status |
| m16-l02: Build an idempotent operator | WebApp intent becomes ordinary resources | m16-l02-operator-derive |
| m16-l02: Build an idempotent operator | Identity is stable while observation advances | m16-l02-operator-status |
| m16-l03: Ownership and failure recovery | Stable names do not grant adoption | m16-l03-operator-owner-check |
| m16-l03: Ownership and failure recovery | Repair a child, then delete the parent | m16-l03-operator-repair-gc |

## m17: Performance and pressure

| Lesson | Concept | Scene |
| --- | --- | --- |
| m17-l01: CPU throttling, OOM, and eviction | CPU delays work; memory can terminate it | m17-l01-cpu-memory-boundary |
| m17-l01: CPU throttling, OOM, and eviction | Node pressure differs from a container OOM | m17-l01-pressure-eviction |
| m17-l02: Autoscaling mechanics and feedback | Utilization divides usage by requests | m17-l02-hpa-formula |
| m17-l02: Autoscaling mechanics and feedback | Demand becomes useful capacity after delays | m17-l02-hpa-feedback |
| m17-l03: Capacity and scale trade-offs | Allocatable capacity must satisfy every constraint | m17-l03-capacity-budget |
| m17-l03: Capacity and scale trade-offs | Headroom covers rollout and failure transitions | m17-l03-headroom-transition |

## m18: Operate the control plane

| Lesson | Concept | Scene |
| --- | --- | --- |
| m18-l01: HA, etcd quorum, and failure domains | Quorum counts configured voters | m18-l01-etcd-quorum |
| m18-l01: HA, etcd quorum, and failure domains | Redundancy requires independent failure domains | m18-l01-failure-domains |
| m18-l02: PKI, kubeadm, and safe upgrades | Serving identity and client identity are separate | m18-l02-pki-paths |
| m18-l02: PKI, kubeadm, and safe upgrades | Every intermediate version combination must be supported | m18-l02-safe-upgrade |
| m18-l03: Backup, restore, and disaster recovery | API state and data-plane bytes need separate backups | m18-l03-backup-boundaries |
| m18-l03: Backup, restore, and disaster recovery | Restore isolated membership and invalidate stale watch history | m18-l03-offline-restore |

## m19: Platform patterns

| Lesson | Concept | Scene |
| --- | --- | --- |
| m19-l01: GitOps and drift reconciliation | Revision, render, diff, sync, health | m19-l01-gitops-loop |
| m19-l01: GitOps and drift reconciliation | Drift repair includes an ownership decision | m19-l01-gitops-field-takeover |
| m19-l02: Tenancy and software supply chains | Namespace scope needs additional isolation controls | m19-l02-tenant-layers |
| m19-l02: Tenancy and software supply chains | Digest identity is input to a verification policy | m19-l02-artifact-trust |
| m19-l03: Service meshes and platform boundaries | A mesh secures a defined traffic path | m19-l03-mesh-identity |
| m19-l03: Service meshes and platform boundaries | Network policy, mesh policy, and provider ownership differ | m19-l03-platform-boundaries |

## m20: Put the system together

| Lesson | Concept | Scene |
| --- | --- | --- |
| m20-l01: Capstone: recover a stateless app | Ready Pods can sit outside a Service selector | m20-l01-stateless-failure |
| m20-l01: Capstone: recover a stateless app | Repair one relationship, then verify a real request | m20-l01-stateless-recovery |
| m20-l02: Capstone: recover stateful data | Persistence preserves deletion as well as data | m20-l02-stateful-loss |
| m20-l02: Capstone: recover stateful data | Restore bytes, then prove a new Pod sees them | m20-l02-stateful-restore |
| m20-l03: Capstone: GitOps and an operator | GitOps owns intention; operator owns implementation | m20-l03-platform-ownership |
| m20-l03: Capstone: GitOps and an operator | Repeat, repair, then collect owned children | m20-l03-platform-recovery |
