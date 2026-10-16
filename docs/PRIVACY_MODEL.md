# Modelo de privacidad

Objetivo: evitar identificación directa del propietario original de las notas desde source y parámetros de la donación interna. No anonimato absoluto.

## Roles

Owner: deriva las claves privadas SPP por firma SEP-53 y conserva secretos en OPFS. Signer: cuenta independiente que paga y autoriza sender; no posee las notas. Beneficiario: publica claves receptoras en el registry y descubre ciphertexts mediante su clave privada.

La primera derivación/registro se realiza con signer=owner. Para donar se conserva owner y se cambia signer. El frontend exige direcciones diferentes; no puede determinar por sí solo si comparten dueño, IP, dispositivo o financiación previa. Friendbot directo evita introducir una transferencia pública donante→signer.

## Información pública

Depósito: wallet y monto. Transferencia: source/sender, fees, tiempo, pool, prueba, raíces ASP/Merkle, nullifiers, commitments, ciphertexts y ext_amount cero. El recipient externo debe ser el pool; no es el receptor privado. Registro: dirección pública y claves receptoras. Retiro: monto y destinatario público.

## Información secreta del witness

Claves de notas, montos privados, blindings, rutas Merkle y pruebas SMT de no pertenencia. No se envían al servidor de ShadowDonate. El RPC recibe transacciones y consultas, y puede observar IP/tiempos. El operador de hosting controla el JavaScript servido: compromiso de frontend u origen puede comprometer secretos del navegador.

## Comprobación

Se inspeccionan envelope, auth y result metadata; búsqueda de los bytes de wallets protegidas; source distinto; parámetros externos; pool y verificador en estado on-chain. La aceptación de Groth16 se infiere del éxito de un pool cuyo código auditado exige verificarla. El inspector web no vuelve a calcular la prueba. En el ensayo documentado se hizo además una simulación independiente del verificador con la misma prueba pública: aceptó la original y rechazó una raíz alterada; esto no equivale a una auditoría criptográfica ni a una segunda transacción.

Una búsqueda de direcciones ausentes no prueba ausencia de todas las filtraciones semánticas o correlaciones. El resultado debe acompañarse de revisión de eventos, autorizaciones y argumentos. El estado actual del contrato leído por el inspector no sustituye una instantánea histórica; conservar la evidencia contemporánea.

## Correlaciones y confianza

Montos únicos, donaciones inmediatamente posteriores al depósito, retiros inmediatos y pocos participantes permiten inferencias. Tres depósitos solo ilustran un conjunto no trivial, sin medir entropía efectiva; múltiples entradas pueden ser controladas por una misma persona. El ensayo usa cuentas administradas localmente por el mismo operador, por lo que no demuestra independencia organizativa ni resistencia Sybil.

ASP blocklist centralizada: el administrador puede modificar elegibilidad. No se selecciona pool GVK traceable. Setup Groth16 `local`: fingerprints verifican integridad, no eliminación del toxic waste ni seguridad de la ceremonia. SPP experimental/no auditado. OPFS puede borrarse; recuperación requiere firma determinista y acceso al historial. Nunca usar fondos reales.
