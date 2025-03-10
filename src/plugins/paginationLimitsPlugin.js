export const paginationLimitsPlugin = function CustomPlugin(builder) {
	// Hook into field resolution
	builder.hook("GraphQLObjectType:fields:field", (field, build, context) => {
		const originalResolve = field.resolve || ((parent, args, context, info) => parent[field.name]);

		return {
			...field,
			async resolve(parent, args, context, info) {
				const DEFAULT_LIMIT = 100;

				if (args.first > DEFAULT_LIMIT) {
					throw new Error(`Requested 'first' value of ${args.first} exceeds the limit of ${DEFAULT_LIMIT}`);
				}
				if (args.last > DEFAULT_LIMIT) {
					throw new Error(`Requested 'last' value of ${args.last} exceeds the limit of ${DEFAULT_LIMIT}`);
				}

				// Automatically limit if neither `first` nor `last` is provided
				if (args.first === undefined && args.last === undefined) {
					args.first = DEFAULT_LIMIT;
				}

				return await originalResolve(parent, args, context, info);
			}
		};
	});
};
