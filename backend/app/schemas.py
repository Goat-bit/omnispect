from typing import Optional, List, Literal
from pydantic import BaseModel

class MediaItem(BaseModel):
  id: int
  title: str
  media_type: Literal['movie', 'anime', 'series']
  genres: list[str]
  rating: float
  release_year: int
  synopsis: str
  poster_url: str

class MediaListResponse(BaseModel):
  total: int
  items: List[MediaItem]

class UserListAction(BaseModel):
  # What FastAPI receives from React when a user adds or removes an item from their list:
  media_id: int

class UserListsResponse(BaseModel):
  # What FastAPI returns so React knows which items are saved:
  watchlist_ids: List[int]
  completed_ids: List[int]
  watchlist: List[MediaItem]
  completed: List[MediaItem]

class RecommendedItem(BaseModel):
    item: MediaItem
    similarity_score: float
    shared_genres: List[str]


class RecommendationResponse(BaseModel):
    source_media_id: int
    source_title: str
    recommendations: List[RecommendedItem]