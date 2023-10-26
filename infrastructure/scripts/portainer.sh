docker run -d \
	--name=portainer \
	--restart=always \
	-p 9000:9000 \
	-v /var/run/docker.sock:/var/run/docker.sock \
	-v /volume1/docker/portainer:/data \
	portainer/portainer-ce:latest

docker run -d \
  --name=portainer \
  --restart=always \
  --network=infrastructure_home-network \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /volume1/docker/portainer:/data \
  -l traefik.enable=true \
  -l traefik.http.routers.portainer-http.entrypoints=web \
  -l traefik.http.routers.portainer-http.rule="Host(\`portainer.home.tobiaskaerst.dev\`)" \
  -l traefik.http.routers.portainer-http.middlewares=portainer-https \
  -l traefik.http.middlewares.portainer-https.redirectscheme.scheme=https \
  -l traefik.http.routers.portainer.entrypoints=websecure \
  -l traefik.http.routers.portainer.rule="Host(\`portainer.home.tobiaskaerst.dev\`)" \
  -l traefik.http.routers.portainer.service=portainer-s \
  -l traefik.http.routers.portainer.tls=true \
  -l traefik.http.services.portainer-s.loadbalancer.server.port=9000 \
  portainer/portainer-ce:latest