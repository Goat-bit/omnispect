import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Compass,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Menu,
  X,
  Flame,
  Sparkles,
  Film,
  Tv,
  Wand2,
  ShieldCheck,
  Leaf,
} from 'lucide-react';
import MediaCard from './components/MediaCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FILTER_TABS = [
  { id: 'all', label: 'All Media' },
  { id: 'anime', label: 'Anime' },
  { id: 'movie', label: 'Movies' },
  { id: 'series', label: 'TV Series' },
];

const DEFAULT_MATURE_GENRES = ['horror', 'thriller', 'crime', 'psychological', 'dark', 'gore', 'adult'];

export default function App() {
  // Navigation Drawer & Active View ('discover' | 'watchlist' | 'completed')
  const [activeView, setActiveView] = useState('discover');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Catalog & Search/Filter states
  const [mediaList, setMediaList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persistent User Lists
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);

  // =========================================================================
  // SDG 13: Eco-Stream Carbon Footprint Tracker State (Climate Action)
  // =========================================================================
  const [streamQuality, setStreamQuality] = useState('1080p');

  const emissionRates = {
    '4K': 90,
    '1080p': 55,
    '720p': 25,
  };

  const safeCompleted = Array.isArray(completedItems) ? completedItems : [];

  const totalHoursWatched = safeCompleted.reduce((acc, item) => {
    const hours = item?.media_type === 'movie' ? 2 : 4;
    return acc + hours;
  }, 0);

  const totalCo2Grams = totalHoursWatched * (emissionRates[streamQuality] || 55);
  const co2SavedGrams =
    totalHoursWatched * (emissionRates['4K'] - (emissionRates[streamQuality] || 55));

  // =========================================================================
  // SDG 3: Family Safe Mode State (Good Health & Digital Well-Being)
  // =========================================================================
  const [safeMode, setSafeMode] = useState(false);
  const [strictnessLevel, setStrictnessLevel] = useState('standard'); // 'standard' | 'strict'

  // Helper to check if an item should be hidden under Family Safe Mode
  const isItemFamilySafe = useCallback(
    (item) => {
      if (!safeMode) return true;
      const genres = (item?.genres || []).map((g) => String(g).toLowerCase());
      const synopsis = String(item?.synopsis || '').toLowerCase();
      const title = String(item?.title || '').toLowerCase();

      // Standard blocks Horror, Thriller, Crime, Psychological, etc.
      const blockedKeywords =
        strictnessLevel === 'strict'
          ? [...DEFAULT_MATURE_GENRES, 'action', 'cyberpunk', 'mystery', 'violence', 'murder', 'blood']
          : DEFAULT_MATURE_GENRES;

      const hasMatureGenre = genres.some((g) =>
        blockedKeywords.some((keyword) => g.includes(keyword))
      );
      const hasMatureText = blockedKeywords.some(
        (keyword) => synopsis.includes(keyword) || title.includes(keyword)
      );

      return !(hasMatureGenre || hasMatureText);
    },
    [safeMode, strictnessLevel]
  );

  // Filtered media list after applying Family Safe Mode
  const visibleMediaList = useMemo(() => {
    return mediaList.filter(isItemFamilySafe);
  }, [mediaList, isItemFamilySafe]);

  const hiddenMatureCount = mediaList.length - visibleMediaList.length;

  // Recommendation Modal State
  const [recSource, setRecSource] = useState(null);
  const [recList, setRecList] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Media Details & Cast Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch user's saved Watchlist & Completed lists
  const fetchUserLists = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/lists`);
      if (res.ok) {
        const data = await res.json();
        setWatchlistIds(data.watchlist_ids || []);
        setCompletedIds(data.completed_ids || []);
        setWatchlistItems(data.watchlist || []);
        setCompletedItems(data.completed || []);
      }
    } catch (err) {
      console.error('Failed to load user lists:', err);
    }
  }, []);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists]);

  // Toggle Watchlist handler
  const handleToggleWatchlist = async (mediaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id: mediaId }),
      });
      if (res.ok) await fetchUserLists();
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  // Toggle Completed handler
  const handleToggleCompleted = async (mediaId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_id: mediaId }),
      });
      if (res.ok) await fetchUserLists();
    } catch (err) {
      console.error('Error toggling completed:', err);
    }
  };

  // Fetch ML-ready recommendations for a selected item
  const handleOpenRecommendations = async (item) => {
    setRecSource(item);
    setRecLoading(true);
    setRecList([]);
    try {
      const res = await fetch(`${API_BASE_URL}/api/recommendations?media_id=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setRecList(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  // Fetch rich synopsis & cast details on card click
  const handleOpenDetails = async (item) => {
    setSelectedDetailItem({ ...item, full_synopsis: item.synopsis, cast: [] });
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/media/${item.id}/details`);
      if (res.ok) {
        const richData = await res.json();
        setSelectedDetailItem(richData);
      }
    } catch (err) {
      console.error('Failed to load rich details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch catalog items
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMedia() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (selectedType !== 'all') params.append('media_type', selectedType);

        const response = await fetch(`${API_BASE_URL}/api/media?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        setMediaList(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Backend not running! Make sure FastAPI is active on port 8000.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const debounceTimer = setTimeout(fetchMedia, 200);
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [searchQuery, selectedType]);

  // Organize into Netflix-style sections when viewing unfiltered Discover feed
  const isDefaultDiscover =
    activeView === 'discover' && !searchQuery.trim() && selectedType === 'all';

  const sections = useMemo(() => {
    if (!visibleMediaList.length) return [];
    const topRated = [...visibleMediaList].sort((a, b) => b.rating - a.rating).slice(0, 8);
    const animeRow = visibleMediaList.filter((i) => i.media_type === 'anime');
    const movieRow = visibleMediaList.filter((i) => i.media_type === 'movie');
    const seriesRow = visibleMediaList.filter((i) => i.media_type === 'series');

    return [
      { id: 'top', title: 'Top Rated Across All Media', icon: Flame, color: 'text-amber-400', items: topRated },
      { id: 'anime', title: 'Trending Anime', icon: Sparkles, color: 'text-purple-400', items: animeRow },
      { id: 'movies', title: 'Blockbuster Movies', icon: Film, color: 'text-blue-400', items: movieRow },
      { id: 'series', title: 'Binge-Worthy TV Series', icon: Tv, color: 'text-emerald-400', items: seriesRow },
    ].filter((sec) => sec.items.length > 0);
  }, [visibleMediaList]);

  const switchView = (view) => {
    setActiveView(view);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => switchView('discover')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  OMNISPECT
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 text-indigo-400 border border-slate-800 rounded">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          {/* Quick View Pills on Desktop */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSafeMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border ${
                safeMode
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
              title="Toggle Family Safe Content Filter (SDG 3)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {safeMode ? 'Safe Mode: ON' : 'Safe Mode'}
              </span>
            </button>

            <button
              onClick={() => switchView('discover')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'discover'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => switchView('watchlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'watchlist'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-indigo-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Watchlist</span>
              <strong className="px-1.5 py-0.2 bg-slate-950/60 rounded text-white">
                {watchlistIds.length}
              </strong>
            </button>
            <button
              onClick={() => switchView('completed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeView === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-emerald-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Completed</span>
              <strong className="px-1.5 py-0.2 bg-slate-950/60 rounded text-white">
                {completedIds.length}
              </strong>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Out Hamburger Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-6 flex flex-col justify-between z-10 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  OMNISPECT MENU
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-2">
                <button
                  onClick={() => switchView('discover')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    activeView === 'discover'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Compass className="w-4 h-4" />
                    Discover Catalog
                  </span>
                  <span className="text-xs opacity-75">{visibleMediaList.length}</span>
                </button>

                <button
                  onClick={() => switchView('watchlist')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    activeView === 'watchlist'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-indigo-400" />
                    My Watchlist
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-indigo-300">
                    {watchlistIds.length}
                  </span>
                </button>

                <button
                  onClick={() => switchView('completed')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    activeView === 'completed'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Completed Media
                  </span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-emerald-300">
                    {completedIds.length}
                  </span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              <p className="font-semibold text-slate-400">Omnispect DevOps Pipeline</p>
              <p className="mt-0.5">FastAPI + React + SQLite + Docker</p>
            </div>
          </aside>
        </div>
      )}

      {/* Dual SDG Impact Control Banner (SDG 13 + SDG 3) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PANEL 1: SDG 13 Eco-Stream Carbon Footprint Tracker */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-white font-bold text-sm">Eco-Stream Carbon Tracker</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    SDG 13 · Climate Action
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Completed: <strong className="text-slate-200">{safeCompleted.length}</strong> titles (~{totalHoursWatched} hrs streamed)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <label className="text-[11px] text-slate-400">Quality:</label>
                <select
                  value={streamQuality}
                  onChange={(e) => setStreamQuality(e.target.value)}
                  className="bg-slate-900 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/40 focus:outline-none cursor-pointer"
                >
                  <option value="4K">4K (90g/hr)</option>
                  <option value="1080p">1080p (55g/hr)</option>
                  <option value="720p">720p Eco (25g/hr)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <div>
                  <span className="text-[9px] uppercase text-slate-400 block">Footprint</span>
                  <span className="text-xs font-extrabold text-white">
                    {totalCo2Grams >= 1000
                      ? `${(totalCo2Grams / 1000).toFixed(2)} kg`
                      : `${totalCo2Grams} g`}{' '}
                    CO₂
                  </span>
                </div>
                {co2SavedGrams > 0 && (
                  <div className="pl-2.5 border-l border-slate-800">
                    <span className="text-[9px] uppercase text-emerald-400 block">Saved vs 4K</span>
                    <span className="text-xs font-extrabold text-emerald-400">
                      -{co2SavedGrams}g
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PANEL 2: SDG 3 Family Safe Content Filter */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-sky-950/70 via-slate-900 to-slate-900 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-white font-bold text-sm">Family Safe Content Filter</h3>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                    SDG 3 · Digital Well-Being
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  {safeMode
                    ? `Active: Shielding ${hiddenMatureCount} mature/violent titles from feed.`
                    : 'Filters out Horror, Thriller, Crime & mature-rated titles for younger viewers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <label className="text-[11px] text-slate-400">Level:</label>
                <select
                  value={strictnessLevel}
                  onChange={(e) => setStrictnessLevel(e.target.value)}
                  className="bg-slate-900 text-sky-400 text-xs font-bold px-2 py-0.5 rounded border border-sky-500/40 focus:outline-none cursor-pointer"
                >
                  <option value="standard">PG-13 (Standard)</option>
                  <option value="strict">Kids (Strict)</option>
                </select>
              </div>

              <button
                onClick={() => setSafeMode((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  safeMode
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/25'
                    : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                }`}
              >
                {safeMode ? 'Shield Active ✓' : 'Enable Safe Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: DISCOVER */}
        {activeView === 'discover' && (
          <>
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/60 border border-slate-800/90 p-4 rounded-2xl mb-8">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, synopses, or genres (e.g., Cyberpunk, Sci-Fi, Thriller)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {FILTER_TABS.map((tab) => {
                  const active = selectedType === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedType(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm">Loading Omnispect catalog...</p>
              </div>
            ) : error ? (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-amber-200">Backend Connection Needed</h3>
                <p className="text-xs text-amber-300/80 mt-1">{error}</p>
              </div>
            ) : isDefaultDiscover ? (
              /* NETFLIX-STYLE SECTIONED VIEW */
              <div className="space-y-12">
                {sections.map((section) => {
                  const SectionIcon = section.icon;
                  return (
                    <section key={section.id} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <SectionIcon className={`w-5 h-5 ${section.color}`} />
                          <h2 className="text-lg font-bold text-white tracking-tight">
                            {section.title}
                          </h2>
                        </div>
                        <span className="text-xs text-slate-500">
                          {section.items.length} titles
                        </span>
                      </div>

                      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x">
                        {section.items.map((item) => (
                          <div
                            key={`${section.id}-${item.id}`}
                            className="w-60 sm:w-64 shrink-0 snap-start"
                          >
                            <MediaCard
                              item={item}
                              isWatchlisted={watchlistIds.includes(item.id)}
                              isCompleted={completedIds.includes(item.id)}
                              onToggleWatchlist={handleToggleWatchlist}
                              onToggleCompleted={handleToggleCompleted}
                              onSelectRecommend={handleOpenRecommendations}
                              onSelectDetails={handleOpenDetails}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : visibleMediaList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">
                  No media matched your filter criteria {safeMode ? '(or was hidden by Family Safe Mode)' : ''}.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSafeMode(false);
                  }}
                  className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              /* FILTERED / SEARCH GRID VIEW */
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-xs font-medium text-slate-400">
                    Filtered Results: <strong className="text-slate-200">{visibleMediaList.length}</strong> titles
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedType('all');
                    }}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Back to Curated Rows
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {visibleMediaList.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      isWatchlisted={watchlistIds.includes(item.id)}
                      isCompleted={completedIds.includes(item.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onToggleCompleted={handleToggleCompleted}
                      onSelectRecommend={handleOpenRecommendations}
                      onSelectDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* VIEW 2: WATCHLIST */}
        {activeView === 'watchlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <Bookmark className="w-6 h-6 text-indigo-400" /> My Watchlist
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Saved in SQLite (`omnispect.db`) — persists across container restarts.
                </p>
              </div>
              <button
                onClick={() => switchView('discover')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              >
                + Browse More Media
              </button>
            </div>

            {watchlistItems.filter(isItemFamilySafe).length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">Your Watchlist is currently empty.</p>
                <button
                  onClick={() => switchView('discover')}
                  className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer"
                >
                  Explore Discover catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {watchlistItems.filter(isItemFamilySafe).map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    isWatchlisted={true}
                    isCompleted={completedIds.includes(item.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleCompleted={handleToggleCompleted}
                    onSelectRecommend={handleOpenRecommendations}
                    onSelectDetails={handleOpenDetails}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: COMPLETED */}
        {activeView === 'completed' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Completed Media
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Titles you have finished watching. Each title updates your Eco-Stream Carbon Tracker above!
                </p>
              </div>
              <button
                onClick={() => switchView('discover')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              >
                Back to Discover
              </button>
            </div>

            {completedItems.filter(isItemFamilySafe).length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">You haven't marked any titles as completed yet.</p>
                <button
                  onClick={() => switchView('discover')}
                  className="mt-3 text-xs text-indigo-400 hover:underline cursor-pointer"
                >
                  Explore Discover catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {completedItems.filter(isItemFamilySafe).map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    isWatchlisted={watchlistIds.includes(item.id)}
                    isCompleted={true}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleCompleted={handleToggleCompleted}
                    onSelectRecommend={handleOpenRecommendations}
                    onSelectDetails={handleOpenDetails}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI/ML Recommendations Modal */}
      {recSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setRecSource(null)}
          />
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                  <Wand2 className="w-4 h-4" /> Content-Based Similarity Engine (Jaccard Feature Overlap)
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Because you liked <span className="text-indigo-400">{recSource.title}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Source features: {recSource.genres?.join(', ')}
                </p>
              </div>
              <button
                onClick={() => setRecSource(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-purple-500 mb-2" />
                <p className="text-xs">Computing similarity scores across Anime, Movies & Series...</p>
              </div>
            ) : recList.filter((r) => isItemFamilySafe(r.item)).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                No similar titles found.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {recList
                  .filter((r) => isItemFamilySafe(r.item))
                  .map((rec) => (
                    <MediaCard
                      key={rec.item.id}
                      item={rec.item}
                      isWatchlisted={watchlistIds.includes(rec.item.id)}
                      isCompleted={completedIds.includes(rec.item.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onToggleCompleted={handleToggleCompleted}
                      onSelectRecommend={handleOpenRecommendations}
                      onSelectDetails={(clicked) => {
                        setRecSource(null);
                        handleOpenDetails(clicked);
                      }}
                      similarityScore={rec.similarity_score}
                      sharedGenres={rec.shared_genres}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Media Details & Cast Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setSelectedDetailItem(null)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col sm:flex-row max-h-[90vh]">
            <img
              src={selectedDetailItem.poster_url}
              alt={selectedDetailItem.title}
              className="w-full sm:w-64 object-cover bg-slate-950 shrink-0 max-h-72 sm:max-h-none"
            />
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {selectedDetailItem.media_type} • {selectedDetailItem.release_year} • ⭐{' '}
                    {selectedDetailItem.rating}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white mt-1">
                    {selectedDetailItem.title}
                  </h2>
                  {selectedDetailItem.studio_or_director && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedDetailItem.studio_or_director}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5">
                {selectedDetailItem.genres?.map((g, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-slate-200 rounded-full border border-slate-700"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Full Synopsis */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Synopsis
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedDetailItem.full_synopsis || selectedDetailItem.synopsis}
                </p>
              </div>

              {/* Cast & Characters */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cast & Characters
                </h4>
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    Fetching cast & production details...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedDetailItem.cast?.map((actor, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium"
                      >
                        {actor}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions inside Modal */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  onClick={() => handleToggleWatchlist(selectedDetailItem.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  {watchlistIds.includes(selectedDetailItem.id)
                    ? 'Saved in Watchlist ✓'
                    : '+ Add to Watchlist'}
                </button>
                <button
                  onClick={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    handleOpenRecommendations(item);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Find Similar Media
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}