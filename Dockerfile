FROM graphile/postgraphile:4

# Install additional plugins
RUN yarn global add \
    postgraphile-plugin-connection-filter-relations \
    @graphile-contrib/pg-simplify-inflector
