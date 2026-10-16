# Despliegue Vercel

Destino autorizado: GitHub `Fabit77/Invisible-pay`, Vercel team `fabits-projects`, proyecto `shadowdonate` (id `prj_IY8CTfaAGyEjmSF3jl0xNLSLHI8d`). Proyecto creado, Node 24.x, framework Vite, build `npm run build`, output `dist`. URL publicada y HTTP 200 comprobado: https://shadowdonate.vercel.app. Despliegue READY; WASM responde application/wasm. Inspector público probado: RPC SUCCESS para la donación de referencia. WASM, OPFS, workers y sincronización del pool comprobados desde Vercel. Freighter y una nueva donación desde producción siguen pendientes.

## Variables públicas

Usa `.env.example`: RPC Testnet, bootnode oficial y tres direcciones beneficiarias registradas. Sin claves privadas, semillas, notas ni witness en VITE_, Git o Vercel. Mantener fondos y secretos de cuentas de ensayo solo en `.private` local.

## Assets

`npm ci` instala SDK 0.2.1. El build valida hashes y copia JS, WASM, workers, licencias y los binarios `policy_tx_2_2_B`. El hosting debe servir `.wasm` con application/wasm y los `.bin` sin transformaciones, con rutas relativas intactas. Se distribuye el source bundle y avisos LGPL upstream junto a los circuitos. Verificar SHA-256 también tras despliegue.

`vercel.json` contiene fallback SPA excluyendo assets y SDK. No cachear como immutable rutas SDK sin versionar. No añadir COOP/COEP/CSP sin comprobar compatibilidad con Freighter/RPC; la versión revisada no usa SharedArrayBuffer en sus loaders JavaScript. La ejecución real de OPFS/workers sigue bajo prueba y puede revelar requisitos adicionales.

Los endpoints `/__testnet` existen solo en un plugin de desarrollo cuando SHADOW_TESTNET=1; no configurar esa variable en producción. El build solo usa index.html y no publica tests/. El servidor local escucha únicamente 127.0.0.1.

## Validación de producción

Comprobados: carga WASM/OPFS/workers, sincronización y consulta RPC de la donación real, con validación de código del pool y verificador. Los tres artifacts de circuitos descargados desde producción coinciden por SHA-256 (audit/production-assets.json). Pendientes: Freighter Testnet, firma SEP-53, saldos, depósito, generación de prueba, firmante independiente, transferencia y recepción/retirada desde el dominio desplegado. Una landing servida no cumple estos requisitos. Revisar protección de deployment y dominio antes de compartir la URL pública.

La API RPC del SDK 17 añade X-Client-Name/Version, no admitidos por el CORS del proveedor. `src/lib/rpc.ts` utiliza un adaptador fetch que transmite solo Content-Type al mismo destino configurado; mantiene TLS y no requiere un proxy ni cambios COOP/COEP. Tests de regresión verifican headers y errores HTTP.
