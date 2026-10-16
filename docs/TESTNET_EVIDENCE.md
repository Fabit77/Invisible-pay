# Evidencia Stellar Testnet

Estado: **PENDIENTE — NO HAY HASH DE DONACIÓN CONFIRMADO**.

Fecha de auditoría: 16 de octubre de 2026, America/Santiago.
Red: Testnet; passphrase `Test SDF Network ; September 2015`.
Pool: `CA73PEBSX2GXZSMMVL46PTCXY424AIMPXKI7WWUMYJXV22AVY2DXC6DQ`.
Verificador: `CA66PGQD3OUO5R64CMOWL3FIRAQTWORLX36ZERALPPYOJ4ORETGFO3P5`.
Circuito: `policy_tx_2_2_B`, Groth16 BN254, SPP 0.2.1.

## Comprobado

`docs/audit/chain-state.json` conserva la lectura RPC del ledger 5232676: pool existente, depósitos no pausados, token XLM, flags 2, relación con verificador B, hash de código del pool y ASP no membership con root 0. Los fingerprints de graph/proving key coinciden en build.

## Aún no comprobado

Hash/explorer/source: pendientes. Prueba generada y aceptada por Soroban: pendiente. Tres depósitos confirmados: pendientes. ext_amount=0 y ausencia de wallet donante/receptora en envelope/auth/eventos/metadata: pendientes. Recepción privada, retiro, Freighter y funcionamiento desplegado: pendientes.

El ensayo local cargó WASM y OPFS. Después de una interrupción, se reinició el servidor. La revisión automática requiere que el usuario pulse manualmente el botón del ensayo; no se ejecutó esa acción mediante otra vía.

Se crearon siete cuentas desechables financiadas por Friendbot por separado. Claves y dirección de la donante únicamente en `.private/wallets.json` (no versionado). Los reportes de prueba se guardan en `.private/testnet-result.json`; publicar solo la evidencia sanitizada, sin vincular donante con hash.

No interpretar ausencia de un hash como evidencia de anonimato. Incluso con éxito, tres cuentas administradas por un operador solo demuestran un conjunto educativo, no anonimato fuerte ni participantes independientes.
