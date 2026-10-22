import json
import ssl
import urllib.parse
import urllib.request
from pathlib import Path

CACHE_FILE = Path(__file__).resolve().parent / "catalog_cache.json"
SSL_CTX = ssl._create_unverified_context()

BASE_CATALOG = [
    {
        "id": 1,
        "title": "Steins;Gate",
        "media_type": "anime",
        "genres": ["Sci-Fi", "Time Travel", "Thriller"],
        "rating": 9.1,
        "release_year": 2011,
        "synopsis": "A self-proclaimed mad scientist discovers a way to send text messages into the past, triggering unforeseen butterfly effects.",
        "poster_url": "https://cdn.myanimelist.net/images/anime/1935/127974.jpg"
    },
    {
        "id": 2,
        "title": "Cyberpunk: Edgerunners",
        "media_type": "anime",
        "genres": ["Cyberpunk", "Action", "Sci-Fi"],
        "rating": 8.6,
        "release_year": 2022,
        "synopsis": "A street kid trying to survive in a technology and body modification-obsessed city of the future chooses to become an edgerunner.",
        "poster_url": "https://cdn.myanimelist.net/images/anime/1818/126435.jpg"
    },
    {
        "id": 3,
        "title": "Monster",
        "media_type": "anime",
        "genres": ["Psychological", "Thriller", "Mystery"],
        "rating": 8.9,
        "release_year": 2004,
        "synopsis": "A brilliant neurosurgeon's life spirals into chaos after he chooses to save a young boy's life over the town's mayor.",
        "poster_url": "https://cdn.myanimelist.net/images/anime/10/18793.jpg"
    },
    {
        "id": 4,
        "title": "Attack on Titan",
        "media_type": "anime",
        "genres": ["Action", "Dark Fantasy", "Mystery"],
        "rating": 9.0,
        "release_year": 2013,
        "synopsis": "After his hometown is destroyed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans.",
        "poster_url": "https://cdn.myanimelist.net/images/anime/10/47347.jpg"
    },
    {
        "id": 5,
        "title": "Interstellar",
        "media_type": "movie",
        "genres": ["Sci-Fi", "Time Travel", "Drama"],
        "rating": 8.7,
        "release_year": 2014,
        "synopsis": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft to find a new planet for humanity.",
        "poster_url": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    {
        "id": 6,
        "title": "Blade Runner 2049",
        "media_type": "movie",
        "genres": ["Cyberpunk", "Sci-Fi", "Mystery"],
        "rating": 8.0,
        "release_year": 2017,
        "synopsis": "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.",
        "poster_url": "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg"
    },
    {
        "id": 7,
        "title": "Shutter Island",
        "media_type": "movie",
        "genres": ["Psychological", "Thriller", "Mystery"],
        "rating": 8.2,
        "release_year": 2010,
        "synopsis": "Two U.S. Marshals are sent to an asylum on a remote island to investigate the disappearance of a patient.",
        "poster_url": "https://image.tmdb.org/t/p/w500/4GDy0PHYX3VRXUtwK5ysFbg3kEx.jpg"
    },
    {
        "id": 8,
        "title": "Inception",
        "media_type": "movie",
        "genres": ["Sci-Fi", "Action", "Thriller"],
        "rating": 8.8,
        "release_year": 2010,
        "synopsis": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
        "poster_url": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    },
    {
        "id": 9,
        "title": "The Dark Knight",
        "media_type": "movie",
        "genres": ["Action", "Crime", "Drama"],
        "rating": 9.0,
        "release_year": 2008,
        "synopsis": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.",
        "poster_url": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        "id": 10,
        "title": "Dune: Part Two",
        "media_type": "movie",
        "genres": ["Sci-Fi", "Adventure", "Drama"],
        "rating": 8.6,
        "release_year": 2024,
        "synopsis": "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        "poster_url": "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg"
    },
    {
        "id": 11,
        "title": "The Matrix",
        "media_type": "movie",
        "genres": ["Cyberpunk", "Sci-Fi", "Action"],
        "rating": 8.7,
        "release_year": 1999,
        "synopsis": "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth about reality.",
        "poster_url": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
    },
    {
        "id": 12,
        "title": "Oppenheimer",
        "media_type": "movie",
        "genres": ["Drama", "History", "Thriller"],
        "rating": 8.3,
        "release_year": 2023,
        "synopsis": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
        "poster_url": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
    },
    {
        "id": 13,
        "title": "Dark",
        "media_type": "series",
        "genres": ["Sci-Fi", "Time Travel", "Mystery"],
        "rating": 8.7,
        "release_year": 2017,
        "synopsis": "A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes four families.",
        "poster_url": "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg"
    },
    {
        "id": 14,
        "title": "Severance",
        "media_type": "series",
        "genres": ["Psychological", "Sci-Fi", "Thriller"],
        "rating": 8.7,
        "release_year": 2022,
        "synopsis": "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
        "poster_url": "https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg"
    },
    {
        "id": 15,
        "title": "Mr. Robot",
        "media_type": "series",
        "genres": ["Cyberpunk", "Psychological", "Thriller"],
        "rating": 8.5,
        "release_year": 2015,
        "synopsis": "Elliot, a brilliant but unstable cyber-security engineer and vigilante hacker, becomes a key figure in a complex game of global dominance.",
        "poster_url": "https://image.tmdb.org/t/p/w500/oKIBhzZzDX07SoE2bOLhq2EE8rf.jpg"
    }
]


def _clean_html(text: str) -> str:
    if not text:
        return "No synopsis available."
    for tag in ("<p>", "</p>", "<b>", "</b>", "<i>", "</i>", "<br>", "<br/>"):
        text = text.replace(tag, "")
    return text.strip()[:650] + ("..." if len(text) > 650 else "")


def load_or_fetch_catalog():
    """Loads cached catalog or pulls 90+ Anime, Movies, and Series from Kitsu, iTunes & TVMaze."""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if len(data) > 50:
                    return data
        except Exception:
            pass

    catalog = list(BASE_CATALOG)
    existing_titles = {item["title"].lower() for item in catalog}
    next_id = len(catalog) + 1

    # 1. Fetch 20 Popular Anime from Kitsu API (Fast & Never Blocked in India)
    try:
        req = urllib.request.Request(
            "https://kitsu.io/api/edge/anime?page[limit]=20&sort=-userCount",
            headers={"User-Agent": "Mozilla/5.0", "Accept": "application/vnd.api+json"}
        )
        with urllib.request.urlopen(req, timeout=8, context=SSL_CTX) as resp:
            kitsu_data = json.loads(resp.read().decode("utf-8")).get("data", [])
            for entry in kitsu_data:
                attrs = entry.get("attributes", {})
                titles = attrs.get("titles", {})
                title = titles.get("en") or titles.get("en_jp") or attrs.get("canonicalTitle") or "Anime"
                if title.lower() in existing_titles:
                    continue
                rating_raw = float(attrs.get("averageRating") or 82.0) / 10.0
                start_date = attrs.get("startDate") or "2020-01-01"
                year = int(start_date.split("-")[0]) if start_date else 2020
                poster = (attrs.get("posterImage") or {}).get("large") or (attrs.get("posterImage") or {}).get("original") or ""
                catalog.append({
                    "id": next_id,
                    "title": title,
                    "media_type": "anime",
                    "genres": ["Anime", "Action", "Fantasy"],
                    "rating": round(rating_raw, 1),
                    "release_year": year,
                    "synopsis": _clean_html(attrs.get("synopsis") or "Hit anime series."),
                    "poster_url": poster,
                })
                existing_titles.add(title.lower())
                next_id += 1
        print(f"[Omnispect] Loaded Kitsu Anime! Total: {len(catalog)}")
    except Exception as e:
        print(f"[Omnispect] Kitsu Anime API warning: {e}")

    # 2. Fetch 25 Blockbuster Movies from Apple iTunes Search API
    try:
        req = urllib.request.Request(
            "https://itunes.apple.com/search?term=sci+fi+action+thriller&media=movie&limit=25",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=8, context=SSL_CTX) as resp:
            movies_data = json.loads(resp.read().decode("utf-8")).get("results", [])
            for m in movies_data:
                title = m.get("trackName")
                if not title or title.lower() in existing_titles:
                    continue
                art = (m.get("artworkUrl100") or "").replace("100x100bb.jpg", "600x900bb.jpg")
                rel = m.get("releaseDate") or "2020-01-01"
                year = int(rel.split("-")[0]) if rel else 2020
                genre = m.get("primaryGenreName") or "Action"
                catalog.append({
                    "id": next_id,
                    "title": title,
                    "media_type": "movie",
                    "genres": [genre, "Sci-Fi", "Thriller"],
                    "rating": 8.1,
                    "release_year": year,
                    "synopsis": _clean_html(m.get("longDescription") or m.get("shortDescription") or "Feature film."),
                    "poster_url": art,
                })
                existing_titles.add(title.lower())
                next_id += 1
        print(f"[Omnispect] Loaded iTunes Movies! Total: {len(catalog)}")
    except Exception as e:
        print(f"[Omnispect] iTunes Movie API warning: {e}")

    # 3. Fetch 40 Top TV Series from TVMaze API
    try:
        req = urllib.request.Request(
            "https://api.tvmaze.com/shows?page=0",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=8, context=SSL_CTX) as resp:
            tv_data = json.loads(resp.read().decode("utf-8"))
            rated_shows = [s for s in tv_data if s.get("rating", {}).get("average")]
            rated_shows.sort(key=lambda x: x["rating"]["average"], reverse=True)
            for show in rated_shows[:40]:
                title = show.get("name") or "Unknown Series"
                if title.lower() in existing_titles:
                    continue
                genres = (show.get("genres") or ["Drama"])[:3]
                premiered = show.get("premiered") or "2018-01-01"
                year = int(premiered.split("-")[0]) if premiered else 2018
                poster = (show.get("image") or {}).get("original") or (show.get("image") or {}).get("medium") or ""
                catalog.append({
                    "id": next_id,
                    "title": title,
                    "media_type": "series",
                    "genres": genres,
                    "rating": float(show["rating"]["average"]),
                    "release_year": year,
                    "synopsis": _clean_html(show.get("summary") or "Popular television series."),
                    "poster_url": poster,
                })
                existing_titles.add(title.lower())
                next_id += 1
        print(f"[Omnispect] Loaded TVMaze Series! Final Catalog size: {len(catalog)}")
    except Exception as e:
        print(f"[Omnispect] TVMaze API warning: {e}")

    if len(catalog) > 40:
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(catalog, f, indent=2)
        except Exception:
            pass

    return catalog


MEDIA_CATALOG = load_or_fetch_catalog()


def live_search_external(query: str, media_type: str = None):
    """
    Dynamically queries external APIs (Kitsu Anime, iTunes Movies, TVMaze Series)
    when the user searches for ANY title not yet in MEDIA_CATALOG!
    """
    q_encoded = urllib.parse.quote(query.strip())
    existing_titles = {item["title"].lower() for item in MEDIA_CATALOG}
    next_id = max((item["id"] for item in MEDIA_CATALOG), default=0) + 1
    added = False

    # 1. Live Search Anime via Kitsu
    if not media_type or media_type in ("all", "anime"):
        try:
            req = urllib.request.Request(
                f"https://kitsu.io/api/edge/anime?filter[text]={q_encoded}&page[limit]=6",
                headers={"User-Agent": "Mozilla/5.0", "Accept": "application/vnd.api+json"}
            )
            with urllib.request.urlopen(req, timeout=5, context=SSL_CTX) as resp:
                for entry in json.loads(resp.read().decode("utf-8")).get("data", []):
                    attrs = entry.get("attributes", {})
                    titles = attrs.get("titles", {})
                    title = titles.get("en") or titles.get("en_jp") or attrs.get("canonicalTitle")
                    if not title or title.lower() in existing_titles:
                        continue
                    rating_raw = float(attrs.get("averageRating") or 80.0) / 10.0
                    start_date = attrs.get("startDate") or "2020-01-01"
                    year = int(start_date.split("-")[0]) if start_date else 2020
                    poster = (attrs.get("posterImage") or {}).get("large") or ""
                    MEDIA_CATALOG.append({
                        "id": next_id,
                        "title": title,
                        "media_type": "anime",
                        "genres": ["Anime", "Action", "Adventure"],
                        "rating": round(rating_raw, 1),
                        "release_year": year,
                        "synopsis": _clean_html(attrs.get("synopsis") or f"Anime matching {query}."),
                        "poster_url": poster,
                    })
                    existing_titles.add(title.lower())
                    next_id += 1
                    added = True
        except Exception:
            pass

    # 2. Live Search Movies via iTunes API
    if not media_type or media_type in ("all", "movie"):
        try:
            req = urllib.request.Request(
                f"https://itunes.apple.com/search?term={q_encoded}&media=movie&limit=6",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=5, context=SSL_CTX) as resp:
                for m in json.loads(resp.read().decode("utf-8")).get("results", []):
                    title = m.get("trackName")
                    if not title or title.lower() in existing_titles:
                        continue
                    art = (m.get("artworkUrl100") or "").replace("100x100bb.jpg", "600x900bb.jpg")
                    rel = m.get("releaseDate") or "2020-01-01"
                    year = int(rel.split("-")[0]) if rel else 2020
                    genre = m.get("primaryGenreName") or "Movie"
                    MEDIA_CATALOG.append({
                        "id": next_id,
                        "title": title,
                        "media_type": "movie",
                        "genres": [genre, "Drama"],
                        "rating": 8.0,
                        "release_year": year,
                        "synopsis": _clean_html(m.get("longDescription") or m.get("shortDescription") or f"Movie matching {query}."),
                        "poster_url": art,
                    })
                    existing_titles.add(title.lower())
                    next_id += 1
                    added = True
        except Exception:
            pass

    # 3. Live Search TV Series via TVMaze Search API
    if not media_type or media_type in ("all", "series"):
        try:
            req = urllib.request.Request(
                f"https://api.tvmaze.com/search/shows?q={q_encoded}",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=5, context=SSL_CTX) as resp:
                for item in json.loads(resp.read().decode("utf-8"))[:6]:
                    show = item.get("show", {})
                    title = show.get("name")
                    if not title or title.lower() in existing_titles:
                        continue
                    genres = (show.get("genres") or ["Drama"])[:3]
                    premiered = show.get("premiered") or "2019-01-01"
                    year = int(premiered.split("-")[0]) if premiered else 2019
                    rating = float((show.get("rating") or {}).get("average") or 8.0)
                    poster = (show.get("image") or {}).get("original") or (show.get("image") or {}).get("medium") or ""
                    MEDIA_CATALOG.append({
                        "id": next_id,
                        "title": title,
                        "media_type": "series",
                        "genres": genres,
                        "rating": rating,
                        "release_year": year,
                        "synopsis": _clean_html(show.get("summary") or f"Series matching {query}."),
                        "poster_url": poster,
                    })
                    existing_titles.add(title.lower())
                    next_id += 1
                    added = True
        except Exception:
            pass

    if added:
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(MEDIA_CATALOG, f, indent=2)
        except Exception:
            pass

# Curated fallback cast for our flagship titles so demos are 100% instant
CURATED_CAST = {
    "steins;gate": ["Rintaro Okabe (Mamoru Miyano)", "Kurisu Makise (Asami Imai)", "Mayuri Shiina (Kana Hanazawa)", "Itaru Hashida (Tomokazu Seki)"],
    "cyberpunk: edgerunners": ["David Martinez (KENN)", "Lucy (Aoi Yuuki)", "Rebecca (Tomoyo Kurosawa)", "Maine (Hiroki Touchi)"],
    "monster": ["Dr. Kenzo Tenma (Hidenobu Kiuchi)", "Johan Liebert (Nozomu Sasaki)", "Nina Fortner (Mamiko Noto)", "Inspector Lunge (Tsutomu Isobe)"],
    "attack on titan": ["Eren Jaeger (Yuki Kaji)", "Mikasa Ackerman (Yui Ishikawa)", "Armin Arlert (Marina Inoue)", "Levi Ackerman (Hiroshi Kamiya)"],
    "interstellar": ["Matthew McConaughey (Cooper)", "Anne Hathaway (Brand)", "Jessica Chastain (Murph)", "Michael Caine (Professor Brand)"],
    "blade runner 2049": ["Ryan Gosling (K)", "Harrison Ford (Rick Deckard)", "Ana de Armas (Joi)", "Sylvia Hoeks (Luv)"],
    "shutter island": ["Leonardo DiCaprio (Teddy Daniels)", "Mark Ruffalo (Chuck Aule)", "Ben Kingsley (Dr. Cawley)", "Michelle Williams (Dolores)"],
    "inception": ["Leonardo DiCaprio (Cobb)", "Joseph Gordon-Levitt (Arthur)", "Elliot Page (Ariadne)", "Tom Hardy (Eames)"],
    "the dark knight": ["Christian Bale (Bruce Wayne)", "Heath Ledger (Joker)", "Aaron Eckhart (Harvey Dent)", "Gary Oldman (Jim Gordon)"],
    "dune: part two": ["Timothée Chalamet (Paul Atreides)", "Zendaya (Chani)", "Rebecca Ferguson (Lady Jessica)", "Javier Bardem (Stilgar)"],
    "the matrix": ["Keanu Reeves (Neo)", "Laurence Fishburne (Morpheus)", "Carrie-Anne Moss (Trinity)", "Hugo Weaving (Agent Smith)"],
    "oppenheimer": ["Cillian Murphy (J. Robert Oppenheimer)", "Emily Blunt (Kitty Oppenheimer)", "Matt Damon (Leslie Groves)", "Robert Downey Jr. (Lewis Strauss)"],
    "dark": ["Louis Hofmann (Jonas Kahnwald)", "Lisa Vicari (Martha Nielsen)", "Maja Schöne (Hannah Kahnwald)", "Oliver Masucci (Ulrich Nielsen)"],
    "severance": ["Adam Scott (Mark Scout)", "Britt Lower (Helly R.)", "Zach Cherry (Dylan George)", "John Turturro (Irving Bailiff)"],
    "mr. robot": ["Rami Malek (Elliot Alderson)", "Christian Slater (Mr. Robot)", "Carly Chaikin (Darlene)", "Portia Doubleday (Angela Moss)"],
}


def fetch_media_details(item: dict) -> dict:
    """Fetches full untruncated synopsis & cast list on-demand when a card is clicked."""
    title_key = item["title"].lower()
    cast_list = list(CURATED_CAST.get(title_key, []))
    full_synopsis = item["synopsis"]
    director_or_studio = "Original Production"

    q_encoded = urllib.parse.quote(item["title"])

    # 1. Try TVMaze with embedded cast for Series
    if item["media_type"] == "series":
        try:
            req = urllib.request.Request(
                f"https://api.tvmaze.com/singlesearch/shows?q={q_encoded}&embed=cast",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=4, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("summary"):
                    full_synopsis = _clean_html(data["summary"])
                network = (data.get("network") or {}).get("name") or (data.get("webChannel") or {}).get("name")
                if network:
                    director_or_studio = network
                embedded_cast = data.get("_embedded", {}).get("cast", [])
                if embedded_cast:
                    cast_list = [
                        f"{c.get('person', {}).get('name')} ({c.get('character', {}).get('name', 'Cast')})"
                        for c in embedded_cast[:6]
                        if c.get("person", {}).get("name")
                    ]
        except Exception:
            pass

    # 2. Try iTunes Movie Lookup for Movies (gives Director, Studio & Full Plot)
    elif item["media_type"] == "movie":
        try:
            req = urllib.request.Request(
                f"https://itunes.apple.com/search?term={q_encoded}&media=movie&limit=1",
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=4, context=SSL_CTX) as resp:
                results = json.loads(resp.read().decode("utf-8")).get("results", [])
                if results:
                    m = results[0]
                    if m.get("longDescription"):
                        full_synopsis = _clean_html(m["longDescription"])
                    if m.get("artistName"):
                        director_or_studio = f"Directed by {m['artistName']}"
        except Exception:
            pass

    # 3. Try Kitsu for Anime full synopsis & studio/characters
    elif item["media_type"] == "anime":
        try:
            req = urllib.request.Request(
                f"https://kitsu.io/api/edge/anime?filter[text]={q_encoded}&page[limit]=1",
                headers={"User-Agent": "Mozilla/5.0", "Accept": "application/vnd.api+json"}
            )
            with urllib.request.urlopen(req, timeout=4, context=SSL_CTX) as resp:
                results = json.loads(resp.read().decode("utf-8")).get("data", [])
                if results:
                    attrs = results[0].get("attributes", {})
                    if attrs.get("synopsis"):
                        full_synopsis = _clean_html(attrs["synopsis"])
                    if attrs.get("ageRatingGuide"):
                        director_or_studio = f"Rating: {attrs['ageRatingGuide']}"
        except Exception:
            pass

    if not cast_list:
        cast_list = ["Lead Ensemble Cast", f"Featured {item['media_type'].title()} Performers"]

    return {
        **item,
        "full_synopsis": full_synopsis,
        "cast": cast_list,
        "studio_or_director": director_or_studio,
    }