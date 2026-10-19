import { selectFromOrInsertToDatabase } from "./links";
import { findUrlBySlug } from "./links";

const sourcechars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
			} else if (fullurl.hostname === window.location.hostname && fullurl.protocol === "https:") {
				if (pathname.length != 9) return new Response("Invalid slug length", { status: 404 });
				for (var i = 1; i < pathname.length; i++) {
					if (!sourcechars.includes(pathname[i])) {
						return new Response("Invalid slug characters", { status: 404 });
					}
				}
				const longUrl = await findUrlBySlug(pathname.slice(1), env);
				if (longUrl) {
					return new Response(null, { status: 302, headers: { 'Location': longUrl } });
				} else return new Response("Not found", { status: 404 });
			} else return new Response("Not found", { status: 404 });
		} else if (method === "POST") {
			try
			{
				if (pathname === "/api/links") {
					const data = await request.json();
					try {
						if (data === null) return new Response("Null data request", { status: 400 });
						if (Array.isArray(data)) return new Response("Unsupported data request (array)", { status: 400 });
						if (typeof data === "object" && Object.hasOwn(data, "long") && typeof data.long === "string"
						&& request.headers.get("Content-Type")?.includes("application/json")) {
							if (data.long.length === 0) return new Response("Empty long URL", { status: 400 });
							var url = new URL(data.long);
							if (url.hostname !== "tohnocoding.github.io" || 
								url.pathname !== "/fgochecklist/" || url.protocol !== "https:") {
								return new Response("Invalid source URL", { status: 400 });
							}
							if (url.username !== "" || url.password !== "" || url.port !== "") {
								return new Response("Credentials or alternate ports not permitted in source URL", { status: 400 });
							}
							if (!url.searchParams.has("pak") ) {
									return new Response("Missing required query parameters in source URL", { status: 400 });
							}
							const validOptionalParams = ["fast", "NA", "classlist"];
							for (const param of url.searchParams.keys()) {
								if (param === "pak") continue;
								if (!validOptionalParams.includes(param)) {
									return new Response("Invalid query parameters in source URL", { status: 400 });
								}
							}
						} else return new Response("Conditions not met for request body", { status: 400 });
					} catch {
						return new Response("Invalid request body", { status: 400 });
					}
					try {
						var slug = await selectFromOrInsertToDatabase(data.long, env);
						return new Response(JSON.stringify({ 'status': 'ok', 'short': slug }),
							{ headers: { 'Content-Type': 'application/json' } });
					} catch {
						return new Response("Bad database juju", { status: 500 });
					}
				} else {
					return new Response("Bad object", { status: 400 });
				}	
			} catch {
				return new Response("Invalid JSON request object", { status: 400 });
			}
		} else return new Response("Not found", { status: 404 });
	}
} satisfies ExportedHandler<Env>;