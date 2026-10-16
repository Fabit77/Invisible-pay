# Circuito ZK reutilizado

Fuente auditada: [15e43ca8ca1d46cc9ac74cd8b8dada0f620788da](https://github.com/NethermindEth/stellar-private-payments/blob/15e43ca8ca1d46cc9ac74cd8b8dada0f620788da/circuits/src/policy_tx_2_2_B.circom). El entrypoint incluye `policyTransactionBlocklist.circom`, `policyTransaction.circom`, `transaction.circom` y `aspNonMembership.circom`.

Deployment lock v0.6: circuit commit `affec1e9d0e6282ad35b6ab67019d84a1eb2725d`; toolchain Circom 2.2.3, circomlib `35e54ea21da3e8762557234298dbb553c175ea8d`, circom-witness-rs 0.3.0. Fuentes posteriores auditadas y artifacts del deployment son identificadores distintos y están documentados deliberadamente.

## Instancia

`PolicyTransactionBlocklist(2, 2, 1, 20, 32)`; Groth16 sobre BN254. Dos notas de entrada/salida, una prueba ASP por entrada, Merkle 20 y sparse Merkle 32. Setup marcado `local`; no ceremonia multipartita demostrada.

## Witness privado

`inAmount`, `inPrivateKey`, `inBlinding`, `inPathIndices`, `inPathElements`; `outAmount`, `outPubkey`, `outBlinding`; `nonMembershipProofs` (key, oldKey, oldValue, isOld0, siblings). Las notas nulas de padding siguen el flujo upstream.

## Señales públicas

`root`, `publicAmount`, `extDataHash`, `inputNullifier[2]`, `outputCommitment[2]`, `nonMembershipRoots`. Los commitments y nullifiers son inputs públicos de la instancia que también funcionan como resultados publicados de la transacción; no hay un output público separado que revele receptor o monto privado.

## Constraints

El núcleo vincula clave privada a identidad/commitment, prueba inclusión Merkle de entradas no nulas, deriva nullifiers y commitments de salida, limita montos y conserva el balance con `publicAmount`. El módulo ASP prueba no pertenencia de las identidades de entrada a la blocklist. El contrato verifica root conocida, unicidad/no gasto previo de nullifiers, canonicalidad, políticas y hash externo ligado a pool/token/recipient/ciphertexts/ext_amount.

La prevención de doble gasto depende también del estado on-chain, no solo del circuito. El hash externo lo recalcula el contrato; la prueba lo liga a sus señales públicas.

## Generación y verificación

SDK 0.2.1 construye witness y prueba en el prover worker local. Grafo witness y proving key se validan al build y por el runtime contra el lock confiable del deployment:

- graph: `d4dc29962f760ce9ed5ddbab3619e3c0502daa02d6b8a608d77df330cff6a397`
- proving key: `16721797e783b728d82276ac2a333d18a7479ded69af5241556d20e0130e4244`
- R1CS fingerprint publicado (no se distribuye ni verifica localmente en este build): `3cd79e47a124b99d3ec698dcf63938fe5bb51a05ff13b7b3d98a854336bbaa7c`

Pool `CA73PEBSX2GXZSMMVL46PTCXY424AIMPXKI7WWUMYJXV22AVY2DXC6DQ` invoca verificador `CA66PGQD3OUO5R64CMOWL3FIRAQTWORLX36ZERALPPYOJ4ORETGFO3P5`; código en `contracts/circom-groth16-verifier/src/lib.rs`. La auditoría RPC confirmó esa relación; la aceptación de una prueba de ShadowDonate sigue pendiente de transacción exitosa.

No revela directamente claves, rutas, montos privados ni receptores de notas. No oculta source, políticas, tiempos, fees, depósitos/retiros, ni protege de correlaciones externas.

ShadowDonate integra un circuito existente; no reclama autoría del circuito. Notion no accesible: si el desafío exige circuito original, hay que confirmar esa condición y preparar un circuito/verificador propio; no es compatible cambiar constraints conservando una proving key existente.
