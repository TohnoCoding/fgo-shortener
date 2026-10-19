import { selectFromOrInsertToDatabase } from "./links";
import { findUrlBySlug } from "./links";
import { checkHeaders } from "./validations";
import { checkPostRequest } from "./validations";
import { checkURL } from "./validations";

const sourcechars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_URL_BYTES = 64 * 1024;
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
				// if (pathname === "/test") {
				// 	try {
				// 		await env.DB.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind('Sdy3Y7TH', 'http://google.com').run();
				// 		//await env.DB.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind('AAAAAAAA', 'https://tohnocoding.github.io/fgochecklist/?pak=AwWmD4FYC5gGgIxirRIEvkgTJtBmPJAFiJEjIDYyB2MgDjIE4yBBMgIT22Rnh4x84PXEJ6ExIUpIqTqkupMaSWk9pK6SAwtxAARXQFE8+dCZCjUpiVannZt+bcW3lt1bfW3NtnUNMG-iDGQQBi5gDi5gAS5gCS5gBS5gDS5gAy5gCy5gBy5gDy5gAK5gCK5gBK5gDK5gAq5gCq5gBq5gDq5gAa5gCa5gBa5gCG5gBG5gDG5gAm5gCm5gBm5gDm5gAW4MTQCHCmAJbmAFbmANbmADbmALbmAHZ4xMj4qC-AuMB7cB+kCO8wA54B8nCCwC5wcA3FCWN99h92LsoT4oX5AcBAhjjG8oeFkb8wFEhB9YtgMQlcYTgMkSWA0nTgJlGTlGaVGdVyVC6gSPo1GS0udT2lSPl0hR9eoyBhKwMNGWNGZNeWB5oylvDqasAVCNozjrLgGdDZdGTcddSnoyAPbPMAABx2GIAjnbgAAncCaj4AF3AFo+AFdwIaAG5ugDuboAHm6AJ5OqEAL39gMEaYgKoQ6fBCGkaboovQMMJCA8ua8ua4RYQOllCCxufCAfQmW+kFLrLT+XbpfZaYqLYQ1TpCDq9f5aZadMs4OwuBb2Bsc-+gOwFCL2Goi8hhOwJZe2BYLeXhPwEDp+EIvZe+DoJ4PIHwcOgHZepBVxAgN6kGB-xAof8Xzfcg7Ugb9X0JagVToFVGBVctCXYFtUUJOtAUbQkQkBcI6SiWUEjpWlAQZQFMhbHIVXyFUillftwQqWUR0BOo6UaFsWhbdo6S6OkpUBAY6XlQExhVSZZRmIslhbPVAQNQEzjpU1ARuIt7jpK1AVtOlHRbV1vRAT06QAZztP06WDFtwzpKM6VjOkEyESBXlQZzgEIC03NIKk3OoIU3PvVywEYfywBYHywHYCLgC4TywGMOLgCiRLYkShJQppVN4DctJEsyaL8icsBSkSwcguATlysaDLegywTyrGRKZkS+YMu1cqNkS7ZEuORLjXKm4CTc+5EqeRLbUS0zEr9RKo1CjA4oQa8fmcvM8FWihFsYOLcCGiwFqC+cQ0OjzDpCw6WFCwgrogOKryyuBnPwahvmyp8Xze-BkKC0hQq-B7nOIP8fuWt7iFIV7HqkChdnwKHiBelapEYN5iHhjxsChihQsgCHoBoKHtyCyhAOgTHnMoRG3sC6ngY7Zzzre48gtioKdDigwIoSoLmyC-CgtSoLkjitJQvIoKclC-JQqKCKSqC6o4saCLOKC9pQplILhLesZQsmOLJKC1qgvat7tlCm5QpGoKnlCiagsdULPTiqaguDPbwziqM4tjUKEx1IA&fast=1').run();
				// 		return new Response("Error testing");
				// 	} catch (error) {
				// 		if (error instanceof Error) {
				// 			console.error("D1 error: ", error.message);
				// 			console.error("D1 cause: ", error.cause);
				// 		} else console.error("Unknown error: ", error)
				// 		throw error;
				// 	}
				// }
				if (pathname === "/api/shorten") {
					const origin = request.headers.get("Origin");
					if (origin !== "https://tohnocoding.github.io") {
						return new Response("Invalid origin", { status: 403 });
					}
					const data = await request.json();
					try {
						const postRequest = await checkPostRequest(request, data);
						if (postRequest === null) {
							if (new TextEncoder().encode(data.long).byteLength > MAX_URL_BYTES) {
 							   return new Response("URL too large", { status: 413 });
							}
							const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown";
							const { success } = await env.CREATE_RATE_LIMITER.limit({
    							key: clientIP
							});
							if (!success) {
    							return new Response("Too many requests", { status: 429,
        							headers: { "Access-Control-Allow-Origin": "https://tohnocoding.github.io", 
										"Retry-After": "60" } });
							}
							var url = new URL(data.long);
							const urlCheck = checkURL(url);
							if (urlCheck !== null) return urlCheck;
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