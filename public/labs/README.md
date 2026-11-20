# Kubernetes, Visualized — local lab bundle

This bundle contains 20 module labs, three capstones in m20, a separate offline restore exercise in m18, four optional practice challenges, and kind.yaml. All resources target the disposable kind-kv-lab context and kv-lab namespace. Use Docker, kind v0.33.0, kubectl v1.37.x and Python 3. Scripts fail closed if the named cluster/context identity does not match. Open each exercise README for the objective, starting state, commands, solution, verification and cleanup.

## Prepare your machine

- **macOS:** Start [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) and open Terminal. Use the Darwin builds of kind and kubectl for your Apple Silicon (ARM64) or Intel (AMD64) Mac. Install Python 3 if needed.
- **Windows:** Set up [Ubuntu on WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) and [enable Docker Desktop's WSL integration](https://docs.docker.com/desktop/features/wsl/) for Ubuntu in Linux containers mode. Install Python 3 and the Linux builds of kind and kubectl inside Ubuntu. Extract this bundle in your Ubuntu home directory and run the lab commands from Ubuntu's Bash shell. An end-to-end run on Windows WSL 2 is pending.

Use the version-pinned tools above. Confirm Docker is running with `docker version` and check the CLI versions with `kind version`, `kubectl version --client`, and `python3 --version`. See the [website setup guide](https://k8s-visualized.pages.dev/labs/#setup) for installation links and expected results.

## Setup

```bash
# From this extracted bundle directory. Keep this shell's KUBECONFIG set for the labs.
export KUBECONFIG="$PWD/kv-lab.kubeconfig"
kind create cluster --name kv-lab --config kind.yaml --wait 180s
kubectl --context kind-kv-lab wait --for=condition=Ready nodes --all --timeout=180s
kubectl --context kind-kv-lab get nodes
(
  cd m02 && bash run.sh && bash cleanup.sh
)
```

Every module requires all files in its directory. Run scripts with Bash; executable permission is not required. The runner never changes your active context. Cluster creation writes only the kubeconfig selected above.

m08 measures real NetworkPolicy enforcement. If deny traffic still succeeds, install a compatible enforcing CNI/policy controller; accepting the policy object proves nothing about isolation. Modern kind includes policy support, so do not assume all kind versions ignore policies.

m09 verifies PVC persistence with local-path storage. CSI snapshots require supporting CRDs/controller/driver. m13 creates HPA but requires Metrics Server plus a measured load to prove resource autoscaling. No load-based scale success is claimed without that prerequisite.

m16 and m20 include an actual Python polling operator for WebApp resources. Repeated reconciliation, owner references and custom resource field ownership are exercised. It is not a production controller framework.

m18 captures an etcd snapshot outside the node. m18 and m20 print a private user-specific OS temporary directory for runtime outputs; run `python3 backup-path.py m18` or `m20` from that module directory to retrieve it. Set the same `KV_LAB_BACKUP_DIR` override for capture and recovery when choosing a durable private directory. Symlink-resolved public/dist destinations are refused; OS temporary storage can be cleared, so preserve wanted backups elsewhere privately. The optional restore-offline.sh creates only a separate kv-recovery cluster, refuses an existing one, stops its API server/etcd before restoring, and checks a saved marker. Read RECOVERY.md first. Snapshots contain Secrets and must never be published. kind on one host does not prove production HA or failure-domain recovery.

m19's Argo CD extension is compatibility research, not a runnable install recipe: upstream's reviewed tested-version matrix does not include the Kubernetes 1.37 baseline. Select and runtime-verify a supported pair in a separate disposable cluster before installing it. Other optional controllers (Ingress/Gateway, meshes, telemetry and autoscalers) are not installed implicitly.

## Cleanup

Follow the Clean up steps in each exercise README before moving on. Keep any wanted data backup outside the cluster. m16/m20 share a CRD; delete it only after both are done. When all labs are finished:

```bash
kind delete cluster --name kv-lab
# If you ran the optional recovery procedure, from the m18 directory:
bash cleanup-recovery.sh
```

The node image digest is from the official v0.33.0 release: https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0 . Application image version tags can be republished; use resolved image digests for production delivery.

All common lab runners, the standalone WebApp operator and offline recovery now fail before cluster actions unless the invoked client is kubectl v1.37.x, matching the pinned server minor version. In this checkout, place the checksum-verified runtime first with `export PATH="$PWD/.runtime/bin:$PATH"` from the repository root. Downloaded bundles require the documented client installation on PATH.
