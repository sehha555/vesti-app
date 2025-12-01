import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Camera, Sparkles, ChevronRight, MessageCircle, ArrowRight, Heart, Share2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { QuizModal } from './QuizModal';

interface TrendCard {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  tags?: string[];
  author?: string;
}

interface VoteOption {
  id: number;
  imageUrl: string;
  votes: number;
}

interface DailyVote {
  id: number;
  question: string;
  optionA: VoteOption;
  optionB: VoteOption;
}

const trendData: TrendCard[] = [
  {
    id: 1,
    title: '多巴胺穿搭指南',
    subtitle: '色彩鮮豔、愉悅心情的時尚新法則',
    imageUrl: 'https://images.unsplash.com/photo-1731275668160-f18f97c6faac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMGZhYnJpYyUyMHRleHR1cmV8ZW58MXx8fHwxNzYyNTc5MDQwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['編輯精選', '色彩學'],
    author: 'Vesti Fashion Team'
  },
  {
    id: 2,
    title: '都市極簡美學',
    subtitle: 'Less is More：打造高級質感的衣櫥',
    imageUrl: 'https://images.unsplash.com/photo-1635865933730-e5817b5680cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwb3V0Zml0JTIwYWVzdGhldGljfGVufDF8fHx8MTc2MjY2MzkzMHww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['穿搭技巧', '極簡'],
    author: 'Sarah J.'
  },
  {
    id: 3,
    title: '復古運動風潮',
    subtitle: '重返 90 年代：經典單品的現代演繹',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHw5MHMlMjBmYXNoaW9ufGVufDF8fHx8MTY5NjQ4OTI4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['趨勢', '復古'],
    author: 'Mike Chen'
  }
];

const dailyVotes: DailyVote[] = [
  {
    id: 1,
    question: '今晚穿什麼？',
    optionA: {
      id: 1,
      imageUrl: 'https://images.unsplash.com/photo-1696489283182-0446be970e40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwcG9ydHJhaXQlMjB3b21hbnxlbnwxfHx8fDE3NjI2NjAyMzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      votes: 124,
    },
    optionB: {
      id: 2,
      imageUrl: 'https://images.unsplash.com/photo-1632693217835-b482d9ca9ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBzdHlsZSUyMGZhc2hpb258ZW58MXx8fHwxNzYyNTgzMDUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      votes: 89,
    },
  },
];

const devStory = {
  title: "VESTI 幕後手記：打造您的專屬試衣間",
  content: "親愛的 Vesti 用戶，我們正在致力於優化 AI 試穿功能的準確度。這個月我們更新了布料模擬算法，希望能讓您在線上也能感受到真實的試穿體驗。您的每一個反饋都是我們進步的動力。",
  imageUrl: "https://images.unsplash.com/photo-1704729105381-f579cfcefd63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGZhc2hpb24lMjBkZXNpZ25lciUyMHdvcmtzcGFjZSUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NjQ0MDEzMzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  date: "Nov 29, 2025"
};

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [votes, setVotes] = useState(dailyVotes);
  const [votedOption, setVotedOption] = useState<number | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const handleVote = (voteId: number, optionId: number) => {
    if (votedOption !== null) return;
    
    setVotes(votes.map(vote => {
      if (vote.id === voteId) {
        if (optionId === vote.optionA.id) {
          return {
            ...vote,
            optionA: { ...vote.optionA, votes: vote.optionA.votes + 1 },
          };
        } else {
          return {
            ...vote,
            optionB: { ...vote.optionB, votes: vote.optionB.votes + 1 },
          };
        }
      }
      return vote;
    }));
    
    setVotedOption(optionId);
  };

  const handleQuizComplete = (answers: Record<string, string[]>) => {
    console.log('Quiz answers:', answers);
    setIsQuizOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header / Search */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-sm px-5 py-4 border-b border-[#E5E5E5]"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black italic tracking-tighter text-[var(--vesti-primary)]">
            VESTI EDITORIAL
          </h1>
          <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <MessageCircle className="h-6 w-6 text-[var(--vesti-dark)]" />
          </button>
        </div>
        
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vesti-gray-mid)]" />
            <input
              type="text"
              placeholder="搜尋靈感..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[var(--vesti-gray-light)] rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--vesti-primary)] transition-colors shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      <div className="px-5 py-6 space-y-12">
        {/* Hero Section - Magazine Cover Style */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest text-[var(--vesti-gray-mid)] uppercase">Cover Story</h2>
            <span className="text-xs font-medium text-[var(--vesti-gray-mid)]">Nov 2025</span>
          </div>
          
          <div className="relative aspect-[3/4] rounded-[2px] overflow-hidden shadow-lg group cursor-pointer">
            <ImageWithFallback
              src={trendData[0].imageUrl}
              alt={trendData[0].title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="inline-block px-2 py-1 mb-3 text-[10px] font-bold tracking-wider uppercase bg-white text-black">
                {trendData[0].tags?.[0]}
              </div>
              <h3 className="text-3xl font-serif font-bold mb-2 leading-tight">
                {trendData[0].title}
              </h3>
              <p className="text-white/90 font-light text-sm line-clamp-2 mb-4">
                {trendData[0].subtitle}
              </p>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span>By {trendData[0].author}</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>5 min read</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Editor's Picks - Horizontal Scroll or Grid */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[var(--vesti-gray-light)] pb-2">
            <h2 className="text-lg font-bold text-[var(--vesti-dark)] font-serif">Trending Now</h2>
            <button className="text-xs font-bold text-[var(--vesti-primary)] hover:underline">VIEW ALL</button>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {trendData.slice(1).map((trend, i) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex gap-4 group cursor-pointer"
              >
                <div className="w-1/3 aspect-[3/4] rounded-[2px] overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={trend.imageUrl}
                    alt={trend.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 py-2 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-[var(--vesti-primary)] tracking-wider uppercase mb-1">
                      {trend.tags?.[0]}
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[var(--vesti-dark)] mb-2 leading-tight group-hover:text-[var(--vesti-primary)] transition-colors">
                      {trend.title}
                    </h3>
                    <p className="text-sm text-[var(--vesti-gray-mid)] line-clamp-2 font-light">
                      {trend.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]">
                      <Heart className="h-3 w-3" /> 248
                    </button>
                    <button className="flex items-center gap-1 text-xs text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)]">
                      <Share2 className="h-3 w-3" /> Share
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quiz Section - Interactive Break */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-8 border-y border-[var(--vesti-gray-light)]"
        >
          <div className="text-center max-w-xs mx-auto">
            <Sparkles className="h-8 w-8 text-[var(--vesti-accent)] mx-auto mb-3" />
            <h3 className="text-xl font-serif font-bold text-[var(--vesti-dark)] mb-2">
              Find Your Signature Style
            </h3>
            <p className="text-sm text-[var(--vesti-gray-mid)] mb-6 font-light">
              Take our AI-powered quiz to discover the perfect looks curated just for you.
            </p>
            <button
              onClick={() => setIsQuizOpen(true)}
              className="w-full bg-[var(--vesti-dark)] text-white py-3 rounded-none font-bold tracking-wide hover:bg-[var(--vesti-primary)] transition-colors"
            >
              START QUIZ
            </button>
          </div>
        </motion.section>

        {/* Daily Vote */}
        <section>
          <h2 className="text-lg font-bold text-[var(--vesti-dark)] font-serif mb-6">Daily Poll</h2>
          {votes.map((vote) => (
            <div key={vote.id} className="bg-white p-4 shadow-sm border border-[var(--vesti-gray-light)]">
              <h3 className="text-center text-sm font-bold mb-4 tracking-wide uppercase">{vote.question}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleVote(vote.id, vote.optionA.id)}
                  disabled={votedOption !== null}
                  className={`relative aspect-[3/4] overflow-hidden transition-all ${votedOption === vote.optionA.id ? 'ring-2 ring-[var(--vesti-primary)]' : ''}`}
                >
                  <ImageWithFallback src={vote.optionA.imageUrl} alt="Option A" className="w-full h-full object-cover" />
                  {votedOption !== null && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl">
                       {Math.round((vote.optionA.votes / (vote.optionA.votes + vote.optionB.votes)) * 100)}%
                    </div>
                  )}
                </button>
                <button
                  onClick={() => handleVote(vote.id, vote.optionB.id)}
                  disabled={votedOption !== null}
                  className={`relative aspect-[3/4] overflow-hidden transition-all ${votedOption === vote.optionB.id ? 'ring-2 ring-[var(--vesti-primary)]' : ''}`}
                >
                  <ImageWithFallback src={vote.optionB.imageUrl} alt="Option B" className="w-full h-full object-cover" />
                  {votedOption !== null && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xl">
                       {Math.round((vote.optionB.votes / (vote.optionA.votes + vote.optionB.votes)) * 100)}%
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Developer Communication Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white border border-[var(--vesti-gray-light)] p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--vesti-primary)]/5 rounded-bl-[100px]" />
          
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-8 bg-[var(--vesti-primary)]" />
             <h2 className="text-lg font-bold text-[var(--vesti-dark)] tracking-wider uppercase">Vesti Insider</h2>
          </div>

          <div className="flex gap-4 mb-4">
             <div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden border-2 border-white shadow-md">
                <ImageWithFallback src={devStory.imageUrl} alt="Dev Team" className="w-full h-full object-cover" />
             </div>
             <div>
                <h3 className="font-serif font-bold text-[var(--vesti-dark)] leading-tight mb-1">
                   {devStory.title}
                </h3>
                <p className="text-xs text-[var(--vesti-gray-mid)] mb-1">{devStory.date} • By The Dev Team</p>
             </div>
          </div>

          <p className="text-sm text-[var(--vesti-dark)]/80 leading-relaxed font-light mb-6">
             {devStory.content}
          </p>

          <div className="flex gap-3">
             <button className="flex-1 bg-[var(--vesti-background)] hover:bg-[var(--vesti-gray-light)] text-[var(--vesti-dark)] text-xs font-bold py-3 px-4 border border-[var(--vesti-gray-light)] transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                GIVE FEEDBACK
             </button>
             <button className="flex-1 bg-[var(--vesti-dark)] text-white text-xs font-bold py-3 px-4 hover:bg-[var(--vesti-primary)] transition-colors flex items-center justify-center gap-2">
                READ MORE
                <ArrowRight className="h-4 w-4" />
             </button>
          </div>
        </motion.section>
        
        <div className="text-center pt-8 pb-4">
           <p className="text-[var(--vesti-gray-mid)] text-xs uppercase tracking-widest">Designed with ❤️ in Taiwan</p>
        </div>
      </div>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onComplete={handleQuizComplete}
      />
    </div>
  );
}
