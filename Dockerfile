FROM node:22-alpine

WORKDIR /app

RUN npm install -g postgraphile@beta \
	@graphile-contrib/pg-simplify-inflector@6.1.0 \
	postgraphile-plugin-connection-filter-relations@3.0.0-beta.7

EXPOSE 5000

CMD ["postgraphile"]
