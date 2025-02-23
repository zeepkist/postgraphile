FROM node:22-alpine

WORKDIR /app

RUN npm install -g postgraphile@5.0.0-beta.38 \
	@graphile-contrib/pg-simplify-inflector@6.1.0 \
	postgraphile-plugin-connection-filter@3.0.0-beta.7
	# TODO: do same change as was in postgraphile-plugin-connection-filter-relations

EXPOSE 5000

CMD ["postgraphile"]
