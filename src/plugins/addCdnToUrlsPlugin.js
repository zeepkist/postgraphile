import { URL } from "node:url"

export const addCdnToUrlsPlugin = function CustomPlugin(builder) {
	const DEFAULT_CDN_URL = process.env.CDN_BASE_URL || "";
	const FIELDS = ["ghostUrl", "imageUrl"];

	// Hook into field resolution
	builder.hook("GraphQLObjectType:fields:field", (field, build, context) => {
		const { scope: { fieldName } } = context;

		if (FIELDS.includes(fieldName)) {
			console.debug(`Adding CDN URL to field: ${fieldName}`);
			const resolve = field.resolve || ((parent) => parent[fieldName]);

			return {
				...field,
				resolve: async (parent, args, context, info) => {
					const originalValue = await resolve(parent, args, context, info);
					return new URL(originalValue, DEFAULT_CDN_URL).toString();
				}
			}
		}

		return field;
	})
}
