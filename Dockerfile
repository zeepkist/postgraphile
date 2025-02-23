FROM node:22-alpine

WORKDIR /app

RUN npm install -g postgraphile@beta \
	@graphile-contrib/pg-simplify-inflector \
	postgraphile-plugin-connection-filter-relations@beta

EXPOSE 5000

CMD ["postgraphile"]
