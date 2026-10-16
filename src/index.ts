export default {
	async fetch(request, env, ctx): Promise<Response> {
		const fullurl = new URL(request.url);
		const method = request.method.toUpperCase();
		const pathname = fullurl.pathname;
		if (method === "GET") {
			if (pathname === "/api/health") {
				return new Response(JSON.stringify({ 'status': 'ok', 'url': fullurl, 
					'method': method, 'pathname': pathname }),
					{ headers: { 'Content-Type': 'application/json' } });
			} else if (pathname === "/") {
				return new Response("Hello World!", { headers: { 'Content-Type': 'text/plain' } });
			} else return new Response("Not found", { status: 404 });
		} else if (method === "POST") {
			if (pathname === "/api/links") {
				try {
					const data = await request.json();
					if (data === null) return new Response("Bad Request", { status: 400 });
					if (Array.isArray(data)) return new Response("Bad Request", { status: 400 });
					if (typeof data === "object" && Object.hasOwn(data, "long") && typeof data.long === "string"
						&& request.headers.get("Content-Type")?.includes("application/json")) {
						var url = new URL(data.long);
						if (url.hostname === "tohnocoding.github.io" && 
							url.pathname === "/fgochecklist/" && url.protocol === "https:") {
								return new Response(JSON.stringify({ 'status': 'ok', 'long': data.long }),
									{ headers: { 'Content-Type': 'application/json' } });
						} else {
							return new Response("Bad source URI", { status: 400 });
						}
					} else {
						return new Response("Bad object", { status: 400 });
					}
				} catch (error) {
					return new Response("Wrong request body", { status: 400 });
				}
			} else return new Response("Not found", { status: 404 });
		}
		else return new Response("Method not allowed", { status: 405 });
	},
} satisfies ExportedHandler<Env>;