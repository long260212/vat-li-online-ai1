import React, { useState } from 'react';
import { User, Sparkles, ArrowRight, AlertCircle, Lock, ArrowLeft, CheckCircle2, GraduationCap } from 'lucide-react';
import { AppUser } from '../types';
import AppLogo from './AppLogo';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

interface LocalAccount {
  username: string;
  passwordHash: string;
  studentClass?: string;
  role: 'student' | 'teacher';
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Local helper to load registered accounts
  const getAccounts = (): LocalAccount[] => {
    try {
      const saved = localStorage.getItem('physilearn_accounts_v1');
      if (saved) return JSON.parse(saved);
      
      // Seed default accounts so they can test immediately if desired
      const defaultAccounts: LocalAccount[] = [
        {
          username: 'admin',
          passwordHash: '123456',
          studentClass: 'Giáo viên',
          role: 'teacher',
        },
        {
          username: 'hocsinh',
          passwordHash: '123456',
          studentClass: '8A1',
          role: 'student',
        }
      ];
      localStorage.setItem('physilearn_accounts_v1', JSON.stringify(defaultAccounts));
      return defaultAccounts;
    } catch {
      return [];
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim();
    const cleanPassword = password;

    if (!cleanUsername) {
      setError('Tên tài khoản không được để trống.');
      return;
    }

    if (!cleanPassword) {
      setError('Mật khẩu không được để trống.');
      return;
    }

    const accounts = getAccounts();
    const found = accounts.find(
      (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (!found || found.passwordHash !== cleanPassword) {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      return;
    }

    setSuccess('Đăng nhập thành công!');
    setTimeout(() => {
      onLogin({
        name: found.username,
        role: found.role,
        studentClass: found.studentClass,
      });
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUsername = username.trim();
    const cleanPassword = password;
    const cleanClass = studentClass.trim() || '8A1';

    if (!cleanUsername) {
      setError('Tên người dùng không được để trống.');
      return;
    }

    if (!cleanPassword) {
      setError('Mật khẩu không được để trống.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    const accounts = getAccounts();
    const exists = accounts.some(
      (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
    );

    if (exists) {
      setError('Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác.');
      return;
    }

    // Determine role based on class input (e.g. "Giáo viên", "gv" are teachers)
    const isTeacher = /(gv|giáo viên|giao vien|teacher|g\.v|giaovien)/i.test(cleanClass);
    const role = isTeacher ? 'teacher' : 'student';

    const newAccount: LocalAccount = {
      username: cleanUsername,
      passwordHash: cleanPassword,
      studentClass: cleanClass,
      role: role,
    };

    const updatedAccounts = [...accounts, newAccount];
    try {
      localStorage.setItem('physilearn_accounts_v1', JSON.stringify(updatedAccounts));
    } catch (err) {
      console.error('Lỗi lưu tài khoản:', err);
      setError('Không thể lưu thông tin tài khoản vào trình duyệt.');
      return;
    }

    setSuccess('Đăng ký tài khoản mới thành công!');
    
    // Auto login
    setTimeout(() => {
      onLogin({
        name: newAccount.username,
        role: newAccount.role,
        studentClass: newAccount.studentClass,
      });
    }, 600);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setStudentClass('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200" id="auth-container">
      {/* Background ambient light styling */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-100/30 dark:bg-blue-950/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-100/30 dark:bg-teal-950/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10" id="auth-card-wrapper">
        {/* Header Logo */}
        <div className="text-center mb-6" id="auth-header">
          <div className="inline-flex items-center justify-center mb-3 drop-shadow-xl hover:scale-105 transition-transform duration-300">
            <AppLogo size={74} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Cánh Buồm <span className="text-blue-600 dark:text-blue-400">Tri Thức</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Học tập & Khảo thí Vật lí 8 Thông minh kết hợp mô hình AI Gemini
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 shadow-2xl shadow-slate-100/50 dark:shadow-none space-y-6" id="auth-card">
          
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {mode === 'login' ? 'Đăng nhập hệ thống' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {mode === 'login' 
                ? 'Nhập tên tài khoản và mật khẩu của bạn để vào học tập.'
                : 'Nhập thông tin đăng ký để tạo một tài khoản học tập miễn phí.'}
            </p>
          </div>

          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4" id="auth-form">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs leading-relaxed animate-fade-in" id="auth-error">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs leading-relaxed animate-fade-in" id="auth-success">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <span className="font-semibold">{success} {mode === 'register' ? 'Đang tự động đăng nhập...' : ''}</span>
              </div>
            )}

            {/* Field: Username */}
            <div className="space-y-1" id="username-field-container">
              <label htmlFor="username" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block">
                {mode === 'login' ? 'Tên tài khoản' : 'Tên người dùng'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <User size={14} />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder={mode === 'login' ? "Nhập tên tài khoản của bạn..." : "Nhập tên người dùng mới..."}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1" id="password-field-container">
              <label htmlFor="password" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  <Lock size={14} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder={mode === 'login' ? "Nhập mật khẩu..." : "Mật khẩu (tối thiểu 6 ký tự)..."}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Field: Student Class (Register Only) */}
            {mode === 'register' && (
              <div className="space-y-1 animate-fade-in" id="class-field-container">
                <label htmlFor="studentClass" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase block">
                  Lớp học hoặc Chức vụ <span className="text-slate-400 text-[9px] lowercase font-normal">(Tùy chọn)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <GraduationCap size={14} />
                  </span>
                  <input
                    id="studentClass"
                    type="text"
                    placeholder="Ví dụ: 8A1, 8A2, Giáo viên..."
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 pl-1 leading-normal">
                  Nhập <strong className="text-slate-600 dark:text-slate-400">"Giáo viên"</strong> để mở quyền tạo bài tập khảo thí.
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.98]"
            >
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Toggle login / register suggestion */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center" id="auth-switch-container">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer focus:outline-hidden"
                >
                  Tạo tài khoản mới
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer focus:outline-hidden"
                >
                  <ArrowLeft size={13} /> Quay lại Đăng nhập
                </button>
              </p>
            )}
          </div>

          {/* Seeding Demo Accounts indicator */}
          {mode === 'login' && (
            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 leading-normal bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100/80 dark:border-slate-800/50">
              💡 Gợi ý tài khoản demo để thử nghiệm nhanh:<br />
              Tài khoản: <strong className="text-slate-600 dark:text-slate-300">hocsinh</strong> hoặc <strong className="text-slate-600 dark:text-slate-300">admin</strong> (mật khẩu: <strong className="text-slate-600 dark:text-slate-300">123456</strong>)
            </div>
          )}

        </div>

        {/* Outer bottom credits */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-6 font-medium">
          Trực quan hóa Vật lí lớp 8 - Học tập hiệu quả cùng AI
        </p>
      </div>
    </div>
  );
}
