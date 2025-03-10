import { trace } from "@opentelemetry/api"


// "resolve" hook in postgraphile5
/*
builder.hook("resolve", (resolve, build, context) => {
	const tracer = trace.getTracer("postgraphile")
	return tracer.startActiveSpan(context.fieldName, async span => {
		try {
			return await resolve()
		} finally {
			span.end()
		}
	})
})
*/

// Utility function to create the full GraphQL query (excluding variables)
function createQuery(info) {
	const pathFields = [];
	let currentPath = info.path;

	// Collect fields from path.prev to construct the parent fields
	while (currentPath && currentPath.prev) {
		pathFields.unshift(currentPath.fieldName);
		currentPath = currentPath.prev;
	}

	// Ensure fieldNodes is an array
	const fieldNodes = Array.isArray(info.fieldNodes) ? info.fieldNodes : [info.fieldNodes];

	// Build the query for the current field
	const fieldQuery = fieldNodes.map(buildFieldQuery).join(" ");

	return fieldQuery;
}

function buildFieldQuery(node) {
	const fieldName = node.name.value;

	// Check for selection set (child nodes)
	const childFields = node.selectionSet ? node.selectionSet.selections.map(buildFieldQuery).join(" ") : '';

	// Return the field query, adding child fields if they exist
	return childFields ? `${fieldName} { ${childFields} }` : fieldName;
}

export const tracePlugin = function CustomPlugin(builder) {
	builder.hook("GraphQLObjectType:fields:field", (field, build, context) => {
		const fieldName = context.scope.fieldName;
		const originalResolve = field.resolve || ((parent, args, context, info) => parent[fieldName])

		return {
			...field,
			async resolve(parent, args, context, info) {
				const tracer = trace.getTracer("postgraphile")

				return tracer.startActiveSpan(fieldName, async (span) => {
					try {
						const gqlQuery = createQuery(info).replace(/\s+/g, ' ');
						span.setAttribute("graphql.rawQuery", gqlQuery)

						// if arguments are present, add them to the span
						const argKeys = Object.keys(args)
						if (argKeys.length) {
							argKeys.forEach((key) => {
								span.setAttribute(`graphql.arguments.${key}`, args[key])
							})
							span.setAttribute("graphql.arguments", JSON.stringify(args))
						}

						return await originalResolve(parent, args, context, info)
					} catch (error) {
						span.recordException(error)
						throw error
					} finally {
						span.end()
					}
				})
			}
		}
	})
}
