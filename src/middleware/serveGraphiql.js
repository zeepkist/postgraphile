import { ruruHTML } from "ruru/server"
import { getStaticFile } from "ruru/static"

const ruruConfig = {
	staticPath: '/ruru-static/',
	endpoint: '/'
}

/**
 * Middleware to serve the Ruru GraphiQL interface.
 *
 * @param {import('koa').Context} ctx - The Koa request/response context object.
 * @param {() => Promise<void>} next - The next middleware function in the Koa stack.
 * @returns {Promise<void>} Resolves when the middleware chain completes.
 */
export const serveGraphiql = async (ctx, next) => {
	if (ctx.path === "/" && ctx.method === "GET") {
		ctx.type = "text/html"
		ctx.body = ruruHTML(ruruConfig)
	} else if (ctx.path.startsWith(ruruConfig.staticPath)) {
		const staticFile = await getStaticFile({
			staticPath: ruruConfig.staticPath,
			urlPath: ctx.url,
			acceptEncoding: ctx.headers['accept-encoding'],
			disallowDevAssets: true,
		})

		if (staticFile) {
			const { etag } = staticFile.headers

			if (ctx.headers['if-none-match'] === etag) {
				ctx.status = 304 // Not Modified
				ctx.headers['etag'] = etag
				return
			} else {
				ctx.status = 200
				ctx.set(staticFile.headers)
				ctx.body = staticFile.content
				return
			}
		}
	} else {
		await next()
	}
}
