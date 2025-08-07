import { trace } from "@opentelemetry/api"

const HEADERS_TO_COLLECT = [
	"X-Zeepkist-Version",
	"X-Zeepkist-Major-Version",
	"X-GTR-Version",
	"X-Steam-ID"
]

/**
 * Middleware to collect specific headers from the Koa context and attach them as attributes
 * to the current OpenTelemetry tracing span, if available.
 *
 * @param {import('koa').Context} ctx - The Koa request/response context object.
 * @param {() => Promise<void>} next - The next middleware function in the Koa stack.
 * @returns {Promise<void>} Resolves when the middleware chain completes.
 */
export const collectHeaderMetrics = async (ctx, next) => {
    const span = trace.getActiveSpan()

    if (span) {
		for (const header of HEADERS_TO_COLLECT) {
			const value = ctx.headers[header.toLowerCase()]

			if (value) {
				span.setAttribute(`graphql.header.${header}`, value)
			}
		}
    }

    await next()
}
