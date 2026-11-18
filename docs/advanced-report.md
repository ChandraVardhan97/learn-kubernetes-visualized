# Advanced curriculum authoring report

Reviewed 2026-10-27. Kubernetes baseline: "1.37".

## Delivered

- 21 lessons, three each for m14–m20, in `src/content/lessons/advanced/`.
- 43 concept-specific scenes in 21 JSON arrays under `src/content/scenes/advanced/`.
- 130 main-path frames and 129 alternate-path frames. Every scene has 3–4 main frames and a three-frame meaningful failure/alternate branch. Scenes use at most six nodes, explicit 760×340-compatible positions, and valid local edge endpoints.
- 14,571 prose words excluding frontmatter, code fences, imports and JSX tags; individual lessons contain 658–734 prose words. Each also includes annotated YAML, diagnostic commands, observations, pitfalls, a prediction question with rationale, next steps and a local lab link.
- 22 parsed YAML documents and 21 shell snippets. All lessons declare exactly three objectives and quoted version/date strings; prerequisite IDs resolve against the existing lesson inventory.

## Coverage and operational boundaries

m14 covers authentication/authorization/admission separation, webhook mutation and failures, CEL policy bindings, opaque watch cursors and relisting, SSA field ownership, finalizers, owner-UID garbage collection and API migration.

m15 covers eventual informer caches, deduplicating queues, backoff and partial success; scheduler feasibility, scoring, reservation and binding; and Lease renewal with explicit lack of target-side fencing guarantees.

m16 uses the actual local `WebApp` API (`webapps.labs.kv.example`) and host Python operator. It covers structural schemas/pruning, version conversion/storage migration, status semantics, idempotent child derivation, safe ownership checks, repair and garbage collection. The controller's polling, status sampling, ConfigMap refresh behavior and omitted production features are stated explicitly.

m17 separates CPU throttling, container OOM and node-pressure eviction. HPA material explains usage/request utilization, the replica formula, missing data, stabilization, capacity delays and ownership. Capacity lessons include allocatable resources, fragmentation, surge and failure headroom, and dependency/control-plane bottlenecks.

m18 covers voting quorum, membership, failure domains and timing; PKI and process reload; release-specific safe upgrade/skew checks; and API snapshot recovery. It aligns with the guarded, offline, separate `kv-recovery` exercise and explicitly excludes PV bytes, keys and full worker migration from an etcd-only recovery claim.

m19 covers GitOps/Argo CD drift, self-heal/prune choices, explicit lab SSA takeover, layered tenancy, digest identity, signer trust enforcement, mesh coverage and provider responsibilities. NetworkPolicy behavior is qualified by networking implementation; meshes do not replace network policy or application authorization.

m20 matches all three real capstone scripts: selector-based stateless recovery; quiescent file backup, real deletion, restoration and post-replacement verification; and GitOps parent ownership with WebApp operator conflict, repeat, repair and garbage-collection assertions.

## Verification

Scoped Node checks parsed all advanced frontmatter, JSON, YAML fences and source URL shapes; checked required sections, imports, local lab anchors, prediction disclosure markup, objectives, version/date, module counts and prerequisite references; checked scene kinds, node/edge enums, frame counts, coordinate bounds, uniqueness and edge endpoints; and ran `bash -n` on every shell fence. Result: zero errors.

Compiled all 21 advanced MDX bodies with the installed Astro Satteri `createMdxRenderer` path, using the real frontmatter and project source directory. Result: all 21 compiled successfully. A direct `@mdx-js/mdx` import was unavailable because this Astro version uses Satteri; verification used the installed renderer instead.

Primary references include Kubernetes documentation, etcd operations/recovery guidance, client-go documentation, Argo CD documentation, Sigstore and Istio documentation. Relevant API, admission, HPA, recovery, skew, tenancy and mesh documentation was consulted during authoring.

## Limits and handoff

No whole-project build, root validation run, browser screenshot pass, live cluster mutation or lab execution was performed by this content author. Root integration should run the complete content/build/browser checks; the lab owner verifies runnable assets. Static YAML/shell checks and MDX compilation do not establish live Kubernetes acceptance or runtime success. Optional policy, metrics, Argo CD, signing verification and mesh experiments identify their add-on requirements and do not claim those components are installed.

Only the assigned advanced lesson/scene directories and this report were modified. No commits, new tests, snapshots, UI/configuration changes or lab changes were created.
