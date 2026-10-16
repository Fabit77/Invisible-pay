# Evidencia Stellar Testnet

Estado: **DONACIÓN PRIVADA CONFIRMADA; validación completa con Freighter en producción pendiente**.

Fecha: 16 de octubre de 2026, America/Santiago. Transacción en ledger **5232993**.
Red: Testnet; passphrase `Test SDF Network ; September 2015`.

- Hash: `53e2a6517f620081fa543c125989ec8ef1dcaf4e0d65490656221d5847f69954`.
- [Stellar Expert Testnet](https://stellar.expert/explorer/testnet/tx/53e2a6517f620081fa543c125989ec8ef1dcaf4e0d65490656221d5847f69954).
- Pool XLM estándar: `CA73PEBSX2GXZSMMVL46PTCXY424AIMPXKI7WWUMYJXV22AVY2DXC6DQ`.
- Verificador: `CA66PGQD3OUO5R64CMOWL3FIRAQTWORLX36ZERALPPYOJ4ORETGFO3P5`.
- Circuito: `policy_tx_2_2_B`, Circom/Groth16 BN254, SPP 0.2.1.
- Source público y autor del contrato: `GDLMSHLMLJWQKQ7W4YNDQYMJMOSDOYVSEQNSRKOLHXYH7YDSO4AQFJZ2`.

## Comprobaciones realizadas

1. RPC devolvió SUCCESS y ledger 5232993. Envelope invoca exclusivamente `transact` del pool seleccionado.
2. `ext_amount=0`, recipient externo es el propio pool, sender coincide con source. No es un retiro a una wallet pública.
3. Prueba Groth16 real construida en el worker del navegador usando R1CS, graph y proving key oficiales con SHA-256 coincidentes.
4. Relación on-chain con verificador B, flags blocklist=2, token XLM y hashes WASM del pool/verificador comprobados. Pool estándar sin GVK traceable.
5. El éxito del código auditado implica aceptación por el verificador. Adicionalmente, una simulación RPC sin firma invocó directamente `verify` con la misma prueba/señales públicas: devolvió true. Una segunda simulación con raíz alterada fue rechazada. Estas simulaciones no son transacciones nuevas.
6. Dos eventos de nullifier y dos de commitment coinciden con los argumentos públicos de la donación. XDR completo, autorizaciones y metadata revisados: no contienen los bytes de las direcciones protegidas. La búsqueda de bytes es una comprobación adicional; la propiedad se apoya también en el circuito y la revisión del esquema de argumentos.
7. Source es distinto de la wallet propietaria de las notas, comparados localmente. No se publica esa wallet ni los hashes de depósitos que la vincularían con esta prueba.
8. Tres wallets distintas depositaron 3 XLM cada una en el mismo pool; sus depósitos SUCCESS se consultaron por Horizon. Controladas por un solo operador: no equivalen a tres personas independientes.
9. Firmante y depositantes se financiaron con Friendbot por separado. No se encontró financiación directa donante → firmante en el historial de pagos de la firmante.
10. La beneficiaria derivó sus claves, sincronizó y descifró las notas recibidas: saldo privado **10 000 000 stroops (1 XLM)**. Es una observación local del receptor; la cadena no publica ese saldo. La recuperación del informe no reenvió la donación.

## Evidencia y reproducción

[Auditoría independiente y XDR público](audit/donation.json). [Fingerprints descargados desde producción](audit/production-assets.json). El script no firma ni publica operaciones:

```sh
node scripts/verify-donation.mjs 53e2a6517f620081fa543c125989ec8ef1dcaf4e0d65490656221d5847f69954
```

Requiere RPC con la transacción disponible; el historial Testnet tiene retención limitada y puede reiniciarse. Se conserva el XDR público para inspección posterior. Las comparaciones con el propietario solo se repiten cuando existe el archivo local privado de las cuentas originales; sin él no se inventa esa comprobación.

Documentación local privada: `.private/wallets.json`, `.private/participants-audit.json`, `.private/testnet-result.json`. Contienen la identidad donante o sus vínculos y no están en Git ni en Vercel. El reporte público no revela la identidad usada en la comparación.

## Límites y pendientes

El hash evita un vínculo directo explícito con el propietario de las notas. No acredita anonimato absoluto: correlación temporal, depósitos/retiros, importes, red/IP, registry, otros datos externos y un conjunto pequeño reducen privacidad. Los tres depósitos consecutivos de igual monto son una demostración educativa; no se calculó un conjunto de anonimato efectivo frente a un adversario con información auxiliar. Publicar el monto recibido en esta documentación es una divulgación voluntaria del ensayo, no un dato extraído del ledger.

SPP es experimental/no auditado; setup Groth16 local upstream sin ceremonia multipartita demostrada. Confianza en ASP y estado del pool. El estado actual del contrato puede cambiar; los hashes de código consultados corresponden a la auditoría próxima a la transacción, no a una prueba histórica independiente de cada actualización.

Pendientes: Freighter en producción (conexión, derivación, autorizaciones y transacción), prueba completa de donación desde Vercel y retiro de beneficiario. La transacción anterior se ejecutó desde localhost con cuentas Testnet desechables y firma local, no mediante Freighter. El documento de Notion del desafío no fue accesible; no se presume que permita o exija circuito original.
