export function generateSlug(): string {
    const sourcechars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const result = crypto.getRandomValues(new Uint8Array(8));
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