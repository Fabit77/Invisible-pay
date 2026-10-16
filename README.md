# ShadowDonate

Private donations. Public verification.

Aplicación educativa React/TypeScript/Vite/Tailwind para donar mediante notas privadas en Stellar Testnet, usando Soroban y Stellar Private Payments (SPP) 0.2.1. Causas ficticias; ningún activo tiene valor real. SPP es experimental y no auditado.

## Estado verificable

Donación privada real confirmada en ledger 5232993: [`53e2a651…7f69954`](https://stellar.expert/explorer/testnet/tx/53e2a6517f620081fa543c125989ec8ef1dcaf4e0d65490656221d5847f69954). Prueba Groth16 aceptada, firmante independiente y recepción privada de 1 XLM comprobados con cuentas desechables. URL publicada: https://shadowdonate.vercel.app. Entrega aún incompleta: falta validar el flujo Freighter completo desde producción. Consulta [evidencia](docs/TESTNET_EVIDENCE.md). El documento original de Notion no pudo consultarse; se siguieron los requisitos proporcionados por el usuario, sin inferir condiciones adicionales del desafío.

## Ejecutar

Node 24 o posterior:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

El build comprueba SHA-256 del R1CS, grafo witness y proving key contra `config/circuits.json` y copia el SDK estático manteniendo sus rutas relativas. No hace falta compilar Rust ni desplegar contratos nuevos.

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Wallets y reproducción

1. Instala Freighter desde su sitio oficial y selecciona Settings → Network → Testnet.
2. Financia por separado la wallet donante, la firmante y las receptoras con [Friendbot](https://laboratory.stellar.org/account/fund). Nunca transfieras fondos de la donante a la firmante.
3. Conecta cada beneficiario en ShadowDonate y registra sus claves públicas SPP. Configura las direcciones en `.env.local` usando las variables de `.env.example`.
4. Conecta la donante, firma la derivación oficial de claves y deposita XLM. Este depósito es público.
5. Para una demo con conjunto no trivial, repite depósitos desde al menos otras dos wallets independientes. Tres wallets no prueban anonimato fuerte.
6. Conserva a la donante conectada en ShadowDonate, selecciona la firmante independiente en Freighter y escribe su dirección en el formulario.
7. Selecciona causa, monto y confirma la transferencia. La prueba se genera en el navegador, y el SDK transmite la transacción firmada a Testnet.
8. Usa el inspector RPC para comprobar hash, SUCCESS, pool, ext_amount, source, argumentos y ausencia de direcciones protegidas en XDR. Descarga el reporte público.
9. Conecta la beneficiaria, sincroniza y comprueba su incremento de saldo privado. Un retiro posterior publica monto y destinatario.

La derivación y el registro requieren primero una sesión cuyo owner y signer sean la misma wallet. Solo después se abre la sesión con signer independiente; los secretos se conservan en OPFS.

## Criptografía

Se reutiliza [policy_tx_2_2_B.circom](https://github.com/NethermindEth/stellar-private-payments/blob/15e43ca8ca1d46cc9ac74cd8b8dada0f620788da/circuits/src/policy_tx_2_2_B.circom), Groth16/BN254, dos entradas y dos salidas, árbol Merkle de 20 niveles y blocklist ASP. Los nullifiers evitan doble gasto. Nuestra contribución es la experiencia de donaciones, integración de SDK, selección de pool, controles de firma y evidencia pública; no un circuito original. [Detalle](docs/ZK_CIRCUIT.md).

## Ensayo con cuentas desechables

El usuario autorizó crear y conservar claves solo de Testnet. `scripts/create-test-wallets.mjs` las guarda en `.private/wallets.json`, directorio 0700 y archivo 0600, excluidos de Git. No uses este archivo con activos reales ni lo publiques.

```sh
node scripts/create-test-wallets.mjs
SHADOW_TESTNET=1 npm run dev
```

Abre `http://127.0.0.1:5173/tests/testnet.html` y pulsa manualmente el botón del ensayo. Usa la misma criptografía y contratos reales, con un adaptador de firma local para cuentas desechables. No constituye una prueba de la integración Freighter. El endpoint local de fixtures solo se monta en desarrollo con la variable explícita; no se distribuye en producción. Los secretos se entregan únicamente a esa página de localhost y no a servicios de terceros. El resultado queda en `.private/testnet-result.json`. Si una transferencia se confirmó pero falló una consulta posterior, usa «Verify existing donation and recipient (read only)»; no repitas la donación para recuperar el informe.

La evidencia pública puede revalidarse sin claves con `node scripts/verify-donation.mjs`. Consulta el hash de referencia desde el inspector de la web sin conectar una wallet; comparar el propietario requiere sus datos locales, que no son públicos.

## Privacidad y límites

La cadena ve source, fees, tiempos, pool, raíces, nullifiers, commitments y ciphertexts. Una transferencia interna usa `ext_amount=0`; el campo externo recipient es el pool. El destinatario de notas se resuelve localmente mediante el registro de claves. El firmante independiente no sustituye la necesidad de un conjunto de notas suficiente.

El operador RPC puede correlacionar IP y tiempos; el registro público vincula wallet y claves públicas SPP. Depósitos y retiros revelan montos. Setup Groth16 local de upstream: no demuestra destrucción del toxic waste. [Modelo completo](docs/PRIVACY_MODEL.md).

## Despliegue

Vercel: proyecto `shadowdonate` creado en el equipo del usuario; publicado en https://shadowdonate.vercel.app; pruebas funcionales de producción pendientes. [Configuración](docs/DEPLOYMENT.md).
