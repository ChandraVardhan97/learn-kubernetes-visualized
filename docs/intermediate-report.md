# Intermediate curriculum authoring report

Reviewed 2026-10-27 against the project's Kubernetes 1.37 baseline. Authored only `src/content/lessons/intermediate/*.mdx`, `src/content/scenes/intermediate/*.json`, and this report. Shared UI, module definitions, labs, dependency configuration and other levels were not changed.

## Deliverables

- 21 lessons: `m07-l01` through `m13-l03`, with the exact module lesson titles from `src/data/modules.ts`.
- 42 bespoke scenes: two per lesson, each with four primary frames and a three-frame alternative failure scenario, for 294 narrated frames.
- 88 lesson-prefixed concept IDs, each mapped to an embedded, explanatory scene.
- 21 prediction questions with answers and rationale in separated `<details>` blocks.
- 22 annotated YAML fences and 23 Bash fences, plus explicitly labeled PromQL examples in supported plain text fences.
- Approximately 14,532 prose words excluding code fences, frontmatter, imports and the primary-documentation appendix. Individual prose counts range from 612 to 819. Counts include headings and prediction-answer prose.
- Three objectives per lesson, local module lab links, prerequisites, specific primary documentation, and string-valued review/version metadata.

## Lesson coverage and prose counts

| Lesson | Title | Prose words | Distinct mechanisms and failure branches |
| --- | --- | ---: | --- |
| m07-l01 | Requests, limits, and QoS | 728 | Request-based fit, CPU throttling, memory OOM, three QoS classes, why Guaranteed can still fail |
| m07-l02 | Scheduling constraints | 694 | Required versus preferred selection, node and Pod affinity, anti-affinity, taints and tolerations, NoExecute eviction |
| m07-l03 | Topology and resource governance | 722 | Domain counts and skew, hard spread with exhausted capacity, LimitRange defaults, quota admission and rollout surge |
| m08-l01 | Pod networks and service routing | 819 | CNI setup, cross-node paths, kube-proxy kernel rules, eBPF alternatives, EndpointSlice readiness and unusable Service backends |
| m08-l02 | NetworkPolicy and isolation | 712 | Independent ingress/egress gates, additive permission union, peer selector AND/OR, provider enforcement tests |
| m08-l03 | Ingress, Gateway API, and TLS | 722 | Ingress/controller relationship, Gateway ownership and attachment, route status, TLS identity and separate backend connection |
| m09-l01 | Volumes and persistent claims | 687 | Writable layer versus emptyDir versus PVC lifetime, binding, access modes, per-node versus per-Pod access, reclaim policy |
| m09-l02 | Dynamic provisioning and CSI | 709 | StorageClass defaulting, WaitForFirstConsumer topology, CSI controller/node checkpoints, attachment/mount failures, expansion |
| m09-l03 | Snapshots and storage recovery | 666 | Snapshot APIs and driver prerequisites, content binding, consistency boundaries, restoring a new claim and checking application integrity |
| m10-l01 | StatefulSets and stable identity | 660 | Ordinal names, headless discovery, replacement UID/IP, claim templates, readiness-gated ordered rollout and blocked members |
| m10-l02 | DaemonSets, Jobs, and CronJobs | 680 | Eligible-node agents, bounded Job execution, side-effect idempotency, CronJob concurrency and skipped intervals |
| m10-l03 | Termination, disruption, and drain | 675 | Grace period and preStop budget, traffic propagation, PDB eviction allowance, cordon/drain, absent health or replacement capacity |
| m11-l01 | Authentication, RBAC, and ServiceAccounts | 657 | API identity, projected audience-bound rotating tokens, roles/bindings, namespaced grants, additive permissions and excess grants |
| m11-l02 | Security contexts and Pod Security | 612 | UID/group, capabilities, seccomp, writable mounts, Restricted admission versus warn mode and runtime permission errors |
| m11-l03 | Protecting Secrets and tenant boundaries | 689 | Base64 versus encryption, credential projection/reload, direct and indirect access, layered namespace and host boundaries |
| m12-l01 | Debug the failing workload | 705 | Phase versus waiting reason, scheduler/image/process checkpoints, previous logs, probe-caused restarts and authorized ephemeral containers |
| m12-l02 | Debug network and storage failures | 701 | Same-source DNS/VIP/direct comparisons, ready endpoints, policy, PVC/attach/mount/access checkpoints and permission diagnosis |
| m12-l03 | Metrics, logs, and traces | 711 | Metrics Server versus observability, Prometheus scraping and cardinality, Grafana queries, structured logs, OTel context and pipeline failures |
| m13-l01 | Kustomize and Helm | 645 | Bases/overlays, rendered diffs and server dry-run, charts/values, release revisions, semantic defects beyond resource readiness |
| m13-l02 | HPA, VPA, and node autoscaling | 636 | CPU request denominator, ratio model, missing metrics, replica versus Pod sizing versus infrastructure loops, unsatisfiable constraints |
| m13-l03 | Release configuration and safe delivery | 702 | Immutable inputs, ConfigMap consumption, template revisions, surge/readiness/minReadySeconds, promotion evidence and data-compatible recovery |

## Verification performed

A temporary scoped verification script used the workspace's installed `yaml` and `satteri` packages. It checked only intermediate authoring outputs rather than invoking a concurrent whole-project build.

1. Parsed all 21 frontmatter documents and checked lesson/module/order/lab consistency, intermediate level, three objectives, review/version strings and prerequisite existence.
2. Parsed and compiled every MDX body with the installed Sätteri `mdxToJs` implementation, using Astro as the JSX import source. All 21 passed.
3. Parsed all 22 YAML fences with `yaml.parseAllDocuments`; no YAML syntax errors. Examples identified as fragments were checked as syntax, not misrepresented as complete Kubernetes resources.
4. Ran `bash -n` against all 23 Bash snippets; all passed. No cluster-changing training command was executed as part of this check.
5. Parsed every scene JSON document and checked unique scene and concept IDs, scene embeddings for all concepts, graph node IDs, valid edge references and states, assumptions, base frame counts and alternate scenarios. All 42 passed. Frames use at most six nodes, below the eight-node contract limit.
6. Checked local prerequisite references and `/labs/#mXX` links. Cross-level prerequisite `m06-l03` exists; later modules form a forward learning sequence.
7. Replaced the unsupported `promql` highlighting fence with `text` and a visible “PromQL expressions” label. No highlighting dependency was added.
8. Checked prose lengths separately from code and reference lists to ensure each lesson has at least 600 substantive prose words.

The root agent owns final Astro checks, global content validation, production build, browser verification and runnable lab validation. No commit was created.

## Correctness decisions and integration notes

- Requests govern scheduling accounting; limits govern runtime constraints. CPU throttling, memory OOM and node-pressure eviction are treated separately. QoS is not described as immunity.
- Network implementation details are explicitly qualified. NetworkPolicy requires actual enforcement verification on the chosen provider/version; no blanket claim is made that every kind default lacks enforcement. Baseline/deny/allow testing is recommended.
- Service paths distinguish API objects, EndpointSlice readiness and the programmed data plane. A Service is not drawn as a mandatory central application proxy process. eBPF and kube-proxy implementations have separate explanatory metadata and narration.
- Ingress needs a controller. Gateway API needs installed CRDs and an implementation. Route acceptance, reference resolution, external reachability and backend readiness are separate checkpoints.
- RWO is a one-node access arrangement and does not imply a single writer. RWOP is qualified by CSI support. Neither mode supplies application transaction locking.
- WaitForFirstConsumer Pending is treated as potentially healthy. CSI binding, attachment, mounting and application filesystem access have distinct diagnoses.
- Snapshots require snapshot APIs/controllers and compatible CSI support. Crash consistency, application consistency and independent backup failure domains are separated. Recovery includes actual application validation.
- StatefulSet identity does not imply replication or a quorum. Force removal of unreachable writers is not presented as an innocuous fix.
- PDBs protect covered voluntary Eviction API disruptions; they do not prevent node failures or govern Deployment rolling-update strategy. Drain examples omit destructive force and local-data removal flags.
- RBAC is additive. Bound ServiceAccount tokens have audience/lifetime/rotation behavior. Direct Secret access and arbitrary Pod creation are distinguished as credential access paths.
- Secret base64 encoding is explicitly not encryption; encryption-at-rest is not assumed to be enabled on every cluster. No real Secret values are shown or printed.
- HPA CPU utilization depends on requests and a metrics pipeline. VPA and node autoscalers are optional add-ons; their interaction and capacity limitations are explained. HPA desired replicas are not equated with ready capacity.
- A progress deadline reports a stalled Deployment; it is not presented as automatic rollback. Deployment or Helm rollback does not reverse arbitrary external data changes or mutable ConfigMap history.

## Deliberate limitations

The lesson manifests are educational examples and clearly marked fragments where applicable. Named lab workloads, local files, node names and optional-controller installations must follow the root-owned lab instructions; this authoring pass did not execute them against a cluster. Training image tags are clearly distinguished from immutable production release identifiers. Optional Gateway, snapshot, metrics, Prometheus/Grafana/OTel, VPA and infrastructure autoscaling paths require the stated implementations. The content makes no measured latency, uptime, recovery-time or production-throughput claims.
