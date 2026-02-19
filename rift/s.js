document.getElementById('analyze-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];

    if (!file) return alert("Upload a CSV file!");

    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    document.getElementById('analyze-btn').innerText = "Analyzing...";

    try {
        const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        renderGraph(data);
        updateUI(data);

        // Enable JSON download
        const downloadBtn = document.getElementById('download-json');
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => downloadResults(data);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        document.getElementById('analyze-btn').innerText = "Analyze Network";
    }
});

function renderGraph(data) {
    const cy = cytoscape({
        container: document.getElementById('cy'),
        // Map the graph_data from Python to Cytoscape elements
        elements: data.graph_data, 
        style: [
            { 
                selector: 'node', 
                style: { 
                    'label': 'data(id)', 
                    'background-color': '#007bff',
                    'color': '#fff',
                    'font-size': '10px'
                } 
            },
            { 
                selector: 'node[suspicious=true]', // High degree nodes
                style: { 'background-color': '#e94560', 'width': 30, 'height': 30 } 
            },
            {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'line-color': '#ccc',
                    'width': 2
                }
            },
            {
                selector: '.ring-edge', // We will tag cycle edges with this class
                style: { 'line-color': '#ff9f43', 'width': 4 }
            }
        ],
        layout: { name: 'cose', animate: true }
    });
}

function downloadResults(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detection_results.json';
    a.click();
}
function updateUI(data) {
    document.getElementById('ring-count').innerText = data.summary.rings_found;
    document.getElementById('node-count').innerText = data.summary.suspicious_count;
}