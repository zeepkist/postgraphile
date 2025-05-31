import { makeAddInflectorsPlugin } from "graphile-utils";

const swapId = (str) => {
	let string

	if (str.startsWith("id_")) {
		string = str.replace(/^id_/, '') + '_id';
  	} else {
		string =str;
	}

  	// Convert id_user to user_id
	// console.debug("customCamelCase: " + str + " -> " + string);

	return string;
};
export default makeAddInflectorsPlugin(
  {
    // Override the column function to handle custom foreign key naming
    column(column, _table, _schema) {
      return this.camelCase(swapId(column.name));
    },

    // Override the single relation function to handle custom foreign key naming
    singleRelationByKeys(detailedKeys, table, _foreignTable, _constraint) {
      // const keys = detailedKeys.map((key) => this.camelCase(swapId(key.name)));
      // return `${this.camelCase(table.name)}By${keys.map(this.upperCamelCase).join("And")}`;

	    return `${this.camelCase(table.name)}`
    },

    // Override the many relation function to handle custom foreign key naming
    manyRelationByKeys(detailedKeys, table, _foreignTable, _constraint) {
      // const keys = detailedKeys.map((key) => this.camelCase(swapId(key.name)));
      // return `${this.pluralize(this.camelCase(table.name))}By${keys.map(this.upperCamelCase).join("And")}`;

	    return `${this.pluralize(this.camelCase(table.name))}`
    },
  },
  true // Passing true here allows the plugin to overwrite existing inflectors.
)
