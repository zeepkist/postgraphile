const data = {
	"levels": {
		"totalCount": 41110,
		"edges": [
		{
			"node": {
			"hash": "BCAFE1D99C410469C88DB94DD759058630216FD7",
			"levelItemsByIdLevel": {
				"edges": [
				{
					"node": {
					"fileAuthor": "agix",
					"name": "No Mind To Think",
					"validationTimeAuthor": 45.46511
					}
				}
				]
			},
			"votesByIdLevel": {
				"aggregates": {
				"sum": {
					"value": "-1"
				}
				},
				"totalCount": 4
			}
			}
		}
		]
	}
}

const level = data.levels.edges[0].node;
const sumValue = Number.parseFloat(level.votesByIdLevel.aggregates.sum.value);
const totalVotes = level.votesByIdLevel.totalCount;

const votePercentage = totalVotes === 0 ? null : ((sumValue + 2 * totalVotes) / (4 * totalVotes)) * 100;

console.log(`Vote Percentage: ${votePercentage.toFixed(2)}%`);
