export const SkipByNodeIdFieldsPlugin = (builder) => {
	builder.hook('GraphQLObjectType:fields', (fields, build, context) => {
		const { scope: { isRootQuery }, fieldWithHooks } = context;
		if (isRootQuery) {
		// Remove all root query fields ending with 'ByNodeId'
		for (const fieldName of Object.keys(fields)) {
			if (fieldName.endsWith('ByNodeId')) {
			delete fields[fieldName];
			}
		}
		}
		return fields;
	});
};
