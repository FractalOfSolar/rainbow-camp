onmessage = async ({ data: { url, method, data } }) => {
    const formData = new FormData;

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            formData.append(key, data[key]);
        }
    }

    try {
        await fetch(url, { method, body: formData, mode: 'no-cors' });
        postMessage({ completed: true });
    } catch {
        postMessage({ completed: false });
    }
};
