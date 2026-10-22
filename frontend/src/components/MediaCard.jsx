import React from 'react';
import { Star, Plus, Check, BookmarkCheck, Film, Tv, Sparkles, Wand2 } from 'lucide-react';

const TYPE_CONFIG = {
  anime: { label: 'Anime', icon: Sparkles, badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  movie: { label: 'Movie', icon: Film, badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  series: { label: 'Series', icon: Tv, badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export default function MediaCard({
  item,
  isWatchlisted = false,
  isCompleted = false,
  onToggleWatchlist,
  onToggleCompleted,
  onSelectRecommend,
  onSelectDetails,
  similarityScore = null,
  sharedGenres = null,
}) {
  const typeInfo = TYPE_CONFIG[item.media_type] || TYPE_CONFIG.movie;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="group relative bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-slate-700 transition-all duration-300 flex flex-col h-full">
      {/* Poster Container - Clickable for Full Details */}
      <div
        onClick={() => onSelectDetails?.(item)}
        className="relative aspect-2/3 w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        <img
          src={item.poster_url}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x600/1e293b/94a3b8?text=Omnispect';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${typeInfo.badgeBg}`}>
            <TypeIcon className="w-3.5 h-3.5" />
            {typeInfo.label}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-slate-950/80 text-amber-400 border border-slate-800 backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {Number(item.rating).toFixed(1)}
          </span>
        </div>

        {/* Optional ML Similarity Match Badge */}
        {similarityScore !== null && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-500/90 text-slate-950 font-bold text-[11px] shadow">
            {Math.round(similarityScore * 100)}% Match
          </div>
        )}

        {/* Release Year overlay */}
        <span className="absolute bottom-2 left-3 text-xs font-medium text-slate-300">
          {item.release_year}
        </span>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3
            onClick={() => onSelectDetails?.(item)}
            className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {item.title}
          </h3>
          <p
            onClick={() => onSelectDetails?.(item)}
            className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed cursor-pointer hover:text-slate-300"
          >
            {item.synopsis}
          </p>

          {/* Genre / ML Feature Tags */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            {(sharedGenres || item.genres)?.slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-[10px] font-medium rounded border ${
                  sharedGenres
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/50'
                }`}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleWatchlist?.(item.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isWatchlisted
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                  : 'bg-indigo-600/15 text-indigo-300 hover:bg-indigo-600 hover:text-white border-indigo-500/30'
              }`}
            >
              {isWatchlisted ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Watchlist
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleCompleted?.(item.id)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white border-slate-700 hover:border-emerald-500/40'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {isCompleted ? 'Done' : 'Complete'}
            </button>
          </div>

          {onSelectRecommend && (
            <button
              type="button"
              onClick={() => onSelectRecommend(item)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-950 text-purple-300 hover:bg-purple-600/20 border border-purple-500/30 transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              Find Similar Media
            </button>
          )}
        </div>
      </div>
    </div>
  );
}