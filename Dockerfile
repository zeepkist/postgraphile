FROM graphile/postgraphile:beta

RUN yarn global add \
	postgraphile-plugin-connection-filter-relations@beta \
	@graphile-contrib/pg-simplify-inflector
