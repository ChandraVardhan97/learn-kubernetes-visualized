# Optional GitOps controller: compatibility research

The executable m19 baseline demonstrates declarative drift repair through server-side apply. It does not install Argo CD or continuously reconcile from Git.

This extension is research-only until a supported Argo CD / Kubernetes combination is selected and verified. On 2026-10-28, the upstream Argo CD 3.5 tested-version matrix lists Kubernetes 1.33–1.36; it does not list this book's Kubernetes 1.37 lab baseline. The previously supplied Argo CD 3.2.3 installation recipe has been withdrawn: its 3.2 matrix lists 1.31–1.34, and the release is outside upstream's latest-three-minor support policy. An absent matrix entry is not proof of incompatibility, but it is insufficient evidence to recommend this installation.

Before turning this extension into a runnable exercise:

1. Select an upstream-supported Argo CD release and a Kubernetes minor in its tested matrix. Recheck the live matrix and support policy; do not assume the versions above remain current.
2. Use a separate, explicitly named disposable cluster. Record its kind version, node image digest and kubectl minor independently from kv-lab. Do not alter the baseline lab pins to accommodate an add-on silently.
3. Download an exact release manifest from the official project, inspect its cluster RBAC and CRDs, and record its integrity. Follow that release's installation instructions, including namespace assumptions.
4. Verify controller readiness, then configure a repository you control and an Application with an explicit destination namespace. Test a ConfigMap-only change and drift repair before deliberately enabling automated sync or pruning.
5. Record application-level results and cleanup instructions. Destroy only the separate extension cluster when finished; removing just its namespace can leave cluster-scoped resources.

No installation commands or runtime-compatibility claim are supplied for the unverified 1.37 combination. The baseline exercise remains usable without this extension.

Official sources:
- Tested versions: https://argo-cd.readthedocs.io/en/stable/operator-manual/tested-kubernetes-versions/
- Historical 3.2 matrix: https://argo-cd.readthedocs.io/en/release-3.2/operator-manual/tested-kubernetes-versions/
- Support policy: https://argo-cd.readthedocs.io/en/stable/developer-guide/release-process-and-cadence/
- Installation: https://argo-cd.readthedocs.io/en/stable/getting_started/
