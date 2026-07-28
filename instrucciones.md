# Resolución Tarea Practica

Esta guía explica paso a paso, al grano y sin dar vueltas, cómo resolver cada uno de los retos de la evaluación.

---

## Punto de Partida: Evidencia Inicial
Antes de tocar Docker o Kubernetes, debes demostrar que el proyecto funciona en tu máquina local.

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```
   * **Evidencia:** Captura mostrando la descarga exitosa de los paquetes.

2. **Ejecución de pruebas iniciales:**
   ```bash
   npm test
   ```
   * **Evidencia:** Captura mostrando el mensaje de éxito de las pruebas (ej. `Tests passed!`).

3. **Aplicación respondiendo localmente:**
   - Inicia el servidor:
     ```bash
     npm start
     ```
   - Abre un navegador y visita `http://127.0.0.1:3000`.
   * **Evidencia:** Captura de pantalla que muestre simultáneamente el navegador con la respuesta y la terminal con el servidor encendido.

---

## Reto 1 - Docker: Contenedor activo, aplicación inaccesible
**El Problema:** La aplicación Node.js está configurada para escuchar tráfico exclusivamente en `127.0.0.1` (localhost interno). Docker redirige el tráfico hacia el contenedor usando una interfaz de red distinta, por lo que la aplicación rechaza las conexiones externas.

1. **Construcción de la imagen inicial:**
   ```bash
   docker build -t app-ejemplo-evaluacion .
   ```
   * **Evidencia:** Captura del comando ejecutándose.

2. **Ejecución del contenedor:**
   ```bash
   docker run -d -p 3000:3000 --name mi-contenedor app-ejemplo-evaluacion
   docker ps
   ```
   * **Evidencia:** Captura de `docker ps` mostrando el contenedor encendido y el puerto mapeado.

3. **Intento fallido de acceso inicial:**
   - Intenta entrar a `http://localhost:3000` en tu navegador.
   * **Evidencia:** Captura del navegador mostrando un error de conexión ("No se puede acceder a este sitio").

4. **Identificar el problema:**
   - Abre el archivo `server.js` y ubica la línea: `app.listen(port, '127.0.0.1', ...)`
   * **Evidencia:** Captura de esa línea específica en el código para demostrar la causa raíz.

5. **Archivo corregido:**
   - Cambia `127.0.0.1` por `0.0.0.0` para que escuche en todas las interfaces de red:
     ```javascript
     app.listen(port, '0.0.0.0', () => {
     ```
   * **Evidencia:** Captura del código ya corregido en el editor.

6. **Aplicación respondiendo desde la máquina anfitriona:**
   - Elimina el contenedor roto, reconstruye e inicia de nuevo:
     ```bash
     docker rm -f mi-contenedor
     docker build -t app-ejemplo-evaluacion .
     docker run -d -p 3000:3000 --name mi-contenedor-arreglado app-ejemplo-evaluacion
     ```
   - Visita `http://localhost:3000` en el navegador.
   * **Evidencia:** Captura del navegador funcionando correctamente.

---

## Reto 2 - Kubernetes: Pods listos, Service sin tráfico
**El Problema:** Un Service solo enruta tráfico si la etiqueta que busca (`selector`) coincide exactamente con la etiqueta que tienen los Pods. Además, los puertos configurados (8888, 8080, 3000) no coinciden entre sí.

1. **Aplicación del manifiesto inicial:**
   - Asegúrate de que el selector del Deployment coincida con su template para que te deje aplicarlo.
   ```bash
   kubectl apply -f k8s-manifest.yaml
   ```
   * **Evidencia:** Captura de los recursos creándose.

2. **Pods en estado Running:**
   ```bash
   kubectl get pods
   ```
   *(Si te da ImagePullBackOff, añade `imagePullPolicy: Never` debajo del nombre de tu imagen y vuelve a aplicar).*
   * **Evidencia:** Captura de los pods en `Running`.

3. **Service sin destinos válidos (sin endpoints):**
   ```bash
   kubectl describe service web-service
   ```
   * **Evidencia:** Captura mostrando que la sección `Endpoints:` está vacía (`<none>`).

4. **Manifiesto corregido:**
   - Borra el contenido de tu YAML actual y asegúrate de unificar etiquetas a `app: webapp` y alinear todos los puertos a `3000`:
     ```yaml
     apiVersion: apps/v1
     kind: Deployment
     metadata:
       name: web-deployment
     spec:
       replicas: 2
       selector:
         matchLabels:
           app: webapp
       template:
         metadata:
           labels:
             app: webapp
         spec:
           containers:
           - name: web
             image: app-ejemplo-evaluacion:latest
             imagePullPolicy: Never
             ports:
             - containerPort: 3000
     ---
     apiVersion: v1
     kind: Service
     metadata:
       name: web-service
     spec:
       selector:
         app: webapp
       ports:
       - port: 80
         targetPort: 3000
     ```
   - Borra el deployment roto antes de aplicar el nuevo: `kubectl delete deployment web-deployment`.
   * **Evidencia:** Captura de pantalla de tu YAML corregido.

5. **Service con endpoints poblados:**
   ```bash
   kubectl apply -f k8s-manifest.yaml
   kubectl describe service web-service
   ```
   * **Evidencia:** Captura de pantalla mostrando que ahora `Endpoints:` sí tiene direcciones IPs.

6. **Petición exitosa al Service:**
   - Inicia un túnel local:
     ```bash
     kubectl port-forward svc/web-service 8080:80
     ```
   - Abre `http://localhost:8080` en tu navegador.
   * **Evidencia:** Captura del navegador recibiendo respuesta de la aplicación a través de K8s.

---

## Reto 3 - CI/CD: Despliegue ejecutado aunque las pruebas fallen
**El Problema:** Por defecto, GitHub Actions ejecuta los "jobs" al mismo tiempo (en paralelo). No hay ninguna dependencia declarada, por lo que el despliegue no espera el resultado de las pruebas.

*(Nota: Para este reto debes tener el código en un repositorio de GitHub y revisar la pestaña "Actions").*

1. **Captura del pipeline inicial:**
   * **Evidencia:** Toma captura del código original del archivo `.github/workflows/ci-cd.yml` donde se vea que no están vinculados.

2. **Prueba fallida provocada intencionalmente:**
   - Ve a `test.js` y rompe la prueba: `assert.strictEqual(1 + 1, 3, 'Math works');`
   * **Evidencia:** Captura de ese cambio en el código.

3. **Comportamiento defectuoso del pipeline inicial:**
   - Haz commit, súbelo a GitHub y mira el progreso en Actions.
   * **Evidencia:** Captura visual de GitHub Actions demostrando que el trabajo `build-test` falló (en rojo) y sin embargo `deploy` se intentó ejecutar (o corrieron al mismo tiempo).

4. **Archivo de workflow corregido:**
   - En tu `.github/workflows/ci-cd.yml`, añádele la instrucción `needs:` al trabajo de despliegue:
     ```yaml
       deploy:
         needs: build-test
         runs-on: ubuntu-latest
     ```
   * **Evidencia:** Captura de código del YAML con esta adición vital.

5. **Despliegue no ejecutado por pruebas fallidas:**
   - Sube este arreglo (dejando la prueba rota a propósito en test.js).
   * **Evidencia:** Captura de GitHub Actions donde el trabajo `build-test` falla, y a su lado el trabajo `deploy` aparece con el estado "Skipped" (omitido/cancelado).

6. **Ejecución final exitosa:**
   - Arregla la prueba en `test.js` dejándola bien: `1+1, 2`. Haz commit y súbelo.
   * **Evidencia:** Captura de GitHub Actions donde ambos procesos finalizaron con éxito en verde.

---

## Reto 4 - Operación: Escalamiento y despliegue sin interrupción
**El Problema:** Debemos prepararnos para recibir un incremento masivo de tráfico (triplicar capacidad) y configurar Kubernetes para que las futuras actualizaciones de código no tiren la página de los usuarios actuales.

1. **Estado inicial del Deployment:**
   ```bash
   kubectl get deployment web-deployment
   ```
   * **Evidencia:** Captura de consola que demuestre que actualmente tienes `2/2` pods configurados.

2. **Cambio para soportar mayor tráfico (Escalamiento):**
   - En tu archivo `k8s-manifest.yaml`, cambia `replicas: 2` por `replicas: 6`.
   * **Evidencia:** Captura resaltando esa línea específica del código.

3. **Estrategia de despliegue utilizada:**
   - En el mismo `k8s-manifest.yaml`, dentro de la sección `spec` del Deployment, agrega la estrategia `RollingUpdate`:
     ```yaml
       strategy:
         type: RollingUpdate
         rollingUpdate:
           maxUnavailable: 0
           maxSurge: 2
     ```
   * **Evidencia:** Captura resaltando este bloque en tu código. Luego aplica el cambio con `kubectl apply -f k8s-manifest.yaml`.

4. **Tráfico de prueba durante el despliegue:**
   - Terminal 1: Abre el puerto para poder entrar: `kubectl port-forward svc/web-service 8080:80`
   - Terminal 2 (PowerShell): Envía peticiones infinitas cada medio segundo:
     ```powershell
     while($true) { try { Invoke-RestMethod http://localhost:8080 -UseBasicParsing } catch { "Error" }; Start-Sleep -Milliseconds 500 }
     ```
   * **Evidencia:** Captura de tu Terminal 2 ejecutándose sin parar respondiendo exitosamente.

5. **Aplicación sin interrupción al actualizar (Zero Downtime):**
   - Modifica el archivo `server.js` para que responda algo distinto (ej: "ESTA ES LA V2").
   - Construye una nueva imagen: `docker build -t app-ejemplo-evaluacion:v2 .`
   - Modifica tu YAML para que la imagen que exija usar ahora termine en `:v2`.
   - Terminal 3: Aplica los cambios usando `kubectl apply -f k8s-manifest.yaml`.
   * **Evidencia Suprema:** En la Terminal 2, observarás cómo imprime el mensaje antiguo, y de forma fluida, comenzará a intercalarse e imprimir el mensaje nuevo ("V2") a medida que Kubernetes cambia los pods por debajo, **sin mostrar ningún error de desconexión**. *(Si usaste `port-forward` y se cae el túnel, simplemente reinícialo, la aplicación sigue viva).* Toma una captura rápida en el punto donde se vean ambos textos en la misma consola.

---
### Pasos Finales
Sube todos estos archivos reparados a tu repositorio de Git. Consolida todas las capturas (Evidencias) en un documento PDF dentro de la carpeta `evidencias/` separando por Reto y ¡entrega la prueba!
