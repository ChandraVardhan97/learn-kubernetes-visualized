# Approved design: Kubernetes, Visualized

The user approved a visual textbook covering practical Kubernetes operation and deep internals, all three levels in the first complete release, browser simulations plus local labs, editorial diagrams and optional dark theme, and core Kubernetes plus selected ecosystem tools.

The source of binding requirements is ../plans/2026-10-27-kubernetes-visualized.md. The user approved this design in the planning conversation and explicitly requested implementation.

Approaches considered: visual textbook (selected for structured depth plus interactive explanation); cluster playground (strong exploration, weaker systematic coverage); documentation portal (easy authoring, less distinctive teaching). The shared cluster visual language explains cause and effect. Static output preserves free hosting, performance and contribution simplicity.

No arbitrary-YAML emulator; simulations model bounded documented mechanisms. Namespace boundaries are not claimed to be hard isolation; Secret base64 is not encryption; replacement Pods are new objects; readiness is not liveness; implementations and local approximations are explicitly identified.
