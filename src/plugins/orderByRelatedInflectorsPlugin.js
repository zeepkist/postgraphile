import { makeAddInflectorsPlugin } from "graphile-utils"

export default makeAddInflectorsPlugin({
	orderByRelatedColumnEnum(attr, ascending, foreignTable, keyAttributes) {
		const orderBy = this.orderByColumnEnum(attr, ascending)
		const table = this._singularizedTableName(foreignTable)
		const key = this.constantCase(`${table}_${orderBy}`)

		return key
	},

	orderByRelatedComputedEnum(pseudoColumnName, proc, ascending, foreignTable, keyAttributes) {
		const orderBy = this.orderByColumnEnum(pseudoColumnName, proc, ascending)
		const table = this._singularizedTableName(foreignTable)
		const key = this.constantCase(`${table}_${orderBy}`)

		return key
	},

	orderByRelatedCountEnum(ascending, foreignTable, keyAttributes) {
		const orderBy = `count-${ascending ? "asc" : "desc"}`
		const table = this._singularizedTableName(foreignTable)
		const key = this.constantCase(`${table}_${orderBy}`)

		return key
	},

	orderByRelatedColumnAggregateEnum(attr, ascending, foreignTable, keyAttributes, aggregateName) {
		const orderBy = `${aggregateName}_${this.orderByColumnEnum(attr, ascending)}`
		const table = this._singularizedTableName(foreignTable)
		const key = this.constantCase(`${table}_${orderBy}`)

		return key
	}
}, true) // true = allow overriding existing inflectors
