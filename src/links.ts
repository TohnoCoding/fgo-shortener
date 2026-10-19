import { generateSlug } from "./slug";

export async function selectFromOrInsertToDatabase(long_url: string, env: Env): Promise<string> {
	var result = await findSlugByUrl(long_url, env);
	if (result === null || result === undefined) {
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

export async function findUrlBySlug(slug: string, env: Env): Promise<string | null> {
    const queryresult = await env.DB.prepare("SELECT long_url FROM links WHERE slug = ?").bind(slug).first<{ long_url: string }>();
    if (queryresult === null) {
        return null;
    } else {
        return queryresult.long_url;
    }
}