import { makeAddInflectorsPlugin } from "graphile-utils"

const pascalCase = (str) => str[0].toUpperCase() + str.slice(1)

export default makeAddInflectorsPlugin({
	manyToManyRelationByKeys(
		_leftKeyAttributes,
		_junctionLeftKeyAttributes,
		_junctionRightKeyAttributes,
		_rightKeyAttributes,
		junctionTable,
		rightTable,
		_junctionLeftConstraint,
		junctionRightConstraint
	) {
		if (junctionRightConstraint.tags.manyToManyFieldName) {
			return junctionRightConstraint.tags.manyToManyFieldName;
		}

		const baseName = this.camelCase(
			`${this.pluralize(this._singularizedTableName(rightTable))}`
		);
		const suffix = pascalCase(this.camelCase(this._singularizedTableName(junctionTable)))

		return `${baseName}By${suffix}`;
	},
	manyToManyRelationByKeysSimple(
		_leftKeyAttributes,
		_junctionLeftKeyAttributes,
		_junctionRightKeyAttributes,
		_rightKeyAttributes,
		junctionTable,
		rightTable,
		_junctionLeftConstraint,
		junctionRightConstraint
	) {
		if (junctionRightConstraint.tags.manyToManySimpleFieldName) {
			return junctionRightConstraint.tags.manyToManySimpleFieldName;
		}

		const baseName = this.camelCase(
			`${this.pluralize(this._singularizedTableName(rightTable))}-list`
		);
		const suffix = pascalCase(this.camelCase(this._singularizedTableName(junctionTable)))

		return `${baseName}By${suffix}`;
	},
}, true) // Passing true here allows the plugin to overwrite existing inflectors.
