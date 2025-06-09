import { parse, print } from "graphql";

const FLATTENED_FIELDS_NO_DEPTH = new Set([
	"nodes", "edges", // default GraphQL
	"keys", "aggregates", "groupedAggregates", // plugin fields
	"speeds", "splits", "blocks", "amountBlocks", "amountCheckpoints",
	"amountFinishes", "numRecords", "points", "totalPoints", "worldRecords"
  ]);

function getArgValue(valueNode) {
  switch (valueNode.kind) {
    case "IntValue":
      return parseInt(valueNode.value, 10);
    case "FloatValue":
      return parseFloat(valueNode.value);
    case "StringValue":
      return valueNode.value;
    case "BooleanValue":
      return valueNode.value;
    default:
      return undefined; // ignore variables or complex values
  }
}

function getPaginationMultiplier(args, defaultSize) {
  const firstArg = args.find(arg => arg.name.value === "first");
  const lastArg = args.find(arg => arg.name.value === "last");

  const first = firstArg ? getArgValue(firstArg.value) : undefined;
  const last = lastArg ? getArgValue(lastArg.value) : undefined;

  return first ?? last ?? defaultSize;
}

function shouldIncreaseDepth(fieldName) {
	return !FLATTENED_FIELDS_NO_DEPTH.has(fieldName) && !fieldName.startsWith("__");
}

function isManyToMany(fieldName) {
	const parts = fieldName.split("By");
	return parts.length > 1 && parts[0].endsWith("s")
}

function isCollectionField(fieldName, args) {
  if (FLATTENED_FIELDS_NO_DEPTH.has(fieldName)) return false;

  const hasPaginationArgs = args.some(arg => arg.name.value === "first" || arg.name.value === "last");
  const isPlural = fieldName.endsWith("s");

  return hasPaginationArgs || isPlural || isManyToMany(fieldName);
}

function containsIntrospectionField(selections) {
	for (const sel of selections) {
		if (sel.kind === "Field") {
		const name = sel.name.value;
		if (name === "__schema" || name === "__type") {
			return true;
		}
		} else if (sel.selectionSet) {
		if (containsIntrospectionField(sel.selectionSet.selections)) {
			return true;
		}
		}
	}
	return false;
	}

/**
 * Recursively estimates cost of GraphQL selections including fragment handling.
 * @param {import('graphql').SelectionNode[]} selections
 * @param {number} depth
 * @param {number} parentMultiplier
 * @param {Record<string, import('graphql').FragmentDefinitionNode>} fragments
 * @param {Set<string>} visitedFragments
 * @param {number} defaultCollectionSize
 */
function estimateSelectionsCost(
  selections,
  depth = 1,
  parentMultiplier = 1,
  fragments = {},
  visitedFragments = new Set(),
  defaultCollectionSize = 1000
) {
  let cost = 0;

  for (const selection of selections) {
    switch (selection.kind) {
      case "Field": {
        const fieldName = selection.name.value;
        const args = selection.arguments ?? [];
        const isCollection = isCollectionField(fieldName, args);
        const multiplier = isCollection ? getPaginationMultiplier(args, defaultCollectionSize) : 1;
        const totalMultiplier = parentMultiplier * multiplier;

		// Only apply depth multiplier if not a flattened field (or the wrapping pagination fields)
		const effectiveDepth = shouldIncreaseDepth(fieldName) ? depth : depth - 1;

		console.warn(`Estimating cost for field "${fieldName}" at depth ${depth} with multiplier ${totalMultiplier} (effective depth: ${effectiveDepth})`);

        cost += totalMultiplier * Math.max(1, effectiveDepth);

        if (selection.selectionSet) {
          cost += estimateSelectionsCost(
            selection.selectionSet.selections,
            effectiveDepth + 1,
            totalMultiplier,
            fragments,
            visitedFragments,
            defaultCollectionSize
          );
        }
        break;
      }
      case "FragmentSpread": {
        const fragName = selection.name.value;
        if (!visitedFragments.has(fragName)) {
          visitedFragments.add(fragName);
          const fragment = fragments[fragName];
          if (fragment) {
            cost += estimateSelectionsCost(
              fragment.selectionSet.selections,
              depth,
              parentMultiplier,
              fragments,
              visitedFragments,
              defaultCollectionSize
            );
          }
          visitedFragments.delete(fragName);
        }
        break;
      }
      case "InlineFragment": {
        cost += estimateSelectionsCost(
          selection.selectionSet.selections,
          depth,
          parentMultiplier,
          fragments,
          visitedFragments,
          defaultCollectionSize
        );
        break;
      }
    }
  }

  return cost;
}

/**
 * Entry point: parses document, collects fragments, and calculates total cost.
 * @param {import('graphql').DocumentNode} document
 * @param {number} defaultCollectionSize
 */
function estimateQueryCost(document, defaultCollectionSize = 1000) {
  const fragments = Object.create(null);
  for (const def of document.definitions) {
    if (def.kind === "FragmentDefinition") {
      fragments[def.name.value] = def;
    }
  }

  let totalCost = 0;
  for (const def of document.definitions) {
    if (def.kind === "OperationDefinition") {
      totalCost += estimateSelectionsCost(
        def.selectionSet.selections,
        1,
        1,
        fragments,
        new Set(),
        defaultCollectionSize
      );
    }
  }
  return totalCost;
}

/**
 * Koa middleware to estimate GraphQL query cost and reject if above maxCost.
 * @param {number} maxCost
 * @param {number} defaultCollectionSize
 */
export function createQueryCostMiddleware(maxCost = 2000, defaultCollectionSize = 1000) {
  return async (ctx, next) => {
	if (
      ctx.method !== "POST" ||
      ctx.path !== "/" || // adjust path as needed
      !ctx.request.body?.query
    ) {
      return next();
    }

	const startTime = performance.now();

    let document;
    try {
      document = parse(ctx.request.body.query);
    } catch (err) {
      ctx.status = 400;
      ctx.body = {
		errors: [{ message: "Invalid GraphQL Syntax", details: err.message }],
      };
      return;
    }

	 // Ignore introspection queries
	 for (const def of document.definitions) {
		if (
		  def.kind === "OperationDefinition" &&
		  containsIntrospectionField(def.selectionSet.selections)
		) {
		  return next();
		}
	  }

    const totalCost = estimateQueryCost(document, defaultCollectionSize);
	const endTime = performance.now();
	const elapsedTime = `${(endTime - startTime).toFixed(2)}ms`;
	const query = print(document);

	ctx.set('X-Query-Cost', totalCost);

    if (totalCost > maxCost) {
      ctx.status = 400;
      ctx.body = {
        errors: [
          {
			message: `Query Cost Exceeded`,
			details: `Estimated cost: ${totalCost} > ${maxCost}. Optimsise your query by using pagination, reducing field depth and limiting requested fields per selection to fetch only the data you need.`,
		  }
        ],
      };
	  console.warn(`❌ Query cost exceeded: ${totalCost} > ${maxCost} (${elapsedTime})`, query);
      return;
    }

    console.log(`✅ Query cost estimated: ${totalCost} (${elapsedTime})`, query);

    await next();
  };
}
