import "./otel.js"

import Koa from "koa"
import bodyParser from "@koa/bodyparser"
import cors from "@koa/cors"
import logger from "koa-morgan"
import { postgraphile } from "postgraphile"
import { ruruHTML } from "ruru/server"
import { getStaticFile } from "ruru/static"

import * as PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector"
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter"
import PgOrderByRelatedPlugin from "@graphile-contrib/pg-order-by-related"
import PgManyToManyPlugin from "@graphile-contrib/pg-many-to-many"
import SubscriptionsLdsPlugin from "@graphile/subscriptions-lds"
import PgAggregatesPlugin from "@graphile/pg-aggregates"
import { TracePlugin } from "./plugins/TracePlugin.js"
import { PaginationLimitsPlugin } from "./plugins/PaginationLimitsPlugin.js"
import OrderByRelatedInflectorsPlugin from "./plugins/OrderByRelatedInflectorsPlugin.js"
import PgManyToManyInflectorsPlugin from "./plugins/ManyToManyInflectorsPlugin.js"
import PgFixForeignKeyNamesPlugin from "./plugins/FixForeignKeyNamesPlugin.js"
import { AddCdnToUrlsPlugin } from "./plugins/AddCdnToUrlsPlugin.js"
import { SkipByNodeIdFieldsPlugin } from "./plugins/SkipByNodeIdFieldsPlugin.js"
import { createQueryCostMiddleware } from "./middleware/createQueryCostMiddleware.js"

const {
	DB_USERNAME,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_DATABASE,
	PORT,
	DEBUG
} = process.env

const DATABASE_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`

const app = new Koa()
const plugins = [
	ConnectionFilterPlugin,
	PgFixForeignKeyNamesPlugin,
	PgSimplifyInflectorPlugin.default,
	PgManyToManyPlugin,
	PgManyToManyInflectorsPlugin,
	PgOrderByRelatedPlugin,
	OrderByRelatedInflectorsPlugin,
	SubscriptionsLdsPlugin.default,
	PgAggregatesPlugin.default,
	TracePlugin,
	PaginationLimitsPlugin,
	AddCdnToUrlsPlugin,
	SkipByNodeIdFieldsPlugin,
]

const ruruConfig = {
	staticPath: '/ruru-static/',
	endpoint: '/'
}

// Middleware
app.use(cors()) // Enable CORS
app.use(logger("dev")) // Request logging

// add Ruru served on GET / with Koa
app.use(async (ctx, next) => {
	if (ctx.path === "/" && ctx.method === "GET") {
		ctx.type = "text/html"
		ctx.body = ruruHTML(ruruConfig)
	} else if (ctx.path.startsWith(ruruConfig.staticPath)) {
		const staticFile = await getStaticFile({
			staticPath: ruruConfig.staticPath,
			urlPath: ctx.url,
			acceptEncoding: ctx.headers['accept-encoding'],
			disallowDevAssets: true,
		})

		if (staticFile) {
			const { etag } = staticFile.headers

			if (ctx.headers['if-none-match'] === etag) {
				ctx.status = 304 // Not Modified
				ctx.headers['etag'] = etag
				return
			} else {
				ctx.status = 200
				ctx.set(staticFile.headers)
				ctx.body = staticFile.content
				return
			}
		}
	} else {
		await next()
	}
})

app.use(bodyParser({
	enableTypes: ["json", "text"],
	extendTypes: {
		text: ["graphql", "graphqls"], // Allow text/plain for GraphQL queries
	},
}))

app.use(createQueryCostMiddleware(100_000, 100)) // Query cost middleware

// PostGraphile Middleware
app.use(postgraphile(DATABASE_URL, "public", {
	appendPlugins: plugins,
	live: true,
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
		connectionFilterUseListInflectors: false,
		orderByRelatedColumnAggregates: true,
		pgSimplifyAllRows: true,
		pgSimplifyPatch: true,
		pgOmitListSuffix: false,
		pgShortPk: true,
	},
}))

app.listen(PORT, () => {
	console.log(`🚀 PostGraphile running at http://0.0.0.0:${PORT}/graphiql`);
})

process.on("SIGTERM", () => process.exit(0))
process.on("SIGINT", () => process.exit(0))
