# Practicando Tarea Practica

> **Objetivo:** usar este archivo durante el examen como una guía paso a paso, aunque el profesor entregue una aplicación distinta.  
> Los nombres de archivos, la imagen, el puerto y los endpoints pueden cambiar. Primero identifícalos y luego adapta los comandos.

---

# 0. Antes de comenzar

## 0.1. Abrir la aplicación

Abre en Visual Studio Code la carpeta que contiene el archivo principal del proyecto.

En una aplicación Node.js normalmente verás:

```text
package.json
package-lock.json
server.js
server.test.js
```

También puede existir:

```text
app.js
index.js
src/
tests/
Dockerfile
k8s/
.github/
```

Abre una terminal de PowerShell dentro de esa carpeta:

```powershell
Get-Location
dir
```

## 0.2. Verificar herramientas

```powershell
node --version
npm --version
docker version
kubectl version --client
kubectl config current-context
kubectl get nodes
git --version
```

Si usas `kind`:

```powershell
kind version
kind get clusters
```

## 0.3. Instalar y probar la aplicación localmente

Para Node.js:

```powershell
npm ci
npm test
npm start
```

Si no existe `package-lock.json`, usa:

```powershell
npm install
```

Mientras `npm start` está ejecutándose, abre otra terminal y prueba el endpoint.

Ejemplos:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/version
```

También abre la aplicación en el navegador:

```text
http://localhost:3000
```

> El puerto `3000` es solo un ejemplo. Usa el puerto real de la aplicación.

## 0.4. Identificar el puerto real

Revisa `package.json`:

```powershell
Get-Content .\package.json
```

Busca el archivo principal:

```powershell
Get-Content .\server.js
```

Búsqueda rápida en Node.js:

```powershell
Select-String -Path .\*.js -Pattern "listen|PORT"
```

Normalmente encontrarás algo parecido a:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0");
```

Anota:

```text
Puerto real de la aplicación: __________
Endpoint de salud:             __________
Archivo principal:             __________
Nombre del contenedor:         __________
Nombre de la imagen:           __________
```

## 0.5. Crear el repositorio Git

Si todavía no existe:

```powershell
git init
git branch -M main
git add .
git commit -m "chore: aplicación base funcionando localmente"
```

Revisar:

```powershell
git status
git log --oneline
```

---

# RETO 1 — El contenedor corre, pero no responde

## 1.1. Qué debes diagnosticar

El contenedor aparece activo:

```powershell
docker ps
```

Pero la aplicación no responde desde tu computadora.

Las causas más probables son:

1. El proceso escucha en un puerto diferente.
2. El `docker run -p` publica el puerto equivocado.
3. El Dockerfile tiene un `EXPOSE` diferente al puerto real.
4. La aplicación escucha en `127.0.0.1` en vez de `0.0.0.0`.
5. El proceso arrancó, pero muestra un error en los logs.

## 1.2. Revisar el Dockerfile recibido

```powershell
Get-Content .\Dockerfile
```

Ejemplo:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Comprueba estas partes:

```text
FROM       Imagen base
WORKDIR    Directorio interno
COPY       Archivos copiados
RUN        Instalación
EXPOSE     Puerto documentado dentro del contenedor
CMD        Comando que inicia la aplicación
```

> `EXPOSE` no publica el puerto hacia tu computadora. La publicación real se hace con `docker run -p`.

## 1.3. Construir la imagen

Sustituye el nombre cuando sea necesario:

```powershell
docker build -t app-examen:defecto .
```

Revisar:

```powershell
docker images app-examen
```

## 1.4. Ejecutar el contenedor

Ejemplo suponiendo que crees que la aplicación usa el puerto `3000`:

```powershell
docker run -d --name app-defecto -p 3000:3000 app-examen:defecto
```

Formato:

```text
-p PUERTO_PC:PUERTO_CONTENEDOR
```

Comprobar que está activo:

```powershell
docker ps
```

Intentar acceder:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Si falla, no adivines. Diagnostica.

## 1.5. Revisar los logs

```powershell
docker logs app-defecto
```

Seguir logs en vivo:

```powershell
docker logs -f app-defecto
```

Busca algo parecido a:

```text
Servidor escuchando en puerto 8080
```

Si publicaste `3000:3000`, pero el proceso escucha en `8080`, ya encontraste el problema.

## 1.6. Entrar al contenedor

```powershell
docker exec -it app-defecto sh
```

Dentro del contenedor:

```sh
pwd
ls -la
printenv
echo $PORT
```

Probar internamente:

```sh
wget -qO- http://localhost:8080/health
```

Si la imagen tiene `curl`:

```sh
curl http://localhost:8080/health
```

Salir:

```sh
exit
```

## 1.7. Corrección del puerto

### Caso A: la aplicación escucha en 3000

Dockerfile:

```dockerfile
ENV PORT=3000
EXPOSE 3000
```

Ejecución:

```powershell
docker run -d --name app-corregida -p 3000:3000 app-examen:corregida
```

### Caso B: la aplicación escucha en 8080

Dockerfile:

```dockerfile
ENV PORT=8080
EXPOSE 8080
```

Ejecución:

```powershell
docker run -d --name app-corregida -p 8080:8080 app-examen:corregida
```

### Caso C: deseas acceder por 8080, pero internamente usa 3000

Dockerfile:

```dockerfile
EXPOSE 3000
```

Ejecución:

```powershell
docker run -d --name app-corregida -p 8080:3000 app-examen:corregida
```

Acceso:

```powershell
Invoke-RestMethod http://localhost:8080/health
```

## 1.8. Verificar que la aplicación escuche en todas las interfaces

Dentro de un contenedor, esto puede fallar:

```javascript
app.listen(PORT, "127.0.0.1");
```

Debe escuchar en:

```javascript
app.listen(PORT, "0.0.0.0");
```

O simplemente:

```javascript
app.listen(PORT);
```

## 1.9. Reconstruir después de corregir

Detener y borrar el contenedor anterior:

```powershell
docker stop app-defecto
docker rm app-defecto
```

Construir la versión corregida:

```powershell
docker build -t app-examen:corregida .
```

Ejecutar:

```powershell
docker run -d --name app-corregida -p 3000:3000 app-examen:corregida
```

Verificar:

```powershell
docker ps
docker logs app-corregida
Invoke-RestMethod http://localhost:3000/health
```

Abrir en el navegador:

```text
http://localhost:3000
```

## 1.10. Commit del Reto 1

```powershell
git add Dockerfile
git commit -m "fix: corregir puerto de la aplicación en Docker"
```

## 1.11. Evidencia necesaria

Captura donde se vea:

```text
docker ps
docker logs app-defecto
Error al acceder desde fuera
Puerto real encontrado
```

Después otra captura con:

```text
docker logs app-corregida
Invoke-RestMethod .../health
status: ok
```

---

# RETO 2 — Pods Running, pero el Service no responde

## 2.1. Concepto clave

El Service selecciona pods mediante etiquetas.

Estas tres partes deben ser coherentes:

```yaml
Deployment selector.matchLabels
Pod template.metadata.labels
Service spec.selector
```

Ejemplo correcto:

```yaml
selector:
  matchLabels:
    app: web
```

```yaml
template:
  metadata:
    labels:
      app: web
```

```yaml
service:
  selector:
    app: web
```

## 2.2. Revisar el manifiesto recibido

Encuentra archivos YAML:

```powershell
Get-ChildItem -Recurse -Include *.yaml,*.yml
```

Abrir el manifiesto:

```powershell
Get-Content .\k8s\deployment-service.yaml
```

Busca:

```powershell
Select-String -Path .\k8s\*.yaml -Pattern "selector|labels|containerPort|targetPort|image"
```

## 2.3. Defecto típico

Pods:

```yaml
template:
  metadata:
    labels:
      app: web
```

Service incorrecto:

```yaml
selector:
  app: webapp
```

Resultado:

```text
Pods Running
Service creado
Endpoints vacíos
```

## 2.4. Atención al selector del Deployment

Este fragmento también sería incorrecto:

```yaml
selector:
  matchLabels:
    app: webapp
template:
  metadata:
    labels:
      app: web
```

Kubernetes puede rechazar el Deployment porque su selector no coincide con las etiquetas del pod.

Déjalo consistente:

```yaml
selector:
  matchLabels:
    app: web
template:
  metadata:
    labels:
      app: web
```

Para reproducir el problema del examen, el error debe quedar solamente en el selector del Service.

## 2.5. Ejemplo completo defectuoso

Adapta la imagen y el puerto:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: app-examen:v1
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          env:
            - name: PORT
              value: "3000"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 2
            periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: webapp
  ports:
    - name: http
      port: 80
      targetPort: 3000
  type: ClusterIP
```

## 2.6. Si usas kind, cargar la imagen local

Ver clústeres:

```powershell
kind get clusters
```

Cargar la imagen:

```powershell
kind load docker-image app-examen:v1 --name NOMBRE_CLUSTER
```

Ejemplo:

```powershell
kind load docker-image app-examen:v1 --name ticket-cluster
```

> En Docker Desktop Kubernetes normalmente no necesitas `kind load`.

## 2.7. Aplicar el manifiesto

```powershell
kubectl apply -f .\k8s\deployment-service.yaml
```

Revisar recursos:

```powershell
kubectl get deployments
kubectl get pods
kubectl get services
```

Esperar:

```powershell
kubectl get pods -w
```

Cuando estén `1/1 Running`, presiona `Ctrl + C`.

## 2.8. Diagnosticar etiquetas y endpoints

Mostrar etiquetas:

```powershell
kubectl get pods --show-labels
```

Filtrar:

```powershell
kubectl get pods -l app=web
```

Describir el Service:

```powershell
kubectl describe service web-service
```

Consultar endpoints:

```powershell
kubectl get endpoints web-service
```

Comando moderno:

```powershell
kubectl get endpointslice -l kubernetes.io/service-name=web-service
```

Evidencia del defecto:

```text
Pods:       Running
Pod label:  app=web
Service:    app=webapp
Endpoints:  <none>
```

## 2.9. Corregir el Service

Cambiar:

```yaml
selector:
  app: webapp
```

por:

```yaml
selector:
  app: web
```

Aplicar:

```powershell
kubectl apply -f .\k8s\deployment-service.yaml
```

Verificar:

```powershell
kubectl describe service web-service
kubectl get endpoints web-service
```

Ahora debe aparecer una o más direcciones:

```text
10.244.x.x:3000
```

## 2.10. Probar desde tu computadora

Terminal 1:

```powershell
kubectl port-forward service/web-service 8080:80
```

Terminal 2:

```powershell
Invoke-RestMethod http://localhost:8080/health
```

Opcional:

```powershell
Invoke-RestMethod http://localhost:8080/version
```

Navegador:

```text
http://localhost:8080
```

Detener el port-forward:

```text
Ctrl + C
```

## 2.11. Otros problemas posibles

### Pods en `ImagePullBackOff`

```powershell
kubectl describe pod NOMBRE_POD
```

Si usas kind:

```powershell
kind load docker-image app-examen:v1 --name NOMBRE_CLUSTER
```

Usa:

```yaml
imagePullPolicy: IfNotPresent
```

### Service tiene endpoints, pero no responde

Comprueba:

```yaml
containerPort: 3000
targetPort: 3000
```

Revisa logs:

```powershell
kubectl logs deployment/web-deployment
```

Probar dentro de un pod:

```powershell
kubectl exec -it deployment/web-deployment -- sh
```

Dentro:

```sh
wget -qO- http://localhost:3000/health
```

## 2.12. Commit del Reto 2

Defecto:

```powershell
git add k8s/deployment-service.yaml
git commit -m "test: recrear selector incorrecto del Service"
```

Corrección:

```powershell
git add k8s/deployment-service.yaml
git commit -m "fix: corregir selector del Service"
```

## 2.13. Evidencia necesaria

Captura 1:

```text
Pods Running
Service selector incorrecto
Endpoints <none>
```

Captura 2:

```text
Service selector corregido
Endpoints con direcciones
```

Captura 3:

```text
port-forward
/health responde ok
```

---

# RETO 3 — El pipeline despliega aunque las pruebas fallen

## 3.1. Archivo del pipeline

GitHub Actions busca workflows en:

```text
.github/workflows/
```

Ejemplo:

```text
.github/workflows/ci-cd.yml
```

Revisar:

```powershell
Get-Content .\.github\workflows\ci-cd.yml
```

## 3.2. Pipeline defectuoso

```yaml
name: ci-cd

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
      - run: echo "Publicando imagen app:${{ github.sha }}"
      - run: echo "Desplegando app:${{ github.sha }}"
```

Defecto:

```text
deploy no depende de build-test
```

Ambos jobs pueden comenzar de forma independiente.

## 3.3. Romper una prueba a propósito

Primero ejecuta:

```powershell
npm test
```

Luego abre el archivo de pruebas:

```text
server.test.js
```

Ejemplo de cambio temporal:

```javascript
assert.strictEqual(res.status, 200);
```

Cambiar por:

```javascript
assert.strictEqual(res.status, 500);
```

Confirmar el fallo:

```powershell
npm test
```

Debe aparecer algo parecido a:

```text
pass 4
fail 1
```

Guardar y subir:

```powershell
git add server.test.js
git commit -m "test: romper prueba para validar bloqueo del despliegue"
git push
```

## 3.4. Evidencia del defecto

En GitHub:

```text
Repositorio → Actions → ci-cd
```

Debe verse:

```text
build-test: falla
deploy: se ejecuta
```

> Aunque el workflow completo pueda aparecer rojo, el defecto importante es que `deploy` sí comenzó a pesar del fallo de las pruebas.

## 3.5. Corregir la dependencia

Agregar dentro del job `deploy`:

```yaml
deploy:
  needs: build-test
  runs-on: ubuntu-latest
```

Pipeline corregido:

```yaml
name: ci-cd

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test

  deploy:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
      - run: echo "Publicando imagen app:${{ github.sha }}"
      - run: echo "Desplegando app:${{ github.sha }}"
```

Guardar y subir mientras la prueba continúa rota:

```powershell
git add .github/workflows/ci-cd.yml
git commit -m "fix: bloquear despliegue cuando fallen las pruebas"
git push
```

## 3.6. Evidencia de la corrección

En GitHub Actions debe verse:

```text
build-test: falla
deploy: skipped
```

Es decir, `deploy` no se ejecuta.

## 3.7. Restaurar la prueba

Devuelve la aserción correcta:

```javascript
assert.strictEqual(res.status, 200);
```

Comprobar localmente:

```powershell
npm test
```

Debe aparecer:

```text
fail 0
```

Guardar y subir:

```powershell
git add server.test.js
git commit -m "test: restaurar prueba correcta"
git push
```

Ahora GitHub Actions debe mostrar:

```text
build-test: success
deploy: success
```

## 3.8. Si el despliegue real requiere credenciales

El ejemplo con `echo` sirve para demostrar la dependencia entre jobs.

Si el profesor proporciona:

- Registro Docker
- Usuario y contraseña
- `kubeconfig`
- Secrets de GitHub

entonces utiliza los pasos reales que él indique.

No inventes credenciales durante el examen.

## 3.9. Commit del Reto 3

```powershell
git add .github/workflows/ci-cd.yml
git commit -m "fix: bloquear despliegue cuando fallen las pruebas"
```

## 3.10. Evidencia necesaria

Captura 1:

```text
build-test falló
deploy se ejecutó
```

Captura 2:

```text
build-test falló
deploy quedó skipped
```

Captura 3:

```text
build-test exitoso
deploy exitoso
```

---

# RETO 4 — Giro final: más tráfico y despliegue sin interrupción

## 4.1. Solución rápida recomendada

Para ahorrar tiempo:

1. Cambiar réplicas de `2` a `3`.
2. Usar estrategia `RollingUpdate`.
3. Configurar `maxUnavailable: 0`.
4. Mantener una `readinessProbe`.
5. Crear una imagen `v2`.
6. Actualizar el Deployment mientras generas tráfico.

## 4.2. Deployment recomendado

Adapta el puerto, la imagen y el endpoint:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 3

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1

  minReadySeconds: 5
  progressDeadlineSeconds: 120

  selector:
    matchLabels:
      app: web

  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: app-examen:v1
          imagePullPolicy: IfNotPresent

          ports:
            - containerPort: 3000

          env:
            - name: PORT
              value: "3000"

          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 2
            periodSeconds: 3
            timeoutSeconds: 2
            failureThreshold: 3

          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
```

## 4.3. Qué hace RollingUpdate

```text
replicas: 3
```

Mantiene tres instancias de la aplicación.

```text
maxUnavailable: 0
```

No permite que una réplica disponible se pierda durante el despliegue.

```text
maxSurge: 1
```

Kubernetes puede crear un pod adicional temporalmente.

Durante el despliegue puede haber:

```text
3 pods antiguos disponibles
1 pod nuevo iniciándose
```

Cuando el nuevo pod esté listo, Kubernetes elimina uno antiguo y continúa.

## 4.4. Aplicar el escalamiento

Modifica el YAML y ejecuta:

```powershell
kubectl apply -f .\k8s\deployment-service.yaml
```

Comprobar:

```powershell
kubectl get deployment web-deployment
kubectl get pods -l app=web
```

También puedes escalar rápidamente:

```powershell
kubectl scale deployment/web-deployment --replicas=3
```

Pero recuerda guardar después el valor `replicas: 3` en el YAML para que quede como evidencia.

## 4.5. Crear una versión nueva

Ejemplo usando etiqueta `v2`:

```powershell
docker build -t app-examen:v2 .
```

Si usas variables de entorno, puedes mantener el código igual y cambiar la versión en el Deployment:

```yaml
env:
  - name: APP_VERSION
    value: "v2"
```

Si usas kind:

```powershell
kind load docker-image app-examen:v2 --name NOMBRE_CLUSTER
```

## 4.6. Iniciar acceso al Service

Terminal 1:

```powershell
kubectl port-forward service/web-service 8080:80
```

No cierres esa terminal.

## 4.7. Generar tráfico continuo

Terminal 2:

```powershell
while ($true) {
    try {
        $respuesta = Invoke-WebRequest `
            -UseBasicParsing `
            -Uri http://localhost:8080/health `
            -TimeoutSec 2

        Write-Host "$(Get-Date -Format HH:mm:ss.fff) OK $($respuesta.StatusCode)"
    }
    catch {
        Write-Host "$(Get-Date -Format HH:mm:ss.fff) ERROR $($_.Exception.Message)"
    }

    Start-Sleep -Milliseconds 500
}
```

Detener con:

```text
Ctrl + C
```

Durante el despliegue debes intentar no obtener errores.

## 4.8. Actualizar la imagen

Terminal 3:

```powershell
kubectl set image deployment/web-deployment web=app-examen:v2
```

Si el nombre del contenedor no es `web`, identifícalo:

```powershell
kubectl get deployment web-deployment -o jsonpath="{.spec.template.spec.containers[*].name}"
```

Después utiliza ese nombre:

```powershell
kubectl set image deployment/web-deployment NOMBRE_CONTENEDOR=app-examen:v2
```

## 4.9. Observar el despliegue

```powershell
kubectl rollout status deployment/web-deployment
```

En otra terminal:

```powershell
kubectl get pods -w
```

También:

```powershell
kubectl get deployment web-deployment
kubectl rollout history deployment/web-deployment
```

Debe terminar con:

```text
deployment "web-deployment" successfully rolled out
```

## 4.10. Verificar versión

Si existe `/version`:

```powershell
Invoke-RestMethod http://localhost:8080/version
```

Si no existe, utiliza `/health`:

```powershell
Invoke-RestMethod http://localhost:8080/health
```

Revisar imágenes activas:

```powershell
kubectl get pods -l app=web -o jsonpath="{range .items[*]}{.metadata.name}{' -> '}{.spec.containers[*].image}{'\n'}{end}"
```

## 4.11. Si la actualización falla

Ver estado:

```powershell
kubectl rollout status deployment/web-deployment
kubectl describe deployment web-deployment
kubectl get pods
kubectl describe pod NOMBRE_POD
kubectl logs NOMBRE_POD
```

Revertir:

```powershell
kubectl rollout undo deployment/web-deployment
```

Comprobar:

```powershell
kubectl rollout status deployment/web-deployment
```

## 4.12. Alternativa rápida: HPA

Solo úsala si el profesor la pide o si tienes Metrics Server.

```powershell
kubectl autoscale deployment web-deployment --cpu-percent=60 --min=3 --max=6
```

Revisar:

```powershell
kubectl get hpa
```

Para un examen corto, `replicas: 3` más `RollingUpdate` suele ser más simple.

## 4.13. Commit del giro final

```powershell
git add k8s/deployment-service.yaml
git commit -m "feat: escalar a tres réplicas y aplicar RollingUpdate"
```

## 4.14. Evidencia necesaria

Captura 1:

```text
replicas: 3
3 pods Running
```

Captura 2:

```text
RollingUpdate
maxUnavailable: 0
maxSurge: 1
```

Captura 3:

```text
Tráfico continuo con respuestas 200
kubectl rollout status exitoso
```

Captura 4:

```text
Pods usando la imagen v2
```

---

# 5. Subir el repositorio

## 5.1. Crear el remoto

```powershell
git remote add origin URL_DEL_REPOSITORIO
```

Ejemplo:

```powershell
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
```

Subir:

```powershell
git push -u origin main
```

Después:

```powershell
git push
```

## 5.2. Revisar historial

```powershell
git log --oneline --all
```

Historial recomendado:

```text
feat: escalar a tres réplicas y aplicar RollingUpdate
test: restaurar prueba correcta
fix: bloquear despliegue cuando fallen las pruebas
test: romper prueba para validar bloqueo del despliegue
fix: corregir selector del Service
test: recrear selector incorrecto del Service
fix: corregir puerto de la aplicación en Docker
test: recrear defecto de puerto en Docker
chore: aplicación base funcionando localmente
```

---

# 6. Checklist final obligatorio

Antes de entregar, verifica cada punto.

## Aplicación local

```text
[ ] npm ci terminó correctamente
[ ] npm test terminó correctamente
[ ] npm start funciona
[ ] Identifiqué el puerto real
[ ] /health responde
```

## Docker

```text
[ ] La imagen se construye
[ ] El contenedor aparece en docker ps
[ ] Revisé docker logs
[ ] Entré con docker exec
[ ] Corregí el puerto
[ ] La aplicación responde desde fuera
```

## Kubernetes

```text
[ ] Pods en Running y Ready
[ ] Revisé las etiquetas de los pods
[ ] El Service tiene selector correcto
[ ] kubectl get endpoints muestra direcciones
[ ] El Service responde mediante port-forward
```

## CI/CD

```text
[ ] Rompí una prueba a propósito
[ ] Vi que deploy se ejecutó con el pipeline defectuoso
[ ] Agregué needs: build-test
[ ] Vi que deploy quedó skipped con la prueba rota
[ ] Restauré la prueba
[ ] Pipeline completo terminó correctamente
```

## Giro final

```text
[ ] Cambié a tres réplicas
[ ] Configuré RollingUpdate
[ ] maxUnavailable es 0
[ ] maxSurge es 1
[ ] Existe readinessProbe
[ ] Generé tráfico durante el despliegue
[ ] No hubo interrupción perceptible
[ ] El rollout terminó correctamente
```

## Git y evidencias

```text
[ ] El repositorio tiene commits del antes y después
[ ] Hice git push
[ ] Guardé evidencia del Service sin endpoints
[ ] Guardé evidencia del Service con endpoints
[ ] Guardé evidencia del pipeline bloqueando deploy
[ ] Guardé evidencia del pipeline exitoso
[ ] Guardé evidencia de tres réplicas
[ ] Guardé evidencia del RollingUpdate
```

---

# 7. Comandos de emergencia

## Docker

```powershell
docker build -t app-examen:v1 .
docker run -d --name app -p 3000:3000 app-examen:v1
docker ps
docker logs app
docker exec -it app sh
docker stop app
docker rm app
```

## Kubernetes

```powershell
kubectl apply -f .\k8s\deployment-service.yaml
kubectl get pods --show-labels
kubectl describe service web-service
kubectl get endpoints web-service
kubectl port-forward service/web-service 8080:80
kubectl logs deployment/web-deployment
kubectl rollout status deployment/web-deployment
```

## Git

```powershell
git status
git diff
git add .
git commit -m "mensaje"
git log --oneline
git push
```

## Pruebas

```powershell
npm ci
npm test
npm start
```

---

# 8. Plan recomendado para 90 minutos

```text
00–10 min  Revisar proyecto, instalar y ejecutar pruebas
10–25 min  Diagnosticar y corregir Docker
25–45 min  Diagnosticar y corregir Service de Kubernetes
45–65 min  Pipeline: prueba rota, needs y ejecución exitosa
65–80 min  Tres réplicas y RollingUpdate
80–90 min  Evidencias, commits, push y checklist
```

---

# 9. Regla principal durante el examen

No cambies cosas al azar.

Sigue siempre este orden:

```text
1. Observar el fallo
2. Ejecutar comandos de diagnóstico
3. Identificar la causa exacta
4. Guardar evidencia del defecto
5. Corregir un solo elemento
6. Aplicar de nuevo
7. Verificar el resultado
8. Guardar evidencia
9. Crear commit
```

