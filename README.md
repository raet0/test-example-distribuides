Antes de empezar el proyecto se pide lo siguente:
```
Evidencia inicial obligatoria:

    Captura o registro de la instalación de dependencias.
    Captura o registro de la ejecución exitosa de las pruebas iniciales.
    Captura o registro de la aplicación respondiendo localmente.
```

# Antes de comenzar con el trabajo tenemos que hacer lo siguente:

```
npm install
```
<img src="images/pasos-antes-iniciar/npm install.png" alt="">

Despues vamos a ejecutar el analisis del proyecto:

```
npm test
```

![alt text](<images/pasos-antes-iniciar/npm test.png>)

para finalizar vamos a ejecutar el comando:

```
npm start
```
Esto para revisar que la aplicación este funcionando correctamente:

![alt text](<images/pasos-antes-iniciar/npm start.png>)

# Reto#1

Para comenzar con el primer paso debemos construir la imagen con el codigo que nos dan dentro del **Dockerfile**.
```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```
Para lograr empaquetar esto debemos correr el siguente comando:
```
docker build -t app-ejemplo-evaluacion .
```
Como segundo paso del reto 1 vamos a levantar el contendor, se usa el siguente comando:
```
docker run -d -p 3000:3000 --name mi-contenedor app-ejemplo-evaluacion
```
![alt text](<images/paso 1/docker run -d -p port name container.png>)

Como vemos en la imagen ademas de correr el contenedor hacemos un docker ps para ver el contendor en marcha.

Ahora como paso 3 del reto 1 vamos a tratar de entrar a la pagina:
![alt text](<images/paso 1/localhost-3000.png>)
Como vemos la pagina no carga.¿Porque?
El problema de esto se encuentra en el archivo **server.js**, demos modificar el codigo de **127.0.0.1** por **0.0.0.0**.
![alt text](<images/paso 1/razon pagina no carga.png>)

Debmos corregir esto con **0.0.0.0**, una vez hecho esto debemos hacer lo siguente:
```
docker rm -f mi-contenedor
docker build -t app-ejemplo-evaluacion
docker run -d -p 3000:3000 --name mi-contenedor-arreglado app-ejemplo-evaluacion
```
# Reto 2:
Nuestro archivo **k8s-manifest.yaml**, etiquetas están rotas (el Deployment busca manejar pods con la etiqueta app: webapp, pero la plantilla de los pods dice app: web).

Solo debemos modifcar el **webapp** por **app: web** para que la linea 9 coincida con la 13.

Vamos a correr el siguente comando:
```
kubectl apply -f k8s-manifest.yaml
```
![alt text](<images/paso 2/kubectl apply -f yml.png>)
Una vez podamos correr esto vamos a ver los pods.

```
kubectl get pods
```
![alt text](<images/paso 2/kubectl get pods.png>)

Para ver el problema de porque de porque no se redirige la carga tenemso que revisar el siguente comando:
```
kubectl describe service web-service
```
![](<images/paso 2/kubectl describe service web-service.png>)

Ahora debemos correguir el archivo .yaml

![alt text](<images/paso 2/yaml corregido.png>)

Despues de esto debemos hacer los siguentes comandos:

```
kubectl apply -f k8s-manifest.yaml
kubectl describe service web-service
```
![alt text](<images/paso 2/kubectl describe service web-service corregido.png>)

pagina corriendo exitosamente:

![alt text](<images/paso 2/web corriend 8080 port.png>)

Para eliminar pods
```
kubectl delete pod (name pod)
```

comando para reinicar el yaml

```
kubectl delete -f name.yaml
kubectl apply -f name.yaml
```
 Si revisas el archivo .github/workflows/ci-cd.yml, verás que la estructura tiene una sección llamada jobs (trabajos), y dentro hay dos trabajos definidos: build-test
  y deploy.

  El porqué del problema: En GitHub Actions, si no indicas lo contrario, todos los jobs se ejecutan en paralelo al mismo tiempo. Esto significa que apenas subas
  código, GitHub empezará a correr las pruebas (build-test) y al mismo tiempo empezará a subir tu código a producción (deploy). ¡Si las pruebas fallan a los 5 minutos,
  ya es muy tarde porque el código roto ya se mandó a desplegar!

  Aquí tienes el paso a paso para recolectar tus evidencias. (Nota: Como GitHub Actions corre en la nube, debes estar subiendo este proyecto a un repositorio tuyo en
  GitHub y revisando la pestaña "Actions" para tomar tus capturas).


![alt text](<images/paso 3/cd-sinmodificar.png>)

Vamos a probocar un error modicando el tets.js


