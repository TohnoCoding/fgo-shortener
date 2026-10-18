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
			} else return new Response("Not found", { status: 404 });
		} else if (method === "POST") {
			if (pathname === "/api/links") {
				var isValid : boolean = false;
				const data = await request.json();
				try {
					if (data === null) return new Response("Null data request", { status: 400 });
					if (Array.isArray(data)) return new Response("Array data request", { status: 400 });
					if (typeof data === "object" && Object.hasOwn(data, "long") && typeof data.long === "string"
					&& request.headers.get("Content-Type")?.includes("application/json")) {
						var url = new URL(data.long);
						if (url.hostname === "tohnocoding.github.io" && 
							url.pathname === "/fgochecklist/" && url.protocol === "https:") {
							isValid = true;
						}
						if (!isValid) {
							throw new Error("Invalid source URI");
						}
					}
				} catch (error) {
					return new Response("Wrong request body: " + error.message, { status: 400 });
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
		} else return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

export function generateSlug(): string {
	var sourcechars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var result = crypto.getRandomValues(new Uint8Array(8));
	var slug = "";
	for (var i = 0; i < result.length; i++) {
		var elem = result[i];
		while (elem > 247) {
			elem = crypto.getRandomValues(new Uint8Array(1))[0];
		}
		var element = elem % sourcechars.length;
		slug += sourcechars.charAt(element);
	}
	return slug;
}

export async function selectFromOrInsertToDatabase(long_url: string, env: Env): Promise<string> {
	var result = await findSlugByUrl(long_url, env);
	if (result === null) {
		var slug = generateSlug();
		var test = (await env.DB.prepare("SELECT slug FROM links WHERE slug = ?").bind(slug).first<{ slug: string }>());
		while (test !== null) {
			slug = generateSlug();
			test = (await env.DB.prepare("SELECT slug FROM links WHERE slug = ?").bind(slug).first<{ slug: string }>());
		}
		await env.DB.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind(slug, long_url).run();
		return slug;
	} else {
		return result;
	}
}

export async function findSlugByUrl(longUrl: string, env: Env): Promise<string | null> {
	const queryresult = await env.DB.prepare("SELECT slug FROM links WHERE long_url = ?").bind(longUrl).first<{ slug: string }>();
	if (queryresult === null) {
		return null;
	} else {
		return queryresult.slug;
	}
}