from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import networkx as nx
import io

app = FastAPI()

# 1. THE MOST IMPORTANT PART: Allow the frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    
    # Build Graph
    G = nx.from_pandas_edgelist(df, 'sender_id', 'receiver_id', create_using=nx.DiGraph())
    
    # 1. Detection: High Degree (Smurfing)
    suspicious_nodes = [n for n, d in G.degree() if d >= 10]
    
    # 2. Detection: Rings (Cycles)
    # simple_cycles finds paths that start and end at the same node
    rings = list(nx.simple_cycles(G)) 
    ring_nodes = {node for ring in rings for node in ring} # Flatten for quick lookup

    # 3. Format for Cytoscape
    elements = []
    for node in G.nodes():
        elements.append({
            "data": { 
                "id": str(node), 
                "suspicious": node in suspicious_nodes or node in ring_nodes 
            }
        })
    
    for u, v in G.edges():
        elements.append({
            "data": { "source": str(u), "target": str(v) }
        })

    return {
        "graph_data": elements,
        "fraud_rings": rings,
        "summary": {
            "total_analyzed": len(df),
            "suspicious_count": len(suspicious_nodes),
            "rings_found": len(rings)
        }
    }