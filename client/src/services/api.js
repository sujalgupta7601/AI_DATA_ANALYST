
const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }

    return result;
}

export function fetchDashboard(period = 12) {
    return apiRequest(`/dashboard?period=${period}`);
}

export function sendChat(message) {
    return apiRequest("/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
    });
}


export async function uploadCSV(file) {
    const formData = new FormData();
    formData.append("file", file);

    const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

    const response = await fetch(
        `${API_URL}/datasets/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Upload failed");
    }

    return result;
}

export function fetchDatasetPreview(datasetId) {
    return apiRequest(`/datasets/${datasetId}`);
}

export function fetchDatasetAnalysis(datasetId) {
    return apiRequest(`/datasets/${datasetId}/analysis`);
}


export function askDatasetAI(
    datasetId,
    question,
    history = []
) {
    return apiRequest("/ai/ask", {
        method: "POST",
        body: JSON.stringify({
            datasetId,
            question,
            history,
        }),
    });
}

