import "./otel.js"

import Koa from "koa"
import cors from "@koa/cors"
import logger from "koa-morgan"
import { postgraphile } from "postgraphile"
import { ruruHTML } from "ruru/server"

import * as PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector"
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter"
import PgOrderByRelatedPlugin from "@graphile-contrib/pg-order-by-related"
import PgManyToManyPlugin from "@graphile-contrib/pg-many-to-many"
import SubscriptionsLdsPlugin from "@graphile/subscriptions-lds"
import { tracePlugin } from "./plugins/tracerPlugin.js"
import { paginationLimitsPlugin } from "./plugins/paginationLimitsPlugin.js"
import OrderByRelatedInflectorsPlugin from "./plugins/orderByRelatedInflectorsPlugin.js"
import PgManyToManyInflectorsPlugin from "./plugins/manyToManyInflectorsPlugin.js"
import PgFixForeignKeyNamesPlugin from "./plugins/fixForeignKeyNamesPlugin.js"
import { addCdnToUrlsPlugin } from "./plugins/addCdnToUrlsPlugin.js"

const {
	DB_USERNAME,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_DATABASE,
	PORT,
	DISABLE_PG_SIMPLIFY_INFLECTOR,
	DEBUG
} = process.env

console.debug("Starting server with the following environment variables:")
console.debug(`DISABLE_PG_SIMPLIFY_INFLECTOR: ${DISABLE_PG_SIMPLIFY_INFLECTOR}`)

const DATABASE_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`
const IS_BETA = DISABLE_PG_SIMPLIFY_INFLECTOR === "false"

const app = new Koa()
const plugins = [
	ConnectionFilterPlugin,
	tracePlugin,
	paginationLimitsPlugin
]

if (IS_BETA) {
	console.debug("Enabling beta plugins")

	plugins.push(addCdnToUrlsPlugin)
	plugins.push(PgFixForeignKeyNamesPlugin)
	plugins.push(PgSimplifyInflectorPlugin.default)
	plugins.push(PgManyToManyPlugin)
	plugins.push(PgManyToManyInflectorsPlugin)
	plugins.push(PgOrderByRelatedPlugin)
	plugins.push(OrderByRelatedInflectorsPlugin)
	plugins.push(SubscriptionsLdsPlugin.default)
} else {
	console.debug("Disabling beta plugins")
}

// Middleware
app.use(cors()) // Enable CORS
app.use(logger("dev")) // Request logging

// PostGraphile Middleware
app.use(postgraphile(DATABASE_URL, "public", {
	appendPlugins: plugins,
	live: IS_BETA ? true : false,
	ownerConnectionString: DATABASE_URL,
	retryOnInitFail: true,
	watchPg: true, // Auto-reload schema on changes
	graphiql: false,
	enhanceGraphiql: false,
	graphqlRoute: "/",
	disableDefaultMutations: true,
	dynamicJson: false,
	extendedErrors: ["hint", "detail", "errcode"],
	sortExport: true,
	enableQueryBatching: true,
	ignoreRBAC: true,
	setofFunctionsContainNulls: false,
	simpleCollections: "omit",
	enableCors: true,
	ignoreIndexes: true, // TODO: Add missing indexes so we can disable this
	allowExplain: !!DEBUG,
	graphileBuildOptions: {
		connectionFilterRelations: true,
		connectionFilterUseListInflectors: IS_BETA ? false : true,
		orderByRelatedColumnAggregates: true,
		pgSimplifyAllRows: true,
		pgSimplifyPatch: true,
		pgOmitListSuffix: false,
		pgShortPk: true,
	}
}))

// add Ruru served on GET / with Koa
app.use(async (ctx, next) => {
	if (ctx.path === "/" && ctx.method === "GET") {
		ctx.type = "text/html"
		ctx.body = ruruHTML({
			endpoint: '/'
		})
	} else {
		await next()
	}
})

app.listen(PORT, () => {
	console.log(`🚀 PostGraphile running at http://0.0.0.0:${PORT}/graphiql`);
})

process.on("SIGTERM", () => process.exit(0))
process.on("SIGINT", () => process.exit(0))
