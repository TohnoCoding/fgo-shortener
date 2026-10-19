import { selectFromOrInsertToDatabase } from "./links";
import { findUrlBySlug } from "./links";
import { checkHeaders } from "./validations";
import { checkPostRequest } from "./validations";
import { checkURL } from "./validations";

const sourcechars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const fullurl = new URL(request.url);
		const method = request.method.toUpperCase();
		const pathname = fullurl.pathname;
		if (method === "OPTIONS") {
			const headerCheck = checkHeaders(request);
			if (headerCheck !== null) {
				return headerCheck;
			} else return new Response("Invalid preflight request",
				{ status: 400, headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
		} else if (method === "GET") {
			if (pathname === "/api/health") {
				return new Response(JSON.stringify({ 'status': 'ok', 'url': fullurl, 
					'method': method, 'pathname': pathname }),
					{ headers: { 'Content-Type': 'application/json' } });
			} else {
				if (pathname.length != 9) return new Response("Invalid slug length", { status: 404 });
				for (var i = 1; i < pathname.length; i++) {
					if (!sourcechars.includes(pathname[i])) {
						return new Response("Invalid slug characters", { status: 400 });
					}
				}
				const longUrl = await findUrlBySlug(pathname.slice(1), env);
				if (longUrl) {
					return new Response(null, { status: 302, headers: { 'Location': longUrl } });
				} else return new Response("Not found", { status: 404 });
			}
		} else if (method === "POST") {
			try
			{
				if (pathname === "/api/shorten") {
					const origin = request.headers.get("Origin");
					if (origin !== "https://tohnocoding.github.io") {
						return new Response("Invalid origin", { status: 403 });
					}
					const data = await request.json();
					try {
						const postRequest = await checkPostRequest(request, data);
						if (postRequest === null) {
							var url = new URL(data.long);
							const urlCheck = checkURL(url);
							if (urlCheck !== null) {
								return urlCheck;
							}
						} else return postRequest;
					} catch (error) {
						if (error instanceof TypeError) return new Response("Possible malformed URL",
							{ status: 400, headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
						else if (error instanceof SyntaxError) return new Response("Syntax error",
							{ status: 400, headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
						else return new Response("Invalid request body", 
							{ status: 400, headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
					}
					try {
						var slug = await selectFromOrInsertToDatabase(data.long, env, 0);
						return new Response(JSON.stringify({ 'status': 'ok', 'short': slug }),
							{ headers: { 'Content-Type': 'application/json', 
								'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
					} catch {
						return new Response("Bad database juju", { status: 500, 
							headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
					}
				} else {
					return new Response("Bad object", { status: 400,
						headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
				}	
			} catch {
				return new Response("Invalid JSON request object", { status: 400,
					headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
			}
		} else return new Response("Not found", { status: 404,
			headers: { 'Access-Control-Allow-Origin': 'https://tohnocoding.github.io' } });
	}
} satisfies ExportedHandler<Env>;