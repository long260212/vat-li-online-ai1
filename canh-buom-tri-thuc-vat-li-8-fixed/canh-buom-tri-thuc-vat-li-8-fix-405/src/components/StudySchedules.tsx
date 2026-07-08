import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit3, Check, AlertCircle, X, FileText, Bell, CheckSquare, RefreshCw } from 'lucide-react';
import { StudySchedule, AppUser } from '../types';

interface StudySchedulesProps {
  currentUser: AppUser | null;
  schedules: StudySchedule[];
  onAddSchedule: (schedule: Omit<StudySchedule, 'id' | 'username'>) => void;
  onUpdateSchedule: (schedule: StudySchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onCompleteSchedule: (id: string) => void;
}

export default function StudySchedules({
  currentUser,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onCompleteSchedule
}: StudySchedulesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StudySchedule | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Active filter
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-8 text-center max-w-lg mx-auto my-12" id="unauthenticated-schedule">
        <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Yêu cầu đăng nhập</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Bạn cần đăng nhập tài khoản để sử dụng chức năng đặt lịch học cá nhân.
        </p>
      </div>
    );
  }

  // Filter schedules linked to the current logged-in user
  const userSchedules = schedules
    .filter(s => s.username === currentUser.name)
    .filter(s => {
      if (filter === 'pending') return s.status === 'pending';
      if (filter === 'completed') return s.status === 'completed';
      return true;
    });

  // Sort: closest upcoming first, then completed
  const sortedSchedules = [...userSchedules].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1; // Pending first
    }
    const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
    return dateTimeA - dateTimeB; // Nearest time first
  });

  const handleOpenAdd = () => {
    setTitle('');
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setTime('08:00');
    setNotes('');
    setError('');
    setEditingSchedule(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (schedule: StudySchedule) => {
    setEditingSchedule(schedule);
    setTitle(schedule.title);
    setDate(schedule.date);
    setTime(schedule.time);
    setNotes(schedule.notes || '');
    setError('');
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Tên buổi học không được để trống.');
      return;
    }
    if (!date) {
      setError('Ngày học không được để trống.');
      return;
    }
    if (!time) {
      setError('Giờ học không được để trống.');
      return;
    }

    // Check past time validation
    const targetDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    if (targetDateTime < now && (!editingSchedule || editingSchedule.status === 'pending')) {
      setError('Không thể đặt lịch học ở thời gian đã qua.');
      return;
    }

    if (editingSchedule) {
      onUpdateSchedule({
        ...editingSchedule,
        title: cleanTitle,
        date,
        time,
        notes: notes.trim() || undefined
      });
    } else {
      onAddSchedule({
        title: cleanTitle,
        date,
        time,
        notes: notes.trim() || undefined,
        status: 'pending'
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6" id="schedules-dashboard">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-750 dark:to-indigo-750 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl" id="schedule-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-2xl"></div>
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-blue-100 border border-white/10">
            <Calendar size={11} /> Kế hoạch học tập cá nhân
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Đặt Lịch Hẹn Giờ Học Tập ⏰
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Sắp xếp thời gian học Vật lí 8 khoa học. Trợ lí AI sẽ tự động rung chuông báo và nhắc nhở bạn tham gia đúng giờ để duy trì thói quen học tập tốt nhất!
          </p>
        </div>
      </div>

      {/* Control Area */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm" id="schedule-controls">
        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Sắp học
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus size={14} /> Thêm lịch học
        </button>
      </div>

      {/* Grid List */}
      {sortedSchedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center" id="empty-schedules">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
            <Calendar size={24} className="text-slate-400 dark:text-slate-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200">Không tìm thấy lịch học nào</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'all' 
              ? 'Hãy lên kế hoạch ôn tập cho tuần này bằng cách bấm nút "Thêm lịch học" phía trên!'
              : filter === 'pending'
                ? 'Bạn không có lịch học nào sắp diễn ra.'
                : 'Bạn chưa hoàn thành lịch học nào.'}
          </p>
          {filter !== 'all' && (
            <button 
              onClick={() => setFilter('all')}
              className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Xem tất cả lịch học
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="schedules-grid">
          {sortedSchedules.map((item) => {
            const isCompleted = item.status === 'completed';
            const itemDateTime = new Date(`${item.date}T${item.time}`);
            const isOverdue = !isCompleted && itemDateTime < new Date();

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all ${
                  isCompleted
                    ? 'border-emerald-100/80 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/5'
                    : isOverdue
                      ? 'border-amber-100/80 dark:border-amber-950/40 bg-amber-50/10'
                      : 'border-slate-100 dark:border-slate-800'
                }`}
                id={`schedule-card-${item.id}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50'
                        : isOverdue
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200/50'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200/50'
                    }`}>
                      {isCompleted ? 'Đã hoàn thành' : isOverdue ? 'Quá hạn / Sắp bắt đầu' : 'Sắp diễn ra'}
                    </span>

                    {/* Quick actions for each schedule card */}
                    <div className="flex items-center gap-1">
                      {!isCompleted && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          title="Sửa thông tin lịch"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteSchedule(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                        title="Xóa lịch học"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-1">
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium line-clamp-2">
                      📝 {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer with date-time and actions */}
                <div className="pt-3 border-t border-slate-50 dark:border-slate-800/80 flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex flex-col gap-0.5 text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-bold">
                      <Calendar size={11} className="text-slate-400" />
                      {new Date(item.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[10px]">
                      <Clock size={11} className="text-slate-400" />
                      Giờ: {item.time}
                    </span>
                  </div>

                  {/* Complete Checkbox Action */}
                  {!isCompleted && (
                    <button
                      onClick={() => onCompleteSchedule(item.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check size={11} /> Hoàn thành
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Schedule */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="schedule-modal">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 w-full max-w-md p-6 relative shadow-2xl space-y-4 animate-scale-in">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="text-blue-500" size={18} />
                {editingSchedule ? 'Cập nhật lịch học Vật lí' : 'Đặt lịch học Vật lí mới'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Hãy lựa chọn thời gian rảnh của bạn để Trợ lí AI hỗ trợ nhắc học đúng giờ.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Tên buổi học / Chủ đề học tập *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ôn tập chương áp suất chất lỏng, Làm bài tập trắc nghiệm..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Date & Time inputs side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Ngày học *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes text-area */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Ghi chú buổi học <span className="text-slate-400 lowercase font-normal">(Tùy chọn)</span>
                </label>
                <textarea
                  placeholder="Ghi chú thêm về nội dung cần ôn, công thức cần ôn,..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  Lưu lịch học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
