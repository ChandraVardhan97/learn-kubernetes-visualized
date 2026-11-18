# Foundations authoring report

Completed m01–m06: 18 lessons, 64 declared concepts, and 36 focused scenes. Every scene includes three narrated main frames and a three-frame alternate failure branch. Each taught frontmatter concept maps to an embedded scene.

## Coverage

| Lesson | Title | Prose words (excluding fenced code) | Scenes |
| --- | --- | ---: | ---: |
| m01-l01 | Containers are processes | 728 | 2 |
| m01-l02 | Images and registries | 726 | 2 |
| m01-l03 | Networking before Kubernetes | 747 | 2 |
| m02-l01 | Inside a Kubernetes cluster | 723 | 2 |
| m02-l02 | Desired state and reconciliation | 689 | 2 |
| m02-l03 | From kubectl to a running Pod | 694 | 2 |
| m03-l01 | Objects, YAML, and apply | 690 | 2 |
| m03-l02 | Labels, selectors, and namespaces | 660 | 2 |
| m03-l03 | kubectl and your cluster context | 665 | 2 |
| m04-l01 | The Pod lifecycle | 738 | 2 |
| m04-l02 | Init containers and sidecars | 707 | 2 |
| m04-l03 | Configuration and Secrets | 659 | 2 |
| m05-l01 | Deployments and ReplicaSets | 721 | 2 |
| m05-l02 | Rolling updates and rollback | 659 | 2 |
| m05-l03 | Probes and graceful recovery | 654 | 2 |
| m06-l01 | Services and EndpointSlices | 619 | 2 |
| m06-l02 | DNS and service exposure | 678 | 2 |
| m06-l03 | Your first debugging workflow | 735 | 2 |

## Editorial and verification notes

- Official Kubernetes documentation is the primary baseline, with Docker, OCI, RFC, and Linux manual sources for pre-cluster foundations. Reviewed metadata uses 2026-10-27 and Kubernetes 1.37 as requested; examples deliberately avoid optional version-dependent features other than documented stable restartable init sidecars.
- Training images use explicit example tags for readable exercises. Text distinguishes those tags from immutable release identities and does not claim image security, production readiness, or measured performance.
- Requires an existing disposable cluster and appropriate API permissions. Docker exercises in m01 are optional. Cloud and local LoadBalancer/NodePort limitations are explicit. Labs are linked using /labs/#mXX for the root author to supply.
- Prerequisites refer only to the immediately preceding foundations lesson; m01-l01 has none. No UI, engine, root configuration, labs, tests, or snapshots were modified.
- Scene geometry uses the renderer default layout, with at most six nodes per frame. Every edge references a node present in that frame. Scenes represent logical mechanisms and explicitly state their material simplifications.
- Commands containing ACTUAL_* or YOUR_LAB_CONTEXT require substitution from the learner’s verified inventory. No fake digest is presented as pullable. All secret examples use dummy values and avoid printing secret content.

## Completed content checks

- Parsed all 18 JSON-compatible frontmatter blocks with the installed YAML parser. Reviewed/version fields are strings, objectives have three entries, and all prerequisites point backward.
- Parsed all 18 complete YAML documents embedded in lessons; each has apiVersion, kind, and metadata.name. No cluster execution is claimed by this parser check.
- Validated 36 unique scene IDs, 216 complete main/alternate frames, allowed node types/states, eight-node bounds, unique frame node IDs, and every edge endpoint.
- Confirmed all 64 lesson-prefixed concept IDs are unique and every concept resolves to an embedded scene.
- Normalized all details/summary blocks to MDX block JSX spacing after the parent build identified the initial inline-tag formatting issue.

## Validation concerns for integration

- Run the shared Astro/MDX build and parent scene validator after all level authors finish. Content-level validation here checks JSON/frontmatter shape and references; it does not prove cluster execution in every distribution.
- The local authoring environment had no configured cluster exercise performed. Expected results are semantic expectations, not claimed measured observations.
- JSON-compatible frontmatter is valid YAML; ensure the shared content schema accepts quoted reviewed and kubernetesVersion strings, as the contract specifies.
