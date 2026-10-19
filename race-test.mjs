const endpoint = "http://127.0.0.1:8787/api/shorten";

const long = "https://tohnocoding.github.io/fgochecklist/?pak=your-test-value";

const requests = Array.from({ length: 10 }, () =>
    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": "https://tohnocoding.github.io"
        },
        body: JSON.stringify({ long })
    }).then(async response => ({
        status: response.status,
        body: await response.text()
    }))
);

console.log(await Promise.all(requests));