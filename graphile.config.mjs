import 'graphile-config'
import 'postgraphile'

import { makePgService } from "@dataplan/pg/adaptors/pg";
import { PostGraphileAmberPreset } from 'postgraphile/presets/amber'
import { makeV4Preset } from 'postgraphile/presets/v4'
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";
import { PgAggregatesPreset } from "@graphile/pg-aggregates";
import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import { PgManyToManyPreset } from '@graphile-contrib/pg-many-to-many';

const { DATABASE_URL, DATABASE_SCHEMAS } = process.env

console.debug('PostGraphileConnectionFilterPreset', PostGraphileConnectionFilterPreset)

const preset = {
	extends: [
		PostGraphileAmberPreset,
		makeV4Preset({
			graphiql: true,
			graphiqlRoute: '/graphiql',
			enhanceGraphiql: true,
		}),
		PostGraphileConnectionFilterPreset,
		PgAggregatesPreset,
		PgSimplifyInflectionPreset,
		PgManyToManyPreset
	],
	schema: {
		defaultBehavior: '-insert -update -delete query:*:filter +connection -list',
		pgForbidSetofFunctionsToReturnNull: true,
		pgOrderByNullsLast: true,
		retryOnInitFail: true,
		sortExport: true,
		noSetofFunctionsContainNulls: true,
		noIgnoreRBAC: true,
		enableQueryBatching: true,
		disableDefaultMutations: true,
		// PostGraphileConnectionFilterPreset options
		connectionFilterArrays: true,
		connectionFilterComputedColumns: true,
		connectionFilterRelations: true,
		connectionFilterSetofFunctions: true,
		connectionFilterLogicalOperators: true,
		connectionFilterAllowNullInput: false,
		connectionFilterAllowEmptyObjectInput: false,
		//
	},
	pgServices: [
		makePgService({
			connectionString: DATABASE_URL,
			schemas: DATABASE_SCHEMAS?.split(',') ?? ['public'],
			pubsub: true
		})
	],
	grafserv: {
		port: 5000,
		graphqlPath: '/',
		graphiqlPath: '/graphiql',
		eventStreamPath: '/stream',
		graphqlOverGET: false,
		websockets: true,
		watch: true,
		maxRequestLength: 100_000,
    	// dangerouslyAllowAllCORSRequests: true
	},
	grafast: {
		context(requestContext, args) {
			return {
				pgSettings: {
					...args.contextValue?.pgSettings,
					statement_timeout: "10000" // 10 seconds
				}
			}
		}
	}
};

export default preset;
