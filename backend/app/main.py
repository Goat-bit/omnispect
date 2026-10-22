from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from app.schemas import (
    MediaItem,
    MediaListResponse,
    UserListAction,
    UserListsResponse,
    RecommendationResponse,)
from app.database import init_db, toggle_media_status, get_status_ids
from app.seed_data import MEDIA_CATALOG, live_search_external,fetch_media_details

app = FastAPI(title="Omnispect API", version="1.0.0")

init_db()  # Ensure the database and user_lists table are initialized on startup
from prometheus_fastapi_instrumentator import Instrumentator

# Create SQLite table on startup
init_db()

# Expose /metrics endpoint for Prometheus monitoring
Instrumentator().instrument(app).expose(app)

# Allow React frontend (port 5173) to talk to FastAPI (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "omnispect-backend"}

@app.get("/api/media", response_model=MediaListResponse)
def get_media(
    search: Optional[str] = Query(None),
    media_type: Optional[str] = Query(None)
):
    # Step 0: If searching a specific term (3+ chars), fetch live matches into MEDIA_CATALOG first
    if search and len(search.strip()) >= 3:
        live_search_external(search.strip().lower(), media_type)

    results = MEDIA_CATALOG

    # Todo 1: Filter by media_type
    if media_type and media_type.lower() != "all":
        target_type = media_type.lower()
        results = [item for item in results if item["media_type"] == target_type]

    # Todo 2: Filter by search query
    if search and search.strip() != "":
        q = search.strip().lower()
        filtered_items = []
        for item in results:
            title_match = q in item["title"].lower()
            synopsis_match = q in item["synopsis"].lower()
            genre_match = any(q in g.lower() for g in item["genres"])

            if title_match or synopsis_match or genre_match:
                filtered_items.append(item)

        results = filtered_items

    return {
        "total": len(results),
        "items": results
    }

@app.get("/api/media/{media_id}", response_model=MediaItem)
def get_media_by_id(media_id: int):
    for item in MEDIA_CATALOG:
        if item["id"] == media_id:
            return item
            
    raise HTTPException(status_code=404, detail="Media item not found")

@app.get("/api/media/{media_id}/details")
def get_media_rich_details(media_id: int):
    for item in MEDIA_CATALOG:
        if item["id"] == media_id:
            return fetch_media_details(item)
    raise HTTPException(status_code=404, detail="Media item not found")

@app.get("/api/user/lists", response_model= UserListsResponse)
def get_user_lists():
    watchlist_ids, completed_ids = get_status_ids()

    watchlist_items = [item for item in MEDIA_CATALOG if item["id"] in watchlist_ids]
    completed_items = [item for item in MEDIA_CATALOG if item["id"] in completed_ids]

    return {
        "watchlist_ids": watchlist_ids,
        "completed_ids": completed_ids,
        "watchlist": watchlist_items,
        "completed": completed_items,
    }


@app.post("/api/user/watchlist")
def update_watchlist(payload: UserListAction):
    # Verify the media_id actually exists in our catalog first
    exists = any(item["id"] == payload.media_id for item in MEDIA_CATALOG)
    if not exists:
        raise HTTPException(status_code=404, detail="Media item not found")

    new_state = toggle_media_status(payload.media_id, "watchlist")
    return {"media_id": payload.media_id, "status": new_state}


@app.post("/api/user/completed")
def update_completed(payload: UserListAction):
    exists = any(item["id"] == payload.media_id for item in MEDIA_CATALOG)
    if not exists:
        raise HTTPException(status_code=404, detail="Media item not found")

    new_state = toggle_media_status(payload.media_id, "completed")
    return {"media_id": payload.media_id, "status": new_state}

@app.get("/api/recommendations", response_model=RecommendationResponse)
def get_recommendations(media_id: int = Query(..., description="ID of the media item")):
    # 1. Find the source item
    source = next((item for item in MEDIA_CATALOG if item["id"] == media_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Source media item not found")

    source_genres = {g.lower() for g in source["genres"]}
    scored_matches = []

    # 2. Score every other item by genre feature overlap (Jaccard Similarity)
    for candidate in MEDIA_CATALOG:
        if candidate["id"] == source["id"]:
            continue

        cand_genres = {g.lower() for g in candidate["genres"]}
        shared = [g for g in candidate["genres"] if g.lower() in source_genres]

        if shared:
            union_size = len(source_genres | cand_genres)
            similarity = round(len(shared) / union_size, 2) if union_size else 0.0
            scored_matches.append({
                "item": candidate,
                "similarity_score": similarity,
                "shared_genres": shared,
            })

    # 3. Sort by highest similarity score first, then rating as tie-breaker
    scored_matches.sort(
        key=lambda x: (x["similarity_score"], x["item"]["rating"]),
        reverse=True
    )

    return {
        "source_media_id": source["id"],
        "source_title": source["title"],
        "recommendations": scored_matches[:6],
    }