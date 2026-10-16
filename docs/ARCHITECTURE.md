# Arquitectura

React/TypeScript → fachada SPP 0.2.1 → WASM + storage worker OPFS/SQLite + prover worker → Stellar Testnet RPC → Soroban pool → verificador Groth16 BN254.

No backend de pruebas, base de datos centralizada, autenticación externa ni relayer. Freighter firma mensajes de derivación, autorizaciones y envelopes. SPP separa `userAddress` (NoteOwnerAddress) y `signerAddress` (SignerAddress). El método nativo `simulate` usa signer para sender, secuencia y source; `planner/execute` usa la dirección del pool como recipient externo en transferencias.

- SDK fijado: 0.2.1 (lock npm).
- Auditoría de fuentes: `15e43ca8ca1d46cc9ac74cd8b8dada0f620788da`.
- Deployment: `config/deployments.json`.
- Fingerprints: `config/circuits.json`, upstream circuit commit `affec1e9d0e6282ad35b6ab67019d84a1eb2725d`.
- Pool: `CA73PEBSX2GXZSMMVL46PTCXY424AIMPXKI7WWUMYJXV22AVY2DXC6DQ`.
- Verificador: `CA66PGQD3OUO5R64CMOWL3FIRAQTWORLX36ZERALPPYOJ4ORETGFO3P5`.
- Política: blocklist (flags 2), sin GVK trazable.

Inicialización: init → Storage.open → bootnodeRequired → Client.new(config + circuitLock + circuitsBaseUrl) → sync/backgroundSync → account → pool. El RPC SDF retenía el ledger del despliegue, pero su paginación falló durante la reconstrucción. El RPC alternativo `https://soroban-rpc.testnet.stellar.gateway.fm`, listado en https://developers.stellar.org/docs/data/apis/rpc/providers, completó la sincronización sin backend adicional. Solo si surge un gap, el usuario puede autorizar el bootnode oficial `https://bootnode.dev-nethermind.xyz`; introduce confianza de integridad, disponibilidad y privacidad.

`src/lib/spp.ts` controla Testnet y las firmas; `src/lib/evidence.ts` inspecciona la transacción RPC, envelope y metadata. `scripts/stage-sdk.mjs` publica assets sin transformar conservando imports relativos. No se añaden headers COOP/COEP sin necesidad comprobada en la versión distribuida. Las comprobaciones de producción siguen pendientes.

Los fixtures de prueba únicamente funcionan con SHADOW_TESTNET=1, bind 127.0.0.1, host fijo y petición same-origin. El build Vite solo incluye index.html; nunca copia tests, .private ni endpoints locales.
