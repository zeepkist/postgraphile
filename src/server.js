import "./otel.js"

import Koa from "koa"
import cors from "@koa/cors"
import logger from "koa-morgan"
import { postgraphile } from "postgraphile"

import * as PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector"
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter"
// import SubscriptionsLdsPlugin from "@graphile/subscriptions-lds"
import { tracePlugin } from "./plugins/tracerPlugin.js"
import { paginationLimitsPlugin } from "./plugins/paginationLimitsPlugin.js"

const {
	DB_USERNAME,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_DATABASE,
	PORT,
} = process.env

const DATABASE_URL = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}`

const app = new Koa()
const plugins = [
	ConnectionFilterPlugin,
	tracePlugin,
	paginationLimitsPlugin,
]

if (!process.env.DISABLE_PG_SIMPLIFY_INFLECTOR) {
	plugins.push(PgSimplifyInflectorPlugin.default)
}

// Middleware
app.use(cors()) // Enable CORS
app.use(logger("dev")) // Request logging

// PostGraphile Middleware
app.use(postgraphile(DATABASE_URL, "public", {
	appendPlugins: plugins,
	live: false,
	retryOnInitFail: true,
	watchPg: true, // Auto-reload schema on changes
	graphiql: true,
	enhanceGraphiql: true,
	graphqlRoute: "/",
	graphiqlRoute: "/graphiql",
	disableDefaultMutations: true,
	dynamicJson: false,
	extendedErrors: ["hint", "detail", "errcode"],
	sortExport: true,
	enableQueryBatching: true,
	ignoreRBAC: true,
	setofFunctionsContainNulls: false,
	enableCors: true,
	graphileBuildOptions: {
		connectionFilterRelations: true,
		connectionFilterUseListInflectors: true
	}
}))

app.listen(PORT, () => {
	console.log(`🚀 PostGraphile running at http://0.0.0.0:${PORT}/graphiql`);
})

process.on("SIGTERM", () => process.exit(0))
process.on("SIGINT", () => process.exit(0))
