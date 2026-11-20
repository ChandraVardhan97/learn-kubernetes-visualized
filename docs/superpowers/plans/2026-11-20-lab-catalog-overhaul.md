# Kubernetes Visualized Lab Catalog Overhaul

> **For implementers:** Use the Superpowers executing-plans workflow. Complete and verify the milestones in order.

**Goal**

Make every lab a self-contained exercise with a clear objective, a reproducible starting state, relevant diagnostics, and a solution the learner can verify locally.

**Architecture**

Keep the Astro lab catalog and downloadable kind bundle. Author each exercise once, render the same instructions on the website and in its downloadable README, and test the published instructions from an extracted ZIP against the pinned Kubernetes baseline.

## 1. What the audit found

- The catalog has 20 module entries and 122 individual module downloads. The m20 entry covers three distinct capstones. m18 has a separate, runnable offline restore. These need their own walkthroughs and execution records.
- All 20 `Diagnose` blocks use the same Pod list, namespace events, and Pod describe commands with the lab ID substituted. For example, m03 teaches ConfigMap identity and metadata, yet its diagnostic commands never read the ConfigMap.
- Most `run.sh` files perform a full demonstration, including the fix. m06 establishes working HTTP, introduces a bad selector, observes failure, then repairs the selector. As the first command for a troubleshooting exercise, that script skips the learner's investigation.
- `src/data/labs.ts` embeds the exercise text and download bodies. The downloads also exist in `public/labs/` and `public/labs/kv-labs.zip`. This creates multiple copies of learner instructions.
- `scripts/run-labs.sh all` runs the existing demonstrations and invokes cleanup. It does not execute the optional offline restore or prove that the website's manual paths work. The current local host is macOS arm64. Docker Desktop and the project-pinned clients are present, but the daemon was unavailable during this planning audit.

## 2. Standard for every exercise

| Section | What the learner sees |
| --- | --- |
| **Objective** | A visible statement of what they will do and the Kubernetes behavior they will learn. |
| **Requirements & expected results** | Separate **Requirements**, **Initial state**, and **Expected results**. State the working directory, needed tools or add-ons, context and namespace where relevant, what the setup creates, what symptom is deliberate, what the learner must preserve, and observable pass criteria. |
| **Run, inspect & clean up** | Commands to establish the starting state, scenario-specific diagnostics with a sentence about what to look for, a verification step that does not perform the repair, and the lab's own cleanup. The shared cluster teardown stays in the cluster setup guide. |
| **Solution** | A collapsed, keyboard-accessible walkthrough. Explain how to interpret the evidence, why it points to the relevant Kubernetes field or controller, which command changes it, and how to verify the result. Guided labs explain what to compare at each step. |
| **Exercise files** | The README and runnable files, plus the existing whole-catalog ZIP. Both download paths use the same instructions as the site. |

Show **Guided exercise** for activities built around an observation and **Troubleshooting challenge** for those that start with an intentional fault. Keep the existing catalog, filters, copy controls, and `/labs/#m01` through `/labs/#m20` links. Give each capstone a stable subsection under m20. Surface tool and resource exceptions where the learner needs them. Link to version-relevant primary documentation from each exercise.

The format takes inspiration from Killercoda's focused scenarios, Killer Shell's concrete end-state checks and detailed solutions, and KodeKloud's symptom-driven troubleshooting. All scenarios, manifests, and instructions will be original to this project. [Killercoda CKA practice](https://killercoda.com/cka) · [Killer Shell CKA simulator](https://killer.sh/cka) · [KodeKloud Kubernetes troubleshooting](https://kodekloud.com/courses/kubernetes-troubleshooting-for-application-developers)

## 3. Implement one complete example

- [ ] Extend `src/data/labs.ts` with an exercise type and structured fields for objective, requirements, initial state, expected results, setup, diagnostics, verification, solution, cleanup, and official references. For steps use a short explanation and an optional copyable command. Give m18 recovery and the three capstones their own child exercises. Keep module IDs separate from optional practice IDs.
- [ ] Update `src/pages/labs.astro` to render the structure using existing section styles and `CodeBlock.astro`. Extract a small exercise component if module, capstone, and practice markup would otherwise repeat. Build the m06 page and check the heading order, disclosure controls, copy behavior, and narrow layout.
- [ ] Split the m06 demonstration into a learner path and a repeatable demonstration. Add a start command that confirms a healthy baseline, intentionally applies `app=no-match`, and stops once the fault is observable. Keep `bash run.sh` usable as the full demonstration by composing the same operations. Use bounded waits for rollout and EndpointSlice convergence.
- [ ] Give m06 a short diagnostic sequence. Inspect the Deployment and the labels of selected Pods. Compare them with the actual selector on Service `m06`. Inspect EndpointSlices using `kubernetes.io/service-name=m06`. Resolve the Service name and attempt a new HTTP request from Pod `m06-client`. Explain how DNS can resolve and the Deployment can be ready while the Service has no usable backends.
- [ ] In the collapsed solution, patch the selector to `app=m06`, check ready endpoints, and require a successful HTTP request from the same client. Assert that the diagnostic commands succeed as inspection commands and that only the expected request fails before the fix. Assert absence of lab workloads and endpoints after cleanup. [Debug Services in Kubernetes](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [ ] Derive the module README from the structured data via a shared Markdown renderer in `src/lib/lab-readme.ts`. Add `scripts/build-lab-downloads.ts` to regenerate tracked READMEs and the ZIP from the allowlisted lab inventory. Extend `scripts/validate-labs.ts` and `scripts/check-public-assets.ts` to validate generated README parity, archive paths and content, and real on-disk assets. Keep Bash, Python, YAML, namespace, and guard checks. Use byte parity for entries instead of requiring identical ZIP timestamps across platforms. Verify the example from a fresh ZIP extraction.

## 4. Rewrite and exercise the existing catalog

Work in curriculum order after m06. Reuse the existing scripts and fixtures for guided exercises. Where the runner repairs a fault, give the learner a way to stop at the starter state and verify the outcome independently. Each diagnostic must inspect the specific resource, condition, or behavior the learner uses to decide what to do next.

| Batch | Evidence the new diagnostics should surface |
| --- | --- |
| **Foundations, m01–m06** | Container output and Pod HTTP, owner references and replacement Pod UID, ConfigMap UID/annotation/resource version, init status and container-specific logs, readiness and rollout history, then Service selection and client HTTP. |
| **Intermediate, m07–m13** | Scheduling conditions and node labels, NetworkPolicy selectors plus fresh connection results, PVC/PV and mounted file, workload-specific status for StatefulSet/DaemonSet/Job, allowed and denied RBAC actions, crash logs and Service routing, then rendered Kustomize and HPA metric conditions. |
| **Advanced, m14–m19** | SSA conflict/managed fields and finalizer state, Lease and watch output, WebApp status and owned children, precise `OOMKilled` reason, snapshot and recovered marker, then declared/live ConfigMap diff and field ownership. |
| **Capstones, m20** | Three separate walkthroughs and verifiers for HTTP recovery, byte-for-byte file recovery after Pod replacement, and operator repair/garbage collection with field ownership evidence. |

- [ ] For each entry, read the actual manifests and runner, confirm resource names and Kubernetes semantics, document observable before/after states, and exercise the exact published steps. Distinguish intentional negative outcomes from infrastructure failures. Never count an image pull error as the expected scheduling or application failure, or a failed `kubectl exec` as evidence that a service is down.
- [ ] Run m18's snapshot capture and offline restore as separate steps. Verify the saved marker through the recovery context, confirm the original cluster was undisturbed, and remove the recovery cluster after the test. Keep snapshot files, kubeconfigs, and backups in private temporary directories.
- [ ] Document the scope of m13 and m19 accurately. m13 exercises HPA prerequisite diagnosis on the baseline. m19 exercises manual reconciliation and field ownership. Keep the Argo CD compatibility note as reading and include no unverified add-on commands as runnable lab steps.

## 5. Add four original optional challenges

Register them as supplemental entries `p01`–`p04` associated with m06, m07, m09, and m11 respectively. Keep the 20 course-module links stable. Give each challenge its own fixtures, instructions, and cleanup. All four use the existing kind baseline.

| Challenge | Initial state and proof of completion |
| --- | --- |
| **p01 · Service target port** | Pods are ready and selected, but HTTP targets the wrong backend port. Inspect the Service, EndpointSlice port, and actual listener. Correct the target port and verify HTTP from the original client. |
| **p02 · Taint and toleration** | A Pod selects a specific disposable worker but cannot tolerate its teaching taint. Use scheduler events to explain why. Add a narrow toleration and verify placement on that worker. Cleanup restores the worker's original metadata. |
| **p03 · PVC class mismatch** | A claim asks for a class without a matching provisioner or volume. Diagnose the mismatch from PVC events and the available classes. Recreate the demonstrably unbound teaching claim with the intended class, then verify it binds and its consumer can write and read the mount. |
| **p04 · Namespaced RBAC** | A synthetic ServiceAccount can read ConfigMaps in its home namespace but gets denied in a second lab-owned namespace. Bind only the required read permission in the target namespace. Verify the intended read succeeds, while writes and Secret reads remain denied. |

## 6. Run the complete local verification before publication

- [ ] Check Docker, the pinned kind 0.33.0, and kubectl 1.37.x. Use the repository's digest-pinned Kubernetes 1.37.0 config, an isolated kubeconfig, and a task-owned `kv-lab`. If that fixed name is already in use, preserve the existing cluster and run in a separate Docker environment. Confirm the API node identities before mutating anything. [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [ ] Extend `scripts/run-labs.sh` to select one exercise or the full published catalog and run from an extracted bundle. For each exercise record initial state, diagnostics, published solution or guided steps, final-state verification, and cleanup. Run cleanup on success and failure. Test at least one interrupted setup. Stop the suite on failed cleanup so leftover state cannot affect later results.
- [ ] Verify cleanup independently of its exit code. Check named/labeled lab workloads and custom resources, teaching finalizers, PVCs and provisioned PVs, changes to node metadata, and temporary containers or recovery clusters where relevant. Account for shared fixtures explicitly and remove them at suite teardown when created by the suite. Preserve external resources and the user's active context. Remove only the suite-owned clusters and temporary assets when done.
- [ ] Run strict Kubernetes server-side validation with necessary admission and CRD prerequisites. Run `npm run check`, `npm run verify:labs`, `npm test`, `npm run build`, and the existing browser suite against the production build. Add one browser journey covering a module deep link, solution reveal, command copying, and the ZIP link. Check representative mobile and desktop labs. Keep the full Docker suite a local release check and the static checks in existing CI.
- [ ] Record one fresh row per published procedure in `docs/labs-report.md`: macOS/architecture, tool versions, exact scenario, observed initial/expected result, diagnostic evidence, solution, and cleanup outcome. Include all existing module activities, the three individual capstones, offline recovery, and the four new challenges. Record Windows/WSL2 separately if executed. A Mac run does not establish Windows verification. Investigate unexpected outcomes before publishing the affected scenario, and rerun the documented sequence after any correction.

**Release acceptance**

Every runnable lab has an objective, requirements, reproducible initial state, specific diagnostic steps, a solution, a checkable end state, and cleanup. The site, individual downloads, and ZIP agree. Every published procedure passes locally with evidence for its final state and cleanup. Existing lesson links and copy buttons pass a production-build browser check.
