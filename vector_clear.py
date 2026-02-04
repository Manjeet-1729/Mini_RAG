from qdrant_client import QdrantClient
from qdrant_client.models import Filter

client = QdrantClient(
    url="https://2a8c885a-18d8-4b8e-8eb8-197f9820566d.europe-west3-0.gcp.cloud.qdrant.io",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0._sfE7pRTL7xNHbzGzYVBL3KNSvyJSlmydp0wLU02Os8"  # omit if local
)

client.delete(
    collection_name="rag_doc",
    points_selector=Filter()  # empty filter = delete all points
)
