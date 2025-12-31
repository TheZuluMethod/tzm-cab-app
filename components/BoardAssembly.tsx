import React, { useMemo } from 'react';
import { BoardMember } from '../types';
import { User, Shield, Zap, BarChart2, Play, RefreshCw } from 'lucide-react';

interface BoardAssemblyProps {
  members: BoardMember[];
  onStartSession: () => void;
  onRegenerateMember: (id: string) => void;
  isLoading: boolean;
  isRegeneratingMemberId: string | null;
  newlySwappedMemberId: string | null;
}

const BoardAssembly: React.FC<BoardAssemblyProps> = React.memo(({ 
  members, 
  onStartSession, 
  onRegenerateMember,
  isLoading,
  isRegeneratingMemberId,
  newlySwappedMemberId
}) => {
  
  // Memoize color arrays to avoid recreating on every render
  const avatarColors = useMemo(() => [
    'from-[#A1B4FF] to-[#577AFF]',
    'from-[#D5DDFF] to-[#31458F]',
    'from-[#EEF2FF] to-[#051A53]',
    'from-[#577AFF] to-[#31458F]',
    'from-[#A1B4FF] to-[#051A53]',
    'from-[#D5DDFF] to-[#577AFF]',
    'from-[#EEF2FF] to-[#A1B4FF]',
  ], []);

  const footerColors = useMemo(() => [
    'bg-[#EEF2FF] border-[#D5DDFF] text-[#577AFF]',
    'bg-[#D5DDFF] border-[#A1B4FF] text-[#31458F]',
    'bg-[#A1B4FF] border-[#577AFF] text-[#051A53]',
    'bg-[#EEF2FF] border-[#577AFF] text-[#31458F]',
    'bg-[#D5DDFF] border-[#31458F] text-[#051A53]',
    'bg-[#A1B4FF] border-[#D5DDFF] text-[#31458F]',
    'bg-[#EEF2FF] border-[#A1B4FF] text-[#577AFF]',
  ], []);

  const cardBgColors = useMemo(() => [
    'bg-purple-50',
    'bg-emerald-50',
    'bg-amber-50',
    'bg-rose-50',
    'bg-teal-50',
    'bg-indigo-50',
    'bg-pink-50',
    'bg-cyan-50',
    'bg-orange-50',
    'bg-violet-50',
  ], []);

  const getIconForArchetype = (archetype: string) => {
    const lower = archetype.toLowerCase();
    if (lower.includes('skeptic') || lower.includes('critic')) return <Shield className="w-4 h-4 text-[#595657]" />;
    if (lower.includes('visionary') || lower.includes('innovator')) return <Zap className="w-4 h-4 text-[#A1B4FF]" />;
    if (lower.includes('data') || lower.includes('analyst')) return <BarChart2 className="w-4 h-4 text-[#577AFF]" />;
    return <User className="w-4 h-4 text-[#577AFF]" />;
  };

  // Helper to get color class for avatar and footer - using palette colors only
  const getColorClass = (name: string) => {
    return avatarColors[name.length % avatarColors.length];
  };

  // Helper to get raw hex/tailwind color for footer background to match avatar roughly
  // Using palette colors only - making colors more distinct
  const getFooterColorClass = (name: string) => {
    const idx = name.length % footerColors.length;
    return footerColors[idx];
  };

  // Helper to get distinct card background colors - using varied colors beyond just blues
  const getCardBgClass = (name: string) => {
    const idx = name.length % cardBgColors.length;
    return cardBgColors[idx];
  };

  const getAvatar = (member: BoardMember, colorClass: string) => {
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-lg font-bold shadow-md border-2 border-white ring-1 ring-[#EEF2FF]`}>
            {initials}
        </div>
    );
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-[49px] md:px-[57px] py-4 md:py-6 animate-in fade-in duration-700">
      <div className="flex flex-col justify-center items-center mb-10 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-[#221E1F] dark:text-[#f3f4f6] mb-3">Your Advisory Board is Assembled!</h2>
        <p className="text-[#595657] dark:text-[#9ca3af] text-base md:text-lg max-w-2xl mb-8">
          Review your cohort below, swap out anyone you don't like.
        </p>
        
        <button
          onClick={onStartSession}
          disabled={isLoading || !!isRegeneratingMemberId}
          className={`bg-green-500 dark:bg-green-500 hover:bg-green-600 dark:hover:bg-green-600 text-white w-full md:w-auto px-6 py-3 md:px-10 md:py-4 rounded-xl font-bold text-lg md:text-xl shadow-lg dark:shadow-[0_0_30px_rgba(34,197,94,0.5)] shadow-green-200 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 transform active:scale-95
             ${(isLoading || !!isRegeneratingMemberId) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
           {isLoading ? (
             <>
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Session...
             </>
           ) : (
             <>
               <Play className="w-6 h-6 fill-current" />
               Start Board Session
             </>
           )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {members.map((member, idx) => {
          const isNewlySwapped = member.id === newlySwappedMemberId;
          const footerClass = getFooterColorClass(member.name);
          const avatarColor = getColorClass(member.name);
          const cardBgClass = getCardBgClass(member.name);
          
          return (
            <div 
                key={member.id || idx} 
                className={`${cardBgClass} dark:bg-[#1a1f2e] rounded-xl border shadow-sm dark:shadow-[0_0_15px_rgba(87,122,255,0.2)] hover:shadow-xl dark:hover:shadow-[0_0_25px_rgba(87,122,255,0.3)] transition-all duration-500 group relative overflow-hidden flex flex-col h-full
                    ${isNewlySwapped 
                        ? 'border-green-400 dark:border-green-500 ring-4 ring-green-300 dark:ring-green-500/50' 
                        : 'border-[#EEF2FF] dark:border-[#374151] hover:border-[#577AFF] dark:hover:border-[#577AFF]'
                    }
                `}
                style={isNewlySwapped ? {
                    animation: 'glow 3s ease-in-out',
                } : {}}
            >
                {/* Card Number */}
                <div className="absolute top-3 left-3 text-[10px] font-black text-[#D5DDFF] dark:text-[#9ca3af] z-0 select-none">
                    #{idx + 1}
                </div>

                {/* Swap Button */}
                <div className={`absolute top-2 right-2 z-10 transition-opacity ${
                  isRegeneratingMemberId === member.id 
                    ? 'opacity-100' 
                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                }`}>
                    <div className="group/tooltip relative">
                        <button 
                            onClick={() => onRegenerateMember(member.id)}
                            disabled={!!isRegeneratingMemberId}
                            className="p-2 bg-white dark:bg-[#111827] text-[#595657] dark:text-[#9ca3af] hover:text-[#31458F] dark:hover:text-[#A1B4FF] rounded-full shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] border border-[#EEF2FF] dark:border-[#374151] hover:bg-[#EEF2FF] dark:hover:bg-[#1a1f2e] transition-colors"
                        >
                            {isRegeneratingMemberId === member.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-[#577AFF] dark:text-[#577AFF]" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                        {/* Updated Tooltip Styles - Light accent color and moved 25px closer to center */}
                        <span className="absolute left-[calc(50%-25px)] -translate-x-1/2 top-full mt-1 w-24 bg-[#D5DDFF] dark:bg-[#1a1f2e] text-[#31458F] dark:text-[#A1B4FF] border border-[#A1B4FF] dark:border-[#577AFF] shadow-md dark:shadow-[0_0_15px_rgba(87,122,255,0.3)] text-[10px] font-semibold py-1.5 px-2 rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity text-center pointer-events-none z-20 hidden md:block">
                            Swap me
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-col items-center text-center pt-6 px-4 pb-4">
                    <div className="mb-4 relative">
                        {getAvatar(member, avatarColor || 'from-[#577AFF] to-[#31458F]')}
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#111827] rounded-full p-1.5 shadow-sm dark:shadow-[0_0_10px_rgba(87,122,255,0.2)] border border-[#EEF2FF] dark:border-[#374151]">
                            {getIconForArchetype(member.personalityArchetype)}
                        </div>
                    </div>
                    
                    {/* Swapped Title/Name hierarchy */}
                    <h3 className="text-[#577AFF] dark:text-[#A1B4FF] font-black text-sm uppercase tracking-tight leading-tight mb-1 h-8 flex items-end justify-center w-full">
                        {member.role}
                    </h3>
                    <p className="text-[#221E1F] dark:text-[#f3f4f6] font-bold text-lg leading-tight mb-2">{member.name}</p>
                    
                    <span className="text-[10px] uppercase tracking-wider text-[#595657] dark:text-[#9ca3af] font-bold border border-[#EEF2FF] dark:border-[#374151] px-2 py-0.5 rounded-full bg-[#F9FAFD] dark:bg-[#0a0e1a]">
                        {member.companyType}
                    </span>
                </div>
                
                <div className="px-5 pb-4 flex-grow">
                    <p className="text-[10px] text-[#A1B4FF] dark:text-[#A1B4FF] uppercase tracking-wider mb-1 font-semibold">Expertise</p>
                    <p className="text-xs text-[#595657] dark:text-[#d1d5db] leading-relaxed line-clamp-3">{member.expertise}</p>
                </div>

                {/* Footer with matching color */}
                <div className={`mt-auto py-3 px-4 border-t dark:border-[#374151] ${footerClass}`}>
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold opacity-70 dark:opacity-60">Archetype</span>
                        <span className="text-sm font-bold leading-tight break-words dark:text-[#f3f4f6]">{member.personalityArchetype}</span>
                    </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

BoardAssembly.displayName = 'BoardAssembly';

export default BoardAssembly;