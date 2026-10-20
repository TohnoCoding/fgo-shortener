import { generateSlug } from "./slug";

export async function selectFromOrInsertToDatabase(long_url: string, env: Env, retries: number = 0): Promise<string> {
    const slug = generateSlug() ;
    try {
        await env.DB.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind(slug, long_url).run();
        return slug;
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("SQLITE_CONSTRAINT_PRIMARYKEY")) { // TODO: dependent on Cloudflare's error message format
                if (retries >= 5) {
                    throw new Error("Slug collision retry limit exceeded");
                }
                return selectFromOrInsertToDatabase(long_url, env, retries + 1);
            }
            if (error.message.includes("SQLITE_CONSTRAINT_UNIQUE")) { // TODO: dependent on Cloudflare's error message format
                const existingSlug = await findSlugByUrl(long_url, env);
                if (existingSlug !== null) return existingSlug; 
            }
        }
        throw error;
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