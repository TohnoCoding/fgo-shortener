import { generateSlug } from "./slug";

export async function selectFromOrInsertToDatabase(long_url: string, env: Env, retries: number = 0): Promise<string> {
    // const result = await findSlugByUrl(long_url, env);
    // if (result !== null) return result;
	const database = env.DB1;
	long_url = "https://tohnocoding.github.io/fgochecklist/?pak=AwWmD4FYC5gGgIxirRIEvkgTJtBmPJAFiJEjIDYyB2MgDjIE4yBBMgIT22Rnh4x84PXEJ6ExIUpIqTqkupMaSWk9pK6SAwtxAARXQFE8+dCZCjUpiVannZt+bcW3lt1bfW3NtnUNMG-iDGQQBi5gDi5gAS5gCS5gBS5gDS5gAy5gCy5gBy5gDy5gAK5gCK5gBK5gDK5gAq5gCq5gBq5gDq5gAa5gCa5gBa5gCG5gBG5gDG5gAm5gCm5gBm5gDm5gAW4MTQCHCmAJbmAFbmANbmADbmALbmAHZ4xMj4qC-AuMB7cB+kCO8wA54B8nCCwC5wcA3FCWN99h92LsoT4oX5AcBAhjjG8oeFkb8wFEhB9YtgMQlcYTgMkSWA0nTgJlGTlGaVGdVyVC6gSPo1GS0udT2lSPl0hR9eoyBhKwMNGWNGZNeWB5oylvDqasAVCNozjrLgGdDZdGTcddSnoyAPbPMAABx2GIAjnbgAAncCaj4AF3AFo+AFdwIaAG5ugDuboAHm6AJ5OqEAL39gMEaYgKoQ6fBCGkaboovQMMJCA8ua8ua4RYQOllCCxufCAfQmW+kFLrLT+XbpfZaYqLYQ1TpCDq9f5aZadMs4OwuBb2Bsc-+gOwFCL2Goi8hhOwJZe2BYLeXhPwEDp+EIvZe+DoJ4PIHwcOgHZepBVxAgN6kGB-xAof8Xzfcg7Ugb9X0JagVToFVGBVctCXYFtUUJOtAUbQkQkBcI6SiWUEjpWlAQZQFMhbHIVXyFUillftwQqWUR0BOo6UaFsWhbdo6S6OkpUBAY6XlQExhVSZZRmIslhbPVAQNQEzjpU1ARuIt7jpK1AVtOlHRbV1vRAT06QAZztP06WDFtwzpKM6VjOkEyESBXlQZzgEIC03NIKk3OoIU3PvVywEYfywBYHywHYCLgC4TywGMOLgCiRLYkShJQppVN4DctJEsyaL8icsBSkSwcguATlysaDLegywTyrGRKZkS+YMu1cqNkS7ZEuORLjXKm4CTc+5EqeRLbUS0zEr9RKo1CjA4oQa8fmcvM8FWihFsYOLcCGiwFqC+cQ0OjzDpCw6WFCwgrogOKryyuBnPwahvmyp8Xze-BkKC0hQq-B7nOIP8fuWt7iFIV7HqkChdnwKHiBelapEYN5iHhjxsChihQsgCHoBoKHtyCyhAOgTHnMoRG3sC6ngY7Zzzre48gtioKdDigwIoSoLmyC-CgtSoLkjitJQvIoKclC-JQqKCKSqC6o4saCLOKC9pQplILhLesZQsmOLJKC1qgvat7tlCm5QpGoKnlCiagsdULPTiqaguDPbwziqM4tjUKEx1IA&fast=1&classlist=1";
    const slug = generateSlug() ;
    try {
        await database.prepare("INSERT INTO links (slug, long_url) VALUES (?, ?)").bind(slug, long_url).run();
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
	const database = env.DB1;
	const queryresult = await database.prepare("SELECT slug FROM links WHERE long_url = ?").bind(longUrl).first<{ slug: string }>();
	if (queryresult === null) {
		return null;
	} else {
		return queryresult.slug;
	}
}

export async function findUrlBySlug(slug: string, env: Env): Promise<string | null> {
    const database = env.DB1;
	const queryresult = await database.prepare("SELECT long_url FROM links WHERE slug = ?").bind(slug).first<{ long_url: string }>();
    if (queryresult === null) {
        return null;
    } else {
        return queryresult.long_url;
    }
}