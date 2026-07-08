import React, { useState, useMemo } from 'react';
import { Search, Compass, BookOpen, Layers, Award, ArrowRight } from 'lucide-react';
import { Lesson, DifficultyType } from '../types';

interface LessonLibraryProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

export default function LessonLibrary({ lessons, onSelectLesson }: LessonLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const chapters = useMemo(() => {
    const chaptersSet = new Set(lessons.map((l) => l.chapter));
    return ['all', ...Array.from(chaptersSet)];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lesson.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChapter = selectedChapter === 'all' || lesson.chapter === selectedChapter;
      const matchesDifficulty = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesChapter && matchesDifficulty;
    });
  }, [lessons, searchQuery, selectedChapter, selectedDifficulty]);

  const difficultyColors = {
    'Dễ': 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-900/40',
    'Trung bình': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/40',
    'Khó': 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/40'
  };

  return (
    <div id="lesson-library-view" className="space-y-6">
      {/* Intro section */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Thư viện Bài học Vật lí 8
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Hệ thống lý thuyết cốt lõi, công thức quan trọng, bài tập ví dụ và ứng dụng thực tế bám sát chương trình THCS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              id="search-lessons-input"
              type="text"
              placeholder="Tìm kiếm bài học, công thức hoặc khái niệm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Chapter Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Layers size={14} className="text-slate-500" />
              <select
                id="select-chapter-filter"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="bg-transparent dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-4"
              >
                <option value="all" className="dark:bg-slate-900">Tất cả Chuyên đề</option>
                {chapters.filter(c => c !== 'all').map((chap) => (
                  <option key={chap} value={chap} className="dark:bg-slate-900">{chap}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
              <Award size={14} className="text-slate-500" />
              <select
                id="select-difficulty-filter"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-transparent dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-4"
              >
                <option value="all" className="dark:bg-slate-900">Tất cả độ khó</option>
                <option value="Dễ" className="dark:bg-slate-900">Dễ</option>
                <option value="Trung bình" className="dark:bg-slate-900">Trung bình</option>
                <option value="Khó" className="dark:bg-slate-900">Khó</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Lessons */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-3">
          <div className="text-slate-300 dark:text-slate-700 flex justify-center">
            <Compass size={64} className="stroke-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Không tìm thấy bài học nào</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm max-w-md mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc để khám phá các bài học Vật lí 8 khác.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedChapter('all'); setSelectedDifficulty('all'); }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson)}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/20 dark:hover:border-blue-500/20 transition-all overflow-hidden flex flex-col justify-between cursor-pointer group hover:-translate-y-1.5 duration-300"
            >
              {lesson.imageUrl && (
                <div className="h-44 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-950">
                  <img
                    src={lesson.imageUrl}
                    alt={lesson.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <span className="absolute bottom-3 left-4 px-2.5 py-0.5 text-[10px] font-bold bg-white/20 backdrop-blur-md text-white rounded-full">
                    {lesson.chapter}
                  </span>
                </div>
              )}
              
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {!lesson.imageUrl && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 rounded-full">
                        {lesson.chapter}
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${difficultyColors[lesson.difficulty]}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {lesson.title}
                  </h3>
                  
                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {lesson.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                  <span>Khám phá nội dung</span>
                  <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
