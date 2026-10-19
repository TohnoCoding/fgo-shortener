import { generateSlug } from "./slug";

export async function selectFromOrInsertToDatabase(long_url: string, env: Env, retries: number = 0): Promise<string> {
	var result = await findSlugByUrl(long_url, env);
	if (result === null || result === undefined) {
		var slug = generateSlug();
		try {
			var test = (await env.DB.prepare("SELECT slug FROM links WHERE slug = ?").bind(slug).first<{ slug: string }>());
			while (test !== null) {
				slug = generateSlug();
				test = (await env.DB.prepare("SELECT slug FROM links WHERE slug = ?").bind(slug).first<{ slug: string }>());
			}
			await env.DB.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind(slug, long_url).run();
			return slug;
		} catch (error) {
			if (retries < 5) {
				return await selectFromOrInsertToDatabase(long_url, env, retries + 1);
			} else throw new Error("Failed to insert into database after multiple retries: " + error);
		}
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