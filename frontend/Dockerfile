FROM nginx:1-alpine
LABEL org.opencontainers.image.source="https://github.com/nrgnft/nfinnite"
LABEL org.opencontainers.image.description="Static export of theboernedirtplace frontend"
LABEL org.opencontainers.image.licenses="UNLICENSED"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/