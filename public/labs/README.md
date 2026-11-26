# Kubernetes, Visualized — local lab bundle

This bundle contains 20 module labs, three capstones in m20, a separate offline restore exercise in m18, four optional practice challenges, and kind.yaml. All resources target the disposable kind-kv-lab context and kv-lab namespace. Use Docker, kind v0.33.0, kubectl v1.37.x and Python 3. Scripts fail closed if the named cluster/context identity does not match. Open each exercise README for the objective, starting state, commands, solution, verification and cleanup.

## Prepare your machine

- **macOS:** Start [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/), install [Python 3](https://www.python.org/downloads/macos/) if needed, and enter Bash by running `bash` in Terminal.
- **Windows:** Set up [Ubuntu on WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) and [enable Docker Desktop's WSL integration](https://docs.docker.com/desktop/features/wsl/) for Ubuntu in Linux containers mode. In Ubuntu, run `sudo apt update` and `sudo apt install curl python3 unzip`. Extract the bundle inside your Ubuntu home directory and run the lab commands from Ubuntu's Bash shell.

Setup uses the same bundle for both platforms and installs the pinned tools in its private `.kv-lab/bin` directory. It checks the downloads against the official release checksums. You need internet access for the first setup and several GiB of free disk space for the cluster and images. See the [website setup guide](https://learn-k8s.chandubodduluri.com/labs/#setup).

## Setup

```bash
# From the extracted bundle in Bash:
bash setup.sh && source ./lab-env.sh
(
  cd m02 && bash run.sh && bash cleanup.sh
)
```

Setup requires one control plane and two workers to be Ready and checks CoreDNS. The activation command selects `.kv-lab/kubeconfig` for this shell. In a new Bash session, move back to the extracted directory and run `source ./lab-env.sh`. Every module requires all files in its directory. Run scripts with Bash.

## Troubleshooting setup

- If Docker is unavailable in Ubuntu, confirm the distribution is running under WSL 2 with `wsl -l -v` from PowerShell. Check Docker Desktop's Ubuntu integration and Linux containers mode, then run `docker version` from Ubuntu. It should show a Server section.
- If an image pull fails, try `docker pull busybox:1.37.0` from the same shell. Check the registry connection and Docker Desktop sign-in when relevant. If Ubuntu reports an error getting credentials from `desktop.exe`, a shell-scoped config can test public pulls without that helper. Use it only with local Docker Desktop on WSL 2 through the default Unix socket and when anonymous public pulls are available:

  ```bash
  export DOCKER_CONFIG="$(mktemp -d)"
  printf '{"auths":{}}\n' > "$DOCKER_CONFIG/config.json"
  bash setup.sh && source ./lab-env.sh
  ```

  Keep that setting in the lab shell until cleanup. Then remove the temporary config directory and unset `DOCKER_CONFIG` or close the shell. Your usual Docker settings are stored separately.
- If WSL or Docker Desktop itself hangs, save other work before restarting the affected software. After it responds, check `docker version` and `kind get clusters` from the lab shell. Setup refuses to overwrite an existing `kv-lab`. Use its original bundle and kubeconfig to inspect or clean it up before retrying.

m08 measures real NetworkPolicy enforcement. If deny traffic still succeeds, install a compatible enforcing CNI/policy controller; accepting the policy object proves nothing about isolation. Modern kind includes policy support, so do not assume all kind versions ignore policies.

m09 verifies PVC persistence with local-path storage. CSI snapshots require supporting CRDs/controller/driver. m13 creates HPA but requires Metrics Server plus a measured load to prove resource autoscaling. No load-based scale success is claimed without that prerequisite.

m16 and m20 include an actual Python polling operator for WebApp resources. Repeated reconciliation, owner references and custom resource field ownership are exercised. It is not a production controller framework.

m18 captures an etcd snapshot outside the node. m18 and m20 print a private user-specific OS temporary directory for runtime outputs; run `python3 backup-path.py m18` or `m20` from that module directory to retrieve it. Set the same `KV_LAB_BACKUP_DIR` override for capture and recovery when choosing a durable private directory. Symlink-resolved public/dist destinations are refused; OS temporary storage can be cleared, so preserve wanted backups elsewhere privately. The optional restore-offline.sh creates only a separate kv-recovery cluster, refuses an existing one, stops its API server/etcd before restoring, and checks a saved marker. Read RECOVERY.md first. Snapshots contain Secrets and must never be published. kind on one host does not prove production HA or failure-domain recovery.

m19's Argo CD extension is compatibility research, not a runnable install recipe: upstream's reviewed tested-version matrix does not include the Kubernetes 1.37 baseline. Select and runtime-verify a supported pair in a separate disposable cluster before installing it. Other optional controllers (Ingress/Gateway, meshes, telemetry and autoscalers) are not installed implicitly.

## Cleanup

Follow the Clean up steps in each exercise README before moving on. Keep any wanted data backup outside the cluster. m16/m20 share a CRD; delete it only after both are done. When all labs are finished:

```bash
# From the extracted bundle:
source ./lab-env.sh && kind delete cluster --name kv-lab
# If the optional recovery cluster still exists:
bash m18/cleanup-recovery.sh
```

The node image digest is from the official v0.33.0 release: https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0 . Application image version tags can be republished; use resolved image digests for production delivery.

All common lab runners, the standalone WebApp operator and offline recovery require a kubectl v1.37.x client. The bundle setup installs v1.37.0.

Copyright 2026 Chandu B. The project’s original lab materials are licensed under the [Apache License 2.0](LICENSE.txt).
