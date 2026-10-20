import os
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin" + os.pathsep + r"C:\Program Files (x86)\Graphviz\bin"

from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.client import Users
from diagrams.onprem.container import Docker
from diagrams.onprem.database import PostgreSQL
from diagrams.onprem.inmemory import Redis
from diagrams.onprem.security import Vault
from diagrams.onprem.compute import Server
from diagrams.programming.framework import React, FastAPI
from diagrams.programming.language import Python
from diagrams.generic.network import Firewall
from diagrams.saas.cdn import Cloudflare

GRAPH_ATTR = {
    "bgcolor": "#ffffff",
    "pad": "2.0",
    "fontsize": "16",
    "fontname": "Sans-Serif",
    "fontcolor": "#1a1a2e",
    "splines": "ortho",
    "nodesep": "0.80",
    "ranksep": "0.90",
    "dpi": "600",
}

NODE_ATTR = {
    "fontname": "Sans-Serif",
    "fontsize": "12",
    "fontcolor": "#2D3436",
}

CLUSTER_VERCEL = {
    "bgcolor": "#f0f7ff",
    "style": "rounded",
    "pencolor": "#0070f3",
    "penwidth": "2.0",
    "fontname": "Sans-Serif",
    "fontsize": "14",
    "fontcolor": "#0050b3",
}

CLUSTER_SECURITY = {
    "bgcolor": "#fffbf0",
    "style": "rounded",
    "pencolor": "#d4a017",
    "penwidth": "1.5",
    "fontname": "Sans-Serif",
    "fontsize": "12",
    "fontcolor": "#8a6d00",
}

CLUSTER_INNER = {
    "bgcolor": "#ffffff",
    "style": "rounded",
    "pencolor": "#d0d7de",
    "penwidth": "1.5",
    "fontname": "Sans-Serif",
    "fontsize": "11",
    "fontcolor": "#57606a",
}

CLUSTER_LOCAL = {
    "bgcolor": "#f0fff4",
    "style": "rounded",
    "pencolor": "#2da44e",
    "penwidth": "2.0",
    "fontname": "Sans-Serif",
    "fontsize": "14",
    "fontcolor": "#1a7f37",
}

CLUSTER_ONPREM = {
    "bgcolor": "#f5f5f5",
    "style": "rounded",
    "pencolor": "#666666",
    "penwidth": "2.0",
    "fontname": "Sans-Serif",
    "fontsize": "14",
    "fontcolor": "#333333",
}

# 1. Production Architecture Diagram
with Diagram(
    "",
    filename="docs/diagrams/infrastructure",
    show=False,
    direction="LR",
    graph_attr=GRAPH_ATTR,
    node_attr=NODE_ATTR,
):
    citizens = Users("Ciudadanos / ONGs\nPortal Público")
    subscribers = Users("Auditores B2G /\nProveedores B2B")

    with Cluster("VERCEL PLATFORM  ·  Frontend SPA", graph_attr=CLUSTER_VERCEL):
        with Cluster("Edge CDN", graph_attr=CLUSTER_INNER):
            cdn = Cloudflare("TLS / HTTPS\nEdge Routing")
        with Cluster("Frontend SPA", graph_attr=CLUSTER_INNER):
            spa = React("React 19 + Vite 8\nTypeScript 6 + D3.js")

    with Cluster("RENDER CLOUD (render.yaml)  ·  VeedorIA Backend", graph_attr=CLUSTER_ONPREM):
        with Cluster("Security & Multi-Tenant Layer", graph_attr=CLUSTER_SECURITY):
            rate_limit = Firewall("CORS + Rate Limit\nSecurity Headers")
            jwt_rbac = Vault("JWT + RBAC (13 perms)\nTenant Isolation B2G/B2B")

        with Cluster("API & Services Layer", graph_attr=CLUSTER_INNER):
            api = FastAPI("veedoria-api (FastAPI)\n/api/public · /api/auth\n/api/anomalies · /api/sync")
            ml_engine = Python("Motor Detección (4)\nIsolation Forest + MAD\nNetworkX + RapidFuzz")

        with Cluster("Async Ingestion & Background Jobs", graph_attr=CLUSTER_INNER):
            redis_q = Redis("veedoria-redis (Redis 7)\nCola arq + Cache")
            worker = Docker("veedoria-worker (arq)\nAPScheduler + Sync OCDS")

        with Cluster("Persistence Layer", graph_attr=CLUSTER_INNER):
            pg = PostgreSQL("PostgreSQL 16\n15 Tablas (OCDS + RBAC)\nSQLAlchemy 2.0 Async")

    with Cluster("EXTERNAL GOV SOURCE", graph_attr=CLUSTER_VERCEL):
        dgcp = Server("DGCP Datos Abiertos\ndatosabiertos.dgcp.gob.do\nEstándar OCDS")

    citizens >> Edge(color="#0070f3", style="bold", label="HTTPS") >> cdn
    subscribers >> Edge(color="#0070f3", style="bold", label="HTTPS") >> cdn
    cdn >> Edge(color="#0070f3") >> spa
    spa >> Edge(color="#666666", label="REST /api/*") >> rate_limit
    rate_limit >> Edge(color="#d4a017", style="bold", label="Bearer JWT") >> jwt_rbac
    jwt_rbac >> Edge(color="#d4a017", style="bold", label="Tenant Scope") >> api
    api >> Edge(color="#666666", label="Detección / Contexto") >> ml_engine
    api >> Edge(color="#7c3aed", style="bold", label="asyncpg :5432") >> pg
    ml_engine >> Edge(color="#7c3aed", style="bold", label="Lectura / Escritura") >> pg
    api >> Edge(style="dashed", color="#999999", label="Enqueue Job") >> redis_q
    redis_q >> Edge(style="dashed", color="#999999", label="arq Task") >> worker
    worker >> Edge(color="#7c3aed", style="bold", label="Upsert OCDS") >> pg
    worker >> Edge(color="#0070f3", style="bold", label="HTTPS Paginado") >> dgcp

# 2. Local Development Environment Diagram
with Diagram(
    "",
    filename="docs/diagrams/infrastructure-dev",
    show=False,
    direction="LR",
    graph_attr=GRAPH_ATTR,
    node_attr=NODE_ATTR,
):
    dev = Users("Developer / QA\n(Analyst & Dev)")

    with Cluster("LOCAL ENVIRONMENT  ·  localhost", graph_attr=CLUSTER_LOCAL):
        with Cluster("Frontend  :5173", graph_attr=CLUSTER_INNER):
            vite = React("Vite 8 Dev Server\nReact 19 + Tailwind v4\nHMR + Proxy /api")

        with Cluster("Backend API  :3001", graph_attr=CLUSTER_INNER):
            fastapi_dev = FastAPI("FastAPI + Uvicorn\nAuth Multi-Tenant + RBAC\nPublic + Anomaly Routers")

        with Cluster("Docker Compose  :5432 / :6379", graph_attr=CLUSTER_INNER):
            pg_local = Docker("veedoria-pg (PG 16)\n19,353 Contratos\n1,262 Anomalías")
            redis_local = Docker("backend-redis-1\nRedis 7 Alpine")

    dev >> Edge(color="#2da44e", style="bold", label="http://localhost:5173") >> vite
    vite >> Edge(color="#666666", label="HTTP :3001/api/*") >> fastapi_dev
    fastapi_dev >> Edge(color="#7c3aed", style="bold", label="asyncpg :5432") >> pg_local
    fastapi_dev >> Edge(style="dashed", color="#999999", label="redis :6379") >> redis_local

print("Generated docs/diagrams/infrastructure.png and docs/diagrams/infrastructure-dev.png")
