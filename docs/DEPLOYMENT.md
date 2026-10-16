# Despliegue Vercel

Destino autorizado: GitHub `Fabit77/Invisible-pay`, Vercel team `fabits-projects`, proyecto `shadowdonate` (id `prj_IY8CTfaAGyEjmSF3jl0xNLSLHI8d`). Proyecto creado, Node 24.x, framework Vite, build `npm run build`, output `dist`. No hay URL de producción comprobada todavía.

## Variables públicas

Usa `.env.example`: RPC Testnet, bootnode oficial y tres direcciones beneficiarias registradas. Sin claves privadas, semillas, notas ni witness en VITE_, Git o Vercel. Mantener fondos y secretos de cuentas de ensayo solo en `.private` local.

## Assets

`npm ci` instala SDK 0.2.1. El build valida hashes y copia JS, WASM, workers, licencias y los binarios `policy_tx_2_2_B`. El hosting debe servir `.wasm` con application/wasm y los `.bin` sin transformaciones, con rutas relativas intactas. Se distribuye el source bundle y avisos LGPL upstream junto a los circuitos. Verificar SHA-256 también tras despliegue.

`vercel.json` contiene fallback SPA excluyendo assets y SDK. No cachear como immutable rutas SDK sin versionar. No añadir COOP/COEP/CSP sin comprobar compatibilidad con Freighter/RPC; la versión revisada no usa SharedArrayBuffer en sus loaders JavaScript. La ejecución real de OPFS/workers sigue bajo prueba y puede revelar requisitos adicionales.

Los endpoints `/__testnet` existen solo en un plugin de desarrollo cuando SHADOW_TESTNET=1; no configurar esa variable en producción. El build solo usa index.html y no publica tests/. El servidor local escucha únicamente 127.0.0.1.

## Validación pendiente en producción

Freighter Testnet, firma SEP-53, OPFS, WASM, workers, hashes de circuitos, sincronización, saldos, depósito, prueba, firmante independiente, transferencia, inspección RPC y recepción/retirada. Una landing servida no cumple estos requisitos. Revisar protección de deployment y dominio antes de compartir la URL pública.
