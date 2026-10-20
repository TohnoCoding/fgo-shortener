export function checkHeaders(request: Request, env: Env): Response | null {
	const origin = request.headers.get("Origin");
	if (origin !== null && origin !== undefined && origin !== env.ALLOWED_ORIGIN) {
		return new Response("Invalid origin",
			{ status: 403, headers: { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN } });
	}
	if (request.headers.get("Access-Control-Request-Method")?.toUpperCase() !== "POST" ||
		request.method?.toUpperCase() !== "OPTIONS") {
		return new Response("Invalid request method",
			{ status: 400, headers: { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN } });
	}
	if (request.headers.get("Access-Control-Request-Headers")?.toLowerCase() !== "content-type") {
		return new Response("Invalid content request headers",
			{ status: 400, headers: { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN } });
	}
	return new Response(null, { status: 204, headers: {
		"Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	} });
}

export async function checkPostRequest(request: Request, env: Env, data: unknown): Promise<Response | null> {
	if (data === null || data === undefined) {
		return new Response("Empty request body", { status: 400 });
	}
	if (Array.isArray(data)) {
		return new Response("Array-type request body not allowed", { status: 400 });
	}
	if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
		return new Response("Invalid origin", { status: 403 });
	}
	if (!isValidPostData(data)) {
		return new Response("Required request field missing or invalid", { status: 400 });
	}
	return null;
}

export function checkURL(url: URL, env: Env): Response | null {
	if (url.hostname !== env.ALLOWED_HOSTNAME || 
		url.pathname !== env.ALLOWED_PATHNAME || url.protocol !== "https:") {
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
	return null;
}

export function isValidPostData(data: unknown): data is { long: string } {
	if (data === null || data === undefined) {
		return false;
	}
	if (typeof data !== "object" || !Object.hasOwn(data, "long") || typeof data.long !== "string") {
		return false;
	}
	return true;
}