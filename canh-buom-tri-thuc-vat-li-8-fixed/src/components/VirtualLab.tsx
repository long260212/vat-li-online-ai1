import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Gauge,
  Sparkles,
  Sliders,
  HelpCircle,
  Eye,
  Thermometer,
  Zap,
  MoveRight,
  Anchor,
  Activity,
  Layers,
  Award
} from 'lucide-react';

interface VirtualLabProps {
  lessonId: string;
}

export default function VirtualLab({ lessonId }: VirtualLabProps) {
  // Common visual / state reset trigger when lesson changes
  useEffect(() => {
    resetAllStates();
  }, [lessonId]);

  const resetAllStates = () => {
    // Lesson 1 states
    setL1RefFrame('station');
    setL1Speed(30);
    setL1IsRunning(false);
    setL1TrainPos(0);
    
    // Lesson 2 states
    setL2S1(60);
    setL2T1(5);
    setL2S2(80);
    setL2T2(8);
    setL2IsSimulating(false);
    setL2Progress(0);
    setL2ActiveSegment(1);
    
    // Lesson 3 states
    setL3ForceType('pull');
    setL3ForceMagnitude(100);
    setL3Angle('0'); // 0: Right, 180: Left, 90: Down, 270: Up
    setL3Scale(50); // 1cm = 50N
    
    // Lesson 5 states
    setL5Mass(50);
    setL5Area(150);
    
    // Lesson 8 states
    setL8LiquidType('water');
    setL8Volume(250); // cm3
    setL8Submersion(0); // %
    
    // Lesson 10 states
    setL10Mass(80);
    setL10Height(10);
    setL10Time(5);
    setL10IsAnimating(false);
    setL10Progress(0);
    
    // Lesson 18 states
    setL18M1(0.5); // kg hot
    setL18T1(80); // C hot
    setL18M2(0.5); // kg cold
    setL18T2(20); // C cold
    setL18IsMixed(false);
    setL18TempProgress(20);
    setL18MixProgress(0);
  };

  // ==========================================
  // LESSON 1: CHUYỂN ĐỘNG CƠ HỌC (RELATIVE MOTION)
  // ==========================================
  const [l1RefFrame, setL1RefFrame] = useState<'station' | 'train'>('station');
  const [l1Speed, setL1Speed] = useState<number>(30);
  const [l1IsRunning, setL1IsRunning] = useState<boolean>(true);
  const [l1TrainPos, setL1TrainPos] = useState<number>(0);

  useEffect(() => {
    let intervalId: any;
    if (l1IsRunning && l1Speed > 0) {
      intervalId = setInterval(() => {
        setL1TrainPos((prev) => (prev >= 100 ? 0 : prev + (l1Speed / 50)));
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [l1IsRunning, l1Speed]);

  // ==========================================
  // LESSON 2: VẬN TỐC (VELOCITY & AVERAGE SPEED)
  // ==========================================
  const [l2S1, setL2S1] = useState<number>(60); // m
  const [l2T1, setL2T1] = useState<number>(5);  // s
  const [l2S2, setL2S2] = useState<number>(80); // m
  const [l2T2, setL2T2] = useState<number>(8);  // s
  const [l2IsSimulating, setL2IsSimulating] = useState<boolean>(false);
  const [l2Progress, setL2Progress] = useState<number>(0); // 0 to 100
  const [l2ActiveSegment, setL2ActiveSegment] = useState<1 | 2>(1);

  useEffect(() => {
    let intervalId: any;
    if (l2IsSimulating) {
      intervalId = setInterval(() => {
        setL2Progress((prev) => {
          const nextVal = prev + 1.25; // Speed rate of animation
          if (nextVal >= 100) {
            setL2IsSimulating(false);
            return 100;
          }
          if (nextVal < 50) {
            setL2ActiveSegment(1);
          } else {
            setL2ActiveSegment(2);
          }
          return nextVal;
        });
      }, 40);
    }
    return () => clearInterval(intervalId);
  }, [l2IsSimulating]);

  const handleStartL2Sim = () => {
    setL2Progress(0);
    setL2ActiveSegment(1);
    setL2IsSimulating(true);
  };

  const v1 = l2S1 / l2T1;
  const v2 = l2S2 / l2T2;
  const totalS = l2S1 + l2S2;
  const totalT = l2T1 + l2T2;
  const vAverage = totalS / totalT;
  const incorrectAvg = (v1 + v2) / 2;

  // ==========================================
  // LESSON 3: LỰC VÀ BIỂU DIỄN LỰC (FORCE VECTORS)
  // ==========================================
  const [l3ForceType, setL3ForceType] = useState<'pull' | 'push' | 'gravity' | 'friction'>('pull');
  const [l3ForceMagnitude, setL3ForceMagnitude] = useState<number>(100); // N
  const [l3Angle, setL3Angle] = useState<string>('0'); // '0' (phải), '180' (trái), '90' (dưới), '270' (trên)
  const [l3Scale, setL3Scale] = useState<number>(50); // 1cm = 50N

  // Vector specifications based on choices
  const getL3ForceName = () => {
    switch (l3ForceType) {
      case 'pull': return 'Lực kéo F';
      case 'push': return 'Lực đẩy F';
      case 'gravity': return 'Trọng lực P';
      case 'friction': return 'Lực ma sát F_ms';
    }
  };

  const getL3PointOfApp = () => {
    switch (l3ForceType) {
      case 'pull': return 'Mép phải của vật';
      case 'push': return 'Mép trái của vật';
      case 'gravity': return 'Trọng tâm ở chính giữa vật';
      case 'friction': return 'Mặt tiếp xúc giữa vật và nền';
    }
  };

  const getL3Direction = () => {
    if (l3ForceType === 'gravity') return 'Phương thẳng đứng, chiều từ trên xuống dưới';
    if (l3ForceType === 'friction') return 'Phương nằm ngang, chiều từ phải sang trái (ngược chuyển động)';
    
    // otherwise based on angle
    if (l3Angle === '0') return 'Phương nằm ngang, chiều từ trái sang phải';
    if (l3Angle === '180') return 'Phương nằm ngang, chiều từ phải sang trái';
    if (l3Angle === '90') return 'Phương thẳng đứng, chiều từ trên xuống dưới';
    return 'Phương thẳng đứng, chiều từ dưới lên trên';
  };

  // Length in grid units (1 grid block = 20 pixels, representing 1cm = 50N, scale relative)
  const arrowLengthCm = l3ForceMagnitude / l3Scale;

  // ==========================================
  // LESSON 5: ÁP SUẤT (PRESSURE)
  // ==========================================
  const [l5Mass, setL5Mass] = useState<number>(50); // kg
  const [l5Area, setL5Area] = useState<number>(125); // cm2
  const l5Force = l5Mass * 10; // Newton (F = P = 10m)
  const l5AreaM2 = l5Area / 10000; // convert cm2 to m2
  const l5Pressure = l5Force / l5AreaM2; // Pa

  // compression factor for visual representation
  const compressionDepth = Math.min(24, Math.max(2, (l5Pressure / 80000) * 20));

  // ==========================================
  // LESSON 8: LỰC ĐẨY ÁC-SI-MÉT (ARCHIMEDES BUOYANCY)
  // ==========================================
  const [l8LiquidType, setL8LiquidType] = useState<'water' | 'oil' | 'mercury'>('water');
  const [l8Volume, setL8Volume] = useState<number>(300); // cm³
  const [l8Submersion, setL8Submersion] = useState<number>(0); // 0 to 100%

  const getLiquidDensity = () => {
    switch (l8LiquidType) {
      case 'water': return 10000; // N/m³
      case 'oil': return 8000;    // N/m³
      case 'mercury': return 136000; // N/m³
    }
  };

  const getLiquidName = () => {
    switch (l8LiquidType) {
      case 'water': return 'Nước';
      case 'oil': return 'Dầu hỏa';
      case 'mercury': return 'Thủy ngân';
    }
  };

  const liquidD = getLiquidDensity();
  // Block: let's assume it has mass of 0.8 kg in air (8 N weight in air)
  const weightInAir = 8.0; // Newtons
  
  // V_submersion in m³
  const volumeM3 = l8Volume / 1000000; // cm³ to m³
  const volumeSubmergedM3 = volumeM3 * (l8Submersion / 100);
  const buoyancyForce = liquidD * volumeSubmergedM3; // F_A = d * V_chìm
  
  // Apparent weight in liquid
  const weightInLiquid = Math.max(0, weightInAir - buoyancyForce);
  const spilledWaterWeight = buoyancyForce; // by Archimedes law

  // ==========================================
  // LESSON 10: CÔNG CƠ HỌC VÀ CÔNG SUẤT
  // ==========================================
  const [l10Mass, setL10Mass] = useState<number>(100); // kg
  const [l10Height, setL10Height] = useState<number>(12); // m
  const [l10Time, setL10Time] = useState<number>(6); // s
  const [l10IsAnimating, setL10IsAnimating] = useState<boolean>(false);
  const [l10Progress, setL10Progress] = useState<number>(0); // 0 to 100

  const l10Force = l10Mass * 10; // F = P = 10m
  const l10Work = l10Force * l10Height; // A = F * s
  const l10Power = l10Work / l10Time; // P = A / t

  useEffect(() => {
    let intervalId: any;
    if (l10IsAnimating) {
      intervalId = setInterval(() => {
        setL10Progress((prev) => {
          if (prev >= 100) {
            setL10IsAnimating(false);
            return 100;
          }
          return prev + (100 / (l10Time * 20)); // animation matches time slider
        });
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [l10IsAnimating, l10Time]);

  const handleStartL10 = () => {
    setL10Progress(0);
    setL10IsAnimating(true);
  };

  // ==========================================
  // LESSON 18: PHƯƠNG TRÌNH CÂN BẰNG NHIỆT (HEAT BALANCE)
  // ==========================================
  const [l18M1, setL18M1] = useState<number>(0.4); // kg hot
  const [l18T1, setL18T1] = useState<number>(90); // °C hot
  const [l18M2, setL18M2] = useState<number>(0.6); // kg cold
  const [l18T2, setL18T2] = useState<number>(20); // °C cold
  const [l18IsMixed, setL18IsMixed] = useState<boolean>(false);
  const [l18TempProgress, setL18TempProgress] = useState<number>(20);
  const [l18MixProgress, setL18MixProgress] = useState<number>(0); // 0 to 100% animation

  const specHeatWater = 4200; // c = 4200 J/kg.K
  // Formula: m1 * c * (T1 - T_cb) = m2 * c * (T_cb - T2) => m1*T1 + m2*T2 = T_cb * (m1 + m2)
  const l18EquilibriumTemp = (l18M1 * l18T1 + l18M2 * l18T2) / (l18M1 + l18M2);
  const l18Q_toa = l18M1 * specHeatWater * (l18T1 - l18EquilibriumTemp);
  const l18Q_thu = l18M2 * specHeatWater * (l18EquilibriumTemp - l18T2);

  useEffect(() => {
    let intervalId: any;
    if (l18IsMixed) {
      intervalId = setInterval(() => {
        setL18MixProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId);
            // transition temperature smoothly
            let tempTimer = setInterval(() => {
              setL18TempProgress((currentTemp) => {
                const diff = l18EquilibriumTemp - currentTemp;
                if (Math.abs(diff) < 0.2) {
                  clearInterval(tempTimer);
                  return l18EquilibriumTemp;
                }
                return currentTemp + diff * 0.15; // smooth damping
              });
            }, 30);
            return 100;
          }
          return prev + 4;
        });
      }, 30);
    } else {
      setL18TempProgress(l18T2); // start with cold cup temp
      setL18MixProgress(0);
    }
    return () => clearInterval(intervalId);
  }, [l18IsMixed, l18EquilibriumTemp]);


  return (
    <div id="virtual-lab-container" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white p-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
          <Activity size={180} strokeWidth={1} className="text-white" />
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
            <span className="text-2xl">🧪</span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight mt-1 flex items-center gap-2">
              Phòng Thí Nghiệm Vật Lí 8 Ảo
            </h2>
            <p className="text-xs text-blue-100 mt-0.5">Mô phỏng tương tác thời gian thực, trực quan hóa công thức và định luật</p>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE SIMULATION BASED ON LESSON ID */}
      <div className="p-6 md:p-8">
        
        {/* ======================================================== */}
        {/* LESSON 1: CHUYỂN ĐỘNG CƠ HỌC (RELATIVE MOTION)           */}
        {/* ======================================================== */}
        {lessonId === 'bai-1' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Settings Sidebar */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Thông số thí nghiệm</h4>
                </div>
                
                {/* Reference point choice */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Vật chọn làm Mốc (Hệ quy chiếu):</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setL1RefFrame('station')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        l1RefFrame === 'station'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      🌳 Nhà ga (Cố định)
                    </button>
                    <button
                      type="button"
                      onClick={() => setL1RefFrame('train')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        l1RefFrame === 'train'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      🚂 Toa tàu (Di chuyển)
                    </button>
                  </div>
                </div>

                {/* Train Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Vận tốc tàu hỏa:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{l1Speed} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={l1Speed}
                    onChange={(e) => setL1Speed(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0 (Đứng yên)</span>
                    <span>30 (Vừa)</span>
                    <span>60 (Nhanh)</span>
                  </div>
                </div>

                {/* Animation controls */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setL1IsRunning(!l1IsRunning)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      l1IsRunning ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {l1IsRunning ? (
                      <>
                        <span>⏸️ Tạm dừng chuyển động</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span>Chạy chuyển động</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setL1TrainPos(0);
                      setL1IsRunning(true);
                    }}
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-750 transition-colors"
                    title="Đặt lại"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

              </div>

              {/* Center Canvas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2D Visual Scene */}
                <div className="h-64 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 shadow-inner">
                  {/* Sky & clouds */}
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-900 to-indigo-950 opacity-40"></div>
                  
                  {/* Stars/stars glow */}
                  <div className="absolute top-8 left-12 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping"></div>
                  <div className="absolute top-16 right-36 w-1 h-1 bg-white/40 rounded-full"></div>
                  
                  {/* Distant Hills */}
                  <div className="absolute bottom-16 left-0 right-0 h-16 bg-slate-800/40 clip-path-hills opacity-30 transform translate-y-2"></div>
                  
                  {/* Platform background - moves left if we select reference to train! */}
                  <div
                    className="absolute bottom-12 left-0 right-0 h-10 transition-all duration-100"
                    style={{
                      transform: l1RefFrame === 'train' ? `translateX(-${(l1TrainPos * 1.5) % 80}px)` : 'none'
                    }}
                  >
                    {/* Ga Station Sign */}
                    <div className="absolute left-[30%] bottom-3 bg-slate-800 border-2 border-slate-600 px-3 py-1 text-[10px] font-bold text-white rounded shadow-md">
                      🏡 GA VẬT LÍ 8 (MỐC)
                    </div>
                    {/* Tree at platform */}
                    <div className="absolute left-[15%] bottom-2 text-2xl select-none" title="Vật mốc Cây Xanh">🌳</div>
                    {/* Person A standing at platform */}
                    <div className="absolute left-[45%] bottom-1 text-2xl select-none" title="Bác Nam đứng đợi tàu">🧍<span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] px-1 py-0.2 rounded text-slate-300">Nam</span></div>
                  </div>

                  {/* Tracks */}
                  <div className="absolute bottom-10 left-0 right-0 h-2 bg-slate-700 flex justify-between px-1">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="w-1 h-3 bg-slate-500 transform -rotate-12 -translate-y-0.5"></div>
                    ))}
                  </div>

                  {/* Ground ballast */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-800 border-t-2 border-slate-600"></div>

                  {/* Moving train carriage! */}
                  <div
                    className="absolute bottom-11 w-64 h-24 transition-all duration-100"
                    style={{
                      left: l1RefFrame === 'station' 
                        ? `calc(${l1TrainPos}% - 120px)` 
                        : 'calc(50% - 120px)' // train stays centered in train-frame!
                    }}
                  >
                    {/* Carriage main body */}
                    <div className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg relative border-b-4 border-blue-800 shadow-md flex items-center justify-around px-4">
                      {/* Train Window 1 */}
                      <div className="w-12 h-8 bg-sky-300/40 rounded border border-blue-400/50 flex items-center justify-center relative">
                        {/* Passenger B sitting inside */}
                        <div className="text-xl select-none" title="Bạn Hoa ngồi yên trên tàu">🧘</div>
                        <span className="absolute -bottom-5 text-[8px] bg-slate-850 px-1 py-0.2 rounded text-slate-300">Hoa</span>
                      </div>
                      {/* Train Window 2 */}
                      <div className="w-12 h-8 bg-sky-300/40 rounded border border-blue-400/50 flex items-center justify-center relative">
                        {/* Passenger C is walking (not used here to keep it clean) */}
                        <div className="text-xl select-none">🎒</div>
                        <span className="absolute -bottom-5 text-[8px] bg-slate-850 px-1 py-0.2 rounded text-slate-300">Hành lý</span>
                      </div>
                    </div>
                    {/* Wheels */}
                    <div className="absolute -bottom-1 left-4 w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center animate-spin" style={{ animationDuration: l1Speed > 0 ? `${120 / l1Speed}s` : '0s' }}>
                      <div className="w-1 h-4 bg-slate-800"></div>
                    </div>
                    <div className="absolute -bottom-1 right-4 w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-400 flex items-center justify-center animate-spin" style={{ animationDuration: l1Speed > 0 ? `${120 / l1Speed}s` : '0s' }}>
                      <div className="w-1 h-4 bg-slate-800"></div>
                    </div>
                  </div>

                </div>

                {/* Real-time Relative Motion Matrix */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-indigo-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Bảng trạng thái chuyển động</h5>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 pb-2">
                          <th className="py-2 font-bold">Vật cần quan sát</th>
                          <th className="py-2 font-bold text-center">Vật làm mốc đang chọn</th>
                          <th className="py-2 font-bold text-center">Trạng thái (Tính tương đối)</th>
                          <th className="py-2 font-bold text-right">Giải thích cơ bản</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {/* 1. Passenger Hoa relative to chosen frame */}
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">👩‍🎓 Bạn Hoa (ngồi trên tàu)</td>
                          <td className="py-2.5 text-center font-semibold text-slate-500">
                            {l1RefFrame === 'station' ? '🌳 Nhà ga / Cây' : '🚂 Toa tàu'}
                          </td>
                          <td className="py-2.5 text-center">
                            {l1Speed === 0 ? (
                              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">Đứng yên</span>
                            ) : l1RefFrame === 'station' ? (
                              <span className="px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold animate-pulse">Chuyển động</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold">Đứng yên</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-[11px] text-slate-500 leading-normal">
                            {l1Speed === 0 ? 'Tàu không di chuyển.' : l1RefFrame === 'station' ? 'Khoảng cách từ Hoa tới Nhà ga liên tục thay đổi.' : 'Vị trí của Hoa so với toa tàu luôn cố định không đổi.'}
                          </td>
                        </tr>

                        {/* 2. Spectator Nam relative to chosen frame */}
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">🧍 Bác Nam (đứng ở sân ga)</td>
                          <td className="py-2.5 text-center font-semibold text-slate-500">
                            {l1RefFrame === 'station' ? '🌳 Nhà ga / Cây' : '🚂 Toa tàu'}
                          </td>
                          <td className="py-2.5 text-center">
                            {l1Speed === 0 ? (
                              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">Đứng yên</span>
                            ) : l1RefFrame === 'station' ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold">Đứng yên</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold animate-pulse">Chuyển động</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-[11px] text-slate-500 leading-normal">
                            {l1Speed === 0 ? 'Tàu đứng im tại ga.' : l1RefFrame === 'station' ? 'Bác Nam đứng yên trên sân ga.' : 'So với người ngồi trên tàu đang đi, Bác Nam đang bị lùi dần về phía sau.'}
                          </td>
                        </tr>

                        {/* 3. The Tree/Station itself */}
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-100">🌳 Cây xanh / Nhà ga</td>
                          <td className="py-2.5 text-center font-semibold text-slate-500">
                            {l1RefFrame === 'station' ? '🌳 Nhà ga / Cây' : '🚂 Toa tàu'}
                          </td>
                          <td className="py-2.5 text-center">
                            {l1Speed === 0 ? (
                              <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">Đứng yên</span>
                            ) : l1RefFrame === 'station' ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold">Đứng yên (Làm mốc)</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold">Chuyển động</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-[11px] text-slate-500 leading-normal">
                            {l1Speed === 0 ? '-' : l1RefFrame === 'station' ? 'Cây xanh bám rễ sâu vào lòng đất.' : 'Khoảng cách giữa toa tàu và cây xanh liên tục tăng/giảm.'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 text-xs rounded-xl leading-relaxed">
                    <strong>💡 Kết luận rút ra từ thí nghiệm:</strong> Chuyển động và đứng yên có <strong>tính tương đối</strong>. Một vật có thể được coi là chuyển động so với vật này nhưng lại đứng yên so với vật khác, tùy thuộc vào việc lựa chọn vật mốc. Vì vậy nói vật chuyển động mà không chỉ rõ vật mốc là vô nghĩa!
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 2: VẬN TỐC & VẬN TỐC TRUNG BÌNH (VELOCITY)        */}
        {/* ======================================================== */}
        {lessonId === 'bai-2' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left sliders control */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Thông số quãng đường</h4>
                </div>

                {/* Segment 1 */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wide">Chặng 1 (Đường dốc)</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Quãng đường s₁:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l2S1} m</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={l2S1}
                      onChange={(e) => setL2S1(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Thời gian t₁:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l2T1} giây</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="1"
                      value={l2T1}
                      onChange={(e) => setL2T1(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="text-[10px] bg-slate-50 dark:bg-slate-950 p-1.5 rounded text-center text-slate-500 font-mono">
                    Tốc độ v₁ = {v1.toFixed(2)} m/s ({(v1 * 3.6).toFixed(1)} km/h)
                  </div>
                </div>

                {/* Segment 2 */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="text-xs font-black text-indigo-600 uppercase tracking-wide">Chặng 2 (Đường phẳng)</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Quãng đường s₂:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l2S2} m</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={l2S2}
                      onChange={(e) => setL2S2(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Thời gian t₂:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l2T2} giây</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="1"
                      value={l2T2}
                      onChange={(e) => setL2T2(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div className="text-[10px] bg-slate-50 dark:bg-slate-950 p-1.5 rounded text-center text-slate-500 font-mono">
                    Tốc độ v₂ = {v2.toFixed(2)} m/s ({(v2 * 3.6).toFixed(1)} km/h)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartL2Sim}
                  disabled={l2IsSimulating}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play size={14} fill="currentColor" />
                  <span>CHẠY THỬ MÔ PHỎNG XE</span>
                </button>

              </div>

              {/* Right Simulation Canvas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2D Race track visual */}
                <div className="h-44 bg-slate-950 rounded-xl relative overflow-hidden border border-slate-800 p-4">
                  {/* Sky glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-indigo-950/40"></div>
                  
                  {/* Speed lines */}
                  <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-slate-800/40 flex justify-between">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="w-12 h-0.5 bg-slate-800/20 animate-pulse"></div>
                    ))}
                  </div>

                  {/* Track markers */}
                  <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-8 text-[9px] font-mono text-slate-500 font-bold select-none">
                    <span>🏁 0m (Xuất phát)</span>
                    <span className="text-blue-500 border-b border-dashed border-blue-500/50 pb-0.5">👈 Chặng 1 ({l2S1}m) 👉</span>
                    <span>📍 {l2S1}m (Mốc giữa)</span>
                    <span className="text-indigo-500 border-b border-dashed border-indigo-500/50 pb-0.5">👈 Chặng 2 ({l2S2}m) 👉</span>
                    <span>🏆 {totalS}m (Đích)</span>
                  </div>

                  {/* Physical Road */}
                  <div className="absolute bottom-6 left-4 right-4 h-5 bg-slate-900 rounded-lg border-y border-slate-800 flex items-center justify-around">
                    {/* Yellow center line */}
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className="w-4 h-0.5 bg-yellow-500/70"></div>
                    ))}
                  </div>

                  {/* Animated Race Car */}
                  <div
                    className="absolute bottom-6 w-16 h-8 transition-all duration-100 ease-linear"
                    style={{
                      left: `calc(4% + (${l2Progress}% * 0.85))`
                    }}
                  >
                    <div className={`w-full h-5 rounded-md relative flex items-center justify-end ${
                      l2ActiveSegment === 1 ? 'bg-blue-500 shadow-md shadow-blue-500/20' : 'bg-indigo-500 shadow-md shadow-indigo-500/20'
                    }`}>
                      {/* Spoiler */}
                      <div className="absolute left-0 -top-1 w-2.5 h-2 bg-slate-700 rounded-sm"></div>
                      {/* Cockpit */}
                      <div className="w-6 h-3 bg-sky-200 rounded-t-full mr-2 mb-1 border border-slate-800/40"></div>
                      
                      {/* Headlight glow */}
                      <div className="absolute right-0 top-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                    </div>
                    {/* Front Wheel */}
                    <div className="absolute bottom-1 right-2.5 w-4 h-4 rounded-full bg-slate-850 border border-slate-600 flex items-center justify-center animate-spin">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    {/* Rear Wheel */}
                    <div className="absolute bottom-1 left-2 w-4 h-4 rounded-full bg-slate-850 border border-slate-600 flex items-center justify-center animate-spin">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>

                    {/* Active phase indicator tag */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-[8px] font-black rounded-md text-white border border-slate-700 shadow whitespace-nowrap">
                      {l2IsSimulating 
                        ? `${l2ActiveSegment === 1 ? 'Chặng 1' : 'Chặng 2'}: ${(l2ActiveSegment === 1 ? v1 : v2).toFixed(1)} m/s`
                        : 'Sẵn sàng'}
                    </div>
                  </div>

                  {/* Live Speedometer HUD */}
                  <div className="absolute bottom-1 right-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2.5">
                    <Gauge size={14} className="text-blue-500 animate-pulse" />
                    <div className="font-mono">
                      <span className="text-[9px] text-slate-500 font-bold block leading-none">VẬN TỐC TỨC THỜI</span>
                      <span className="text-sm font-black text-white leading-none">
                        {l2IsSimulating 
                          ? (l2ActiveSegment === 1 ? v1 : v2).toFixed(1)
                          : '0.0'
                        }
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">m/s</span>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Math & Concept Clarification */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles size={16} />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Phân tích công thức từ mô phỏng</h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Calculated results */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Thông số tổng quát</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded">
                          <span className="text-slate-400 block text-[9px] font-bold">TỔNG QUÃNG ĐƯỜNG</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">S = {totalS} m</span>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded">
                          <span className="text-slate-400 block text-[9px] font-bold">TỔNG THỜI GIAN</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">T = {totalT} s</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
                        <span className="text-indigo-600 dark:text-indigo-400 block text-[10px] font-black uppercase tracking-wider">VẬN TỐC TRUNG BÌNH THỰC TẾ:</span>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                          v_tb = S / T = {vAverage.toFixed(2)} m/s
                        </div>
                        <span className="text-[9px] text-slate-500 block leading-tight mt-1">
                          = {(vAverage * 3.6).toFixed(1)} km/h (Bằng tổng quãng đường chia tổng thời gian).
                        </span>
                      </div>
                    </div>

                    {/* Fatal Misconception alert */}
                    <div className="p-3 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl border border-rose-100/60 dark:border-rose-950/30 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                          <span>⚠️ CẢNH BÁO LỖI SAI KINH ĐIỂN</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-normal">
                          Rất nhiều học sinh thường tính nhầm vận tốc trung bình bằng trung bình cộng các vận tốc:
                        </p>
                        <div className="my-2 p-1.5 bg-rose-100/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-mono text-xs text-center rounded font-bold">
                          v_tb = (v₁ + v₂) / 2 = {incorrectAvg.toFixed(2)} m/s ❌
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Trong thí nghiệm này, hai giá trị này {vAverage.toFixed(2) === incorrectAvg.toFixed(2) ? 'trùng nhau ngẫu nhiên' : `khác nhau hoàn toàn (${vAverage.toFixed(2)} m/s so với ${incorrectAvg.toFixed(2)} m/s)`}.
                        </p>
                      </div>
                      <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 p-1.5 rounded-lg border border-teal-100 dark:border-teal-950/50 mt-2">
                        💡 Thầy cô khuyên: Chỉ tính v_tb bằng công thức S_tong / T_tong.
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 3: LỰC VÀ BIỂU DIỄN LỰC (FORCE REPRESENTATION)    */}
        {/* ======================================================== */}
        {lessonId === 'bai-3' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Settings controller */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Chọn loại lực & độ lớn</h4>
                </div>

                {/* Force type */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Loại lực tác dụng:</label>
                  <select
                    value={l3ForceType}
                    onChange={(e: any) => {
                      const val = e.target.value;
                      setL3ForceType(val);
                      // default angles to make physical sense
                      if (val === 'gravity') setL3Angle('90');
                      else if (val === 'friction') setL3Angle('180');
                      else setL3Angle('0');
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-slate-200"
                  >
                    <option value="pull">👉 Lực kéo (Ngang sang phải)</option>
                    <option value="push">👈 Lực đẩy (Ngang sang phải từ mép)</option>
                    <option value="gravity">⬇️ Trọng lực P (Hướng xuống)</option>
                    <option value="friction">⬅️ Lực ma sát F_ms (Ngược chuyển động)</option>
                  </select>
                </div>

                {/* Magnitude of Force */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Độ lớn của lực:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{l3ForceMagnitude} N</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="25"
                    value={l3ForceMagnitude}
                    disabled={l3ForceType === 'friction'} // let's say friction is hardcoded to 50N to look realistic
                    onChange={(e) => setL3ForceMagnitude(Number(e.target.value))}
                    className="w-full accent-indigo-600 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>25N</span>
                    <span>100N</span>
                    <span>200N</span>
                  </div>
                </div>

                {/* Angle choice if customizable */}
                {l3ForceType !== 'gravity' && l3ForceType !== 'friction' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Hướng của lực:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: '0', label: 'Ngang phải (0°)' },
                        { id: '180', label: 'Ngang trái (180°)' },
                        { id: '270', label: 'Thẳng đứng lên' },
                        { id: '90', label: 'Thẳng đứng xuống' }
                      ].map((ang) => (
                        <button
                          key={ang.id}
                          type="button"
                          onClick={() => setL3Angle(ang.id)}
                          className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            l3Angle === ang.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {ang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scale selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Chọn Tỉ Xích Bản Vẽ:</label>
                  <div className="flex gap-2">
                    {[25, 50, 100].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setL3Scale(sc)}
                        className={`flex-1 py-1 px-2.5 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          l3Scale === sc
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                        }`}
                      >
                        1cm = {sc}N
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Vector canvas representation */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Visual grid canvas with vector */}
                <div className="h-64 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800">
                  {/* Grid background */}
                  <div className="absolute inset-0 grid-lines-canvas opacity-10"></div>

                  {/* Centered Wooden box object */}
                  <div className="absolute top-[40%] left-[40%] w-24 h-16 bg-amber-700/80 border-2 border-amber-900 rounded-lg shadow-md flex items-center justify-center text-white/90 text-xs font-bold tracking-tight select-none z-10">
                    VẬT NẶNG
                    {/* Center of Gravity dot */}
                    <div className="absolute w-2.5 h-2.5 bg-amber-300 rounded-full border border-slate-950 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" title="Trọng tâm C"></div>
                  </div>

                  {/* Ground Line */}
                  <div className="absolute top-[65%] left-0 right-0 h-1 bg-slate-500 shadow-md"></div>
                  <div className="absolute top-[65%] left-0 right-0 h-12 bg-slate-800/60 opacity-30"></div>

                  {/* SVG container to draw vector arrows on top of the physical object */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
                      </marker>
                      <marker id="scaleMark" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="6" orient="auto">
                        <line x1="5" y1="0" x2="5" y2="10" stroke="#f59e0b" strokeWidth="2" />
                      </marker>
                    </defs>

                    {/* RENDER DYNAMIC VECTOR ARROW */}
                    {(() => {
                      // Anchor points coordinates on canvas
                      // Center coordinates of SVG is roughly (w/2, h/2).
                      // Wooden Box: width=96, height=64. Top=40% (102.4px of 256px), Left=40% (around 144px of 360px).
                      // Let's compute box center:
                      const x_center = 192; // Approx mid-canvas width (48% of 400px width estimate)
                      const x_left = 144;
                      const x_right = 240;
                      const y_center = 134; // Approx mid-canvas height
                      const y_bottom = 166;

                      let x_start = x_center;
                      let y_start = y_center;

                      if (l3ForceType === 'pull') {
                        x_start = x_right;
                        y_start = y_center;
                      } else if (l3ForceType === 'push') {
                        x_start = x_left;
                        y_start = y_center;
                      } else if (l3ForceType === 'friction') {
                        x_start = x_center;
                        y_start = y_bottom;
                      }

                      // Scale vector: 1 grid unit (or cm on grid) = 25 pixels
                      // arrowLengthCm = Force / Scale
                      const pixelLength = arrowLengthCm * 28;

                      let x_end = x_start;
                      let y_end = y_start;

                      // angle calculation
                      let currentAngle = Number(l3Angle);
                      if (l3ForceType === 'gravity') currentAngle = 90;
                      else if (l3ForceType === 'friction') currentAngle = 180;

                      if (currentAngle === 0) {
                        x_end = x_start + pixelLength;
                      } else if (currentAngle === 180) {
                        x_end = x_start - pixelLength;
                      } else if (currentAngle === 90) {
                        y_end = y_start + pixelLength;
                      } else if (currentAngle === 270) {
                        y_end = y_start - pixelLength;
                      }

                      // Generate division ticks along the arrow representing centimeters/scale segments
                      const tickMarks = [];
                      const segmentsCount = Math.floor(arrowLengthCm);
                      for (let i = 1; i <= segmentsCount; i++) {
                        const ratio = i / arrowLengthCm;
                        const tx = x_start + (x_end - x_start) * ratio;
                        const ty = y_start + (y_end - y_start) * ratio;
                        tickMarks.push({ x: tx, y: ty });
                      }

                      return (
                        <>
                          {/* Force Line Vector */}
                          <line
                            x1={x_start}
                            y1={y_start}
                            x2={x_end}
                            y2={y_end}
                            stroke="#10b981"
                            strokeWidth="3.5"
                            markerEnd="url(#arrow)"
                          />

                          {/* Point of Application Glow dot */}
                          <circle cx={x_start} cy={y_start} r="5" fill="#f59e0b" className="animate-pulse" />

                          {/* Render tick marks on vector */}
                          {tickMarks.map((tick, idx) => (
                            <circle
                              key={idx}
                              cx={tick.x}
                              cy={tick.y}
                              r="3.5"
                              fill="#ef4444"
                              stroke="#ffffff"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Force label overlay */}
                          <text
                            x={(x_start + x_end) / 2 + (currentAngle === 90 || currentAngle === 270 ? 12 : 0)}
                            y={(y_start + y_end) / 2 - (currentAngle === 0 || currentAngle === 180 ? 12 : 0)}
                            fill="#10b981"
                            fontSize="11"
                            fontWeight="900"
                            textAnchor="middle"
                            className="bg-slate-950 font-mono"
                          >
                            {getL3ForceName()} = {l3ForceMagnitude}N
                          </text>

                          {/* Visual Tỉ xích indicator on top-left */}
                          <g transform="translate(15, 25)">
                            <line x1="0" y1="5" x2="28" y2="5" stroke="#f59e0b" strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="1.5" />
                            <line x1="28" y1="0" x2="28" y2="10" stroke="#f59e0b" strokeWidth="1.5" />
                            <text x="36" y="9" fill="#94a3b8" fontSize="10" fontWeight="bold">
                              1 cm (Mốc vẽ) = {l3Scale}N
                            </text>
                          </g>
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Vector Analysis text */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-teal-600" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Bốn yếu tố cấu thành lực biểu diễn
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="font-bold text-indigo-600 block mb-0.5">1. Điểm đặt (Gốc vectơ):</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold">{getL3PointOfApp()}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="font-bold text-indigo-600 block mb-0.5">2. Phương & Chiều:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold">{getL3Direction()}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="font-bold text-indigo-600 block mb-0.5">3. Độ lớn (Cường độ lực):</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-mono font-bold">{l3ForceMagnitude} Newton (N)</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="font-bold text-indigo-600 block mb-0.5">4. Tỉ xích bản vẽ biểu thị:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                        Lực dài {arrowLengthCm.toFixed(1)} cm (gồm {Math.floor(arrowLengthCm)} đoạn tỉ xích, mỗi đoạn ứng với {l3Scale}N).
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 5: ÁP SUẤT (PRESSURE SIMULATION)                  */}
        {/* ======================================================== */}
        {lessonId === 'bai-5' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left sidebar controller */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Lực tác dụng & Diện tích</h4>
                </div>

                {/* Mass Slider (Force F = 10 * m) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Khối lượng vật ép (m):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l5Mass} kg</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={l5Mass}
                    onChange={(e) => setL5Mass(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10kg (100 N)</span>
                    <span>120kg (1200 N)</span>
                  </div>
                </div>

                {/* Area Slider S */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Diện tích bị ép S:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l5Area} cm²</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="450"
                    step="25"
                    value={l5Area}
                    onChange={(e) => setL5Area(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>50 cm² (S nhỏ)</span>
                    <span>450 cm² (S lớn)</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-500">Quy đổi đơn vị S chuẩn SI:</div>
                  <div className="font-mono bg-slate-50 dark:bg-slate-950 p-1.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                    S = {l5Area} cm² = {l5AreaM2.toFixed(5)} m²
                  </div>
                </div>

              </div>

              {/* Right simulation area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2D Sponge compression visualization */}
                <div className="h-56 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 p-4">
                  
                  {/* Sponge layer */}
                  {/* Sponge is at bottom. Compressed part shrinks. */}
                  <div
                    className="absolute bottom-0 left-[15%] right-[15%] bg-yellow-400/80 dark:bg-yellow-500/60 border-t-4 border-yellow-500 rounded-t shadow-inner transition-all duration-200"
                    style={{
                      height: `calc(40px - ${compressionDepth}px)`,
                    }}
                  >
                    <div className="absolute inset-0 grid grid-cols-12 gap-1 opacity-20">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-r border-yellow-700 h-full border-dashed"></div>
                      ))}
                    </div>
                  </div>

                  {/* Heavy block resting on sponge */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bg-slate-500 border-2 border-slate-700 rounded-lg shadow-lg flex flex-col justify-center items-center transition-all duration-200"
                    style={{
                      // width represents the area S
                      width: `${80 + (l5Area / 3)}px`,
                      height: '60px',
                      bottom: `calc(36px - ${compressionDepth}px)`,
                    }}
                  >
                    <span className="text-[10px] font-black text-white/90">KHỐI KIM LOẠI ({l5Mass}kg)</span>
                    <span className="text-[9px] text-white/70 font-mono">F = {l5Force} N</span>
                    
                    {/* Width handle indicator */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-1 text-slate-300/80 select-none">
                      <span>◀</span>
                      <span className="text-[8px] font-black tracking-widest uppercase">S = {l5Area} cm²</span>
                      <span>▶</span>
                    </div>
                  </div>

                  {/* High pressure alert glow */}
                  {l5Pressure > 40000 && (
                    <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 text-[9px] font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse uppercase tracking-wider">
                      ⚠️ Cảnh báo lún sâu!
                    </div>
                  )}

                  {/* Ground ballast */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-800 border-t border-slate-700"></div>

                  {/* Live HUD statistics */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between gap-3 flex-wrap">
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 font-bold block leading-none">ÁP LỰC F (TỪ TRỌNG LỰC)</span>
                      <span className="text-xs font-mono font-black text-white">F = 10 × {l5Mass} = {l5Force} N</span>
                    </div>
                    
                    <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 font-bold block leading-none">ÁP SUẤT TÁC DỤNG p</span>
                      <span className={`text-xs font-mono font-black ${l5Pressure > 40000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        p = {l5Pressure.toFixed(0)} N/m² (Pa)
                      </span>
                    </div>
                  </div>

                </div>

                {/* Calculations details */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-blue-600 animate-pulse" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Công thức & Bài học áp lực
                    </h5>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">Công thức tính:</span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded font-mono">p = F / S</span>
                    </div>
                    
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                      <p>• Áp lực F = {l5Force} N</p>
                      <p>• Diện tích S = {l5AreaM2.toFixed(5)} m²</p>
                      <p className="font-bold text-slate-800 dark:text-white">
                        • p = {l5Force} / {l5AreaM2.toFixed(5)} = {l5Pressure.toFixed(1)} Pascal (Pa)
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <strong>💡 Nhận xét then chốt:</strong>
                      <ul className="list-disc pl-4 space-y-1 mt-1.5 font-semibold">
                        <li>Áp suất <span className="text-indigo-600">tỉ lệ thuận</span> với áp lực F. Áp lực càng lớn thì vật càng bị lún sâu hơn.</li>
                        <li>Áp suất <span className="text-indigo-600">tỉ lệ nghịch</span> với diện tích bị ép S. Khi diện tích S càng nhỏ (mũi đinh, lưỡi dao kéo), vật cực kỳ dễ xuyên thủng hay ép lún sâu dù lực rất bé!</li>
                      </ul>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 8: LỰC ĐẨY ÁC-SI-MÉT (ARCHIMEDES BUOYANCY)         */}
        {/* ======================================================== */}
        {lessonId === 'bai-8' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left sidebar controllers */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Môi trường & Thể tích</h4>
                </div>

                {/* Liquid Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Chọn chất lỏng:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'water', label: '💧 Nước (d = 10,000 N/m³)' },
                      { id: 'oil', label: '🔥 Dầu hỏa (d = 8,000 N/m³)' },
                      { id: 'mercury', label: '💀 Thủy ngân (d = 136,000 N/m³)' }
                    ].map((liq) => (
                      <button
                        key={liq.id}
                        type="button"
                        onClick={() => setL8LiquidType(liq.id as any)}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border text-left transition-all cursor-pointer ${
                          l8LiquidType === liq.id
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {liq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume of block V */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Thể tích vật V:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l8Volume} cm³</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="50"
                    value={l8Volume}
                    onChange={(e) => setL8Volume(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>100 cm³</span>
                    <span>500 cm³</span>
                  </div>
                </div>

                {/* Submersion depth selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Độ ngập trong chất lỏng:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{l8Submersion}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={l8Submersion}
                    onChange={(e) => setL8Submersion(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>0% (Trên không)</span>
                    <span>50% (Chìm nửa)</span>
                    <span>100% (Chìm hẳn)</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950 rounded-xl space-y-1 text-[10px] text-slate-500 font-semibold">
                  <p>• Thể tích chìm V_chìm = {l8Volume * l8Submersion / 100} cm³</p>
                  <p>• = {volumeSubmergedM3.toFixed(6)} m³</p>
                </div>

              </div>

              {/* Right simulation area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Archimedes Overflow beaker visual */}
                <div className="h-64 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 p-4 flex justify-between items-end">
                  
                  {/* Left: Spring Scale */}
                  <div className="w-1/3 h-full relative flex flex-col items-center pt-2">
                    {/* Hanging bracket */}
                    <div className="w-12 h-1.5 bg-slate-600 rounded"></div>
                    
                    {/* Spring Body */}
                    <div className="w-6 h-28 bg-amber-500/80 rounded border border-amber-600 relative flex flex-col justify-between items-center px-0.5 py-1">
                      {/* Scale marks */}
                      <div className="w-full h-full flex flex-col justify-between text-[7px] font-mono text-slate-950 font-black leading-none">
                        <span>0N</span>
                        <span>2N</span>
                        <span>4N</span>
                        <span>6N</span>
                        <span>8N</span>
                      </div>
                      
                      {/* Spring hook and red pointer line */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-4 h-0.5 bg-red-600 border border-white transition-all duration-200"
                        style={{
                          top: `${10 + (weightInLiquid / weightInAir) * 80}px`
                        }}
                      ></div>
                    </div>

                    {/* Suspension wire */}
                    <div
                      className="w-0.5 bg-slate-400 transition-all duration-200"
                      style={{
                        height: `calc(32px + ${l8Submersion * 0.4}px)`
                      }}
                    ></div>

                    {/* Weight Block */}
                    <div
                      className="w-12 bg-slate-400 border border-slate-500 rounded flex items-center justify-center text-[8px] font-bold text-slate-800 relative shadow transition-all duration-200"
                      style={{
                        height: '32px',
                        transform: `translateY(${-4 + l8Submersion * 0.2}px)`
                      }}
                    >
                      <span>VẬT</span>
                      <span className="absolute -bottom-4 text-[7px] text-slate-400">{l8Volume}cm³</span>
                    </div>
                  </div>

                  {/* Center: Archimedes Beaker */}
                  <div className="w-1/3 h-44 bg-slate-800/40 border-x-4 border-b-4 border-slate-600 rounded-b-xl relative flex items-end">
                    
                    {/* Liquid layer */}
                    <div
                      className={`w-full transition-all duration-200 rounded-b-lg ${
                        l8LiquidType === 'water' ? 'bg-sky-400/50' : l8LiquidType === 'oil' ? 'bg-yellow-600/40' : 'bg-slate-400/80'
                      }`}
                      style={{
                        // as we submerge, liquid height remains at maximum overflow spout
                        height: '110px'
                      }}
                    ></div>

                    {/* Overflow spout channel */}
                    <div className="absolute top-[35px] right-[-14px] w-4 h-2.5 bg-slate-600 transform rotate-12"></div>
                    
                    {/* Overflow water droplet path */}
                    {l8Submersion > 0 && (
                      <div className="absolute top-[40px] right-[-10px] w-1 h-12 bg-sky-400/70 border-r border-sky-300 animate-pulse rounded-full"></div>
                    )}

                    {/* Beaker labels */}
                    <div className="absolute top-1/2 left-3 text-[9px] font-mono font-black text-white/50">
                      BÌNH ĐẦY CHẤT LỎNG
                    </div>
                  </div>

                  {/* Right: Overflow Cup */}
                  <div className="w-1/4 h-32 relative flex flex-col justify-end items-center">
                    
                    {/* Overflow cup bucket */}
                    <div className="w-14 h-16 bg-slate-850 border-x-2 border-b-2 border-slate-500 rounded-b-lg relative flex items-end">
                      {/* Water inside cup */}
                      <div
                        className={`w-full transition-all duration-200 rounded-b-md ${
                          l8LiquidType === 'water' ? 'bg-sky-400/50' : l8LiquidType === 'oil' ? 'bg-yellow-600/40' : 'bg-slate-400/80'
                        }`}
                        style={{
                          height: `${(l8Submersion / 100) * 45}px`
                        }}
                      ></div>
                    </div>
                    
                    <span className="text-[8px] font-bold text-slate-400 mt-1">CỐC ĐO NƯỚC TRÀN</span>
                  </div>

                </div>

                {/* Interactive Physics Balance verification */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Anchor size={16} />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Đo đạc & Kiểm chứng định luật
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">LỰC KẾ TRÊN KHÔNG</span>
                      <span className="text-xs font-mono font-black text-slate-850 dark:text-slate-100">P_kk = {weightInAir.toFixed(1)} N</span>
                    </div>
                    
                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">LỰC KẾ TRONG NƯỚC</span>
                      <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">P_cl = {weightInLiquid.toFixed(2)} N</span>
                    </div>

                    <div className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">NƯỚC TRÀN RA CỐC</span>
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">P_nước = {spilledWaterWeight.toFixed(2)} N</span>
                    </div>
                  </div>

                  {/* Math Verification block */}
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl space-y-2">
                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      PHƯƠNG TRÌNH ĐỊNH LUẬT ÁC-SI-MÉT:
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-800 dark:text-white">
                      F_A = d × V_chìm = {liquidD} × {volumeSubmergedM3.toFixed(6)} = {buoyancyForce.toFixed(2)} N
                    </div>
                    
                    <div className="text-xs font-bold font-mono text-slate-800 dark:text-white border-t border-indigo-150 dark:border-indigo-900 pt-1.5 flex justify-between">
                      <span>• P_kk - P_cl = {weightInAir.toFixed(1)} - {weightInLiquid.toFixed(2)} =</span>
                      <span className="text-emerald-600">{buoyancyForce.toFixed(2)} N (= F_A)</span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      Thí nghiệm đã chứng minh thực nghiệm: Lực nâng của chất lỏng đẩy vật lên (lực đẩy Ác-si-mét) có giá trị <strong>bằng đúng trọng lượng của khối nước bị tràn ra ngoài</strong>!
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 10: CÔNG CƠ HỌC VÀ CÔNG SUẤT                      */}
        {/* ======================================================== */}
        {lessonId === 'bai-10' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Settings side menu */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Chọn tải trọng & độ cao</h4>
                </div>

                {/* Mass weight */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Khối lượng vật nâng (m):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l10Mass} kg</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="10"
                    value={l10Mass}
                    onChange={(e) => setL10Mass(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>10 kg</span>
                    <span>150 kg</span>
                  </div>
                </div>

                {/* Height s */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Độ cao kéo lên (h):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l10Height} m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="18"
                    step="1"
                    value={l10Height}
                    onChange={(e) => setL10Height(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>2 m</span>
                    <span>18 m</span>
                  </div>
                </div>

                {/* Time slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Thời gian kéo (t):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">{l10Time} giây</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={l10Time}
                    onChange={(e) => setL10Time(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>2 s</span>
                    <span>12 s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartL10}
                  disabled={l10IsAnimating}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Play size={14} fill="currentColor" />
                  <span>BẮT ĐẦU KÉO THỬ</span>
                </button>

              </div>

              {/* Simulation Canvas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2D Pulley/Cable simulation */}
                <div className="h-64 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 p-4">
                  {/* Building structure background */}
                  <div className="absolute right-4 top-4 bottom-4 w-28 bg-slate-800 border-l border-slate-700/80 rounded flex flex-col justify-around px-2 opacity-50">
                    <div className="h-4 bg-slate-900 border border-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-900 border border-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-900 border border-slate-700 rounded"></div>
                    <div className="h-4 bg-slate-900 border border-slate-700 rounded"></div>
                  </div>

                  {/* Top Pulley wheel */}
                  <div className="absolute left-[30%] top-6 w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center animate-spin" style={{ animationDuration: l10IsAnimating ? '1.5s' : '0s' }}>
                    <div className="w-1.5 h-8 bg-slate-800"></div>
                  </div>
                  {/* Motor fixture */}
                  <div className="absolute left-[25%] top-2 w-20 h-4 bg-slate-600 rounded"></div>

                  {/* Wire/cable lines */}
                  {/* Left line hanging down to ground */}
                  <line x1="120" y1="26" x2="120" y2="180" className="stroke-slate-500 stroke-[1.5]" />
                  {/* Right line to load block */}
                  <div
                    className="absolute bg-slate-400 w-0.5 transition-all duration-100 ease-linear"
                    style={{
                      left: '140px',
                      top: '26px',
                      // as height goes up, cable shortens
                      height: `calc(180px - ${l10Progress * 1.2}px)`
                    }}
                  ></div>

                  {/* Pulley Load block Container */}
                  <div
                    className="absolute w-12 h-10 bg-slate-700 border-2 border-slate-500 rounded flex flex-col items-center justify-center text-white text-[8px] font-mono shadow-md transition-all duration-100 ease-linear"
                    style={{
                      left: '116px',
                      // starts at bottom (180px - load_height) and moves up
                      top: `calc(160px - ${l10Progress * 1.2}px)`
                    }}
                  >
                    <span className="font-bold text-amber-400">{l10Mass} kg</span>
                    <span>📦 TẢI</span>
                  </div>

                  {/* Bottom ground line */}
                  <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-600"></div>

                  {/* Live HUD box with calculation */}
                  <div className="absolute bottom-6 right-6 bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <div className="font-black text-slate-500 uppercase text-[9px] tracking-wider">Sổ số liệu cơ học:</div>
                    <div className="font-mono text-white space-y-0.5">
                      <p>• Lực kéo F = P = {l10Force} N</p>
                      <p>• Quãng đường s = {l10Height} m</p>
                      <p className="text-emerald-400">• Công thực hiện A = {l10Work} J</p>
                      <p className="text-blue-400">• Công suất P = {l10Power.toFixed(1)} W</p>
                    </div>
                  </div>

                  {/* Motor working blinker */}
                  {l10IsAnimating && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-950 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/30 animate-pulse">
                      <Zap size={10} className="fill-amber-500" />
                      <span>ĐANG THỰC HIỆN CÔNG...</span>
                    </div>
                  )}

                </div>

                {/* Conceptual Lesson summary */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-indigo-600 animate-pulse" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Ý nghĩa Vật lý của công và công suất
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">Công cơ học A = F.s</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Là lượng năng lượng truyền cho vật khi có lực làm vật chuyển dời quãng đường s. Đơn vị đo là Jun (J) hay Calo.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">Công suất P = A / t</span>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Đặc trưng cho <strong>tốc độ mạnh hay yếu</strong> của máy kéo. Cùng nâng một vật nặng, máy nào tốn ít thời gian t hơn sẽ có công suất P lớn hơn gấp bội!
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}


        {/* ======================================================== */}
        {/* LESSON 18: PHƯƠNG TRÌNH CÂN BẰNG NHIỆT (HEAT BALANCE)    */}
        {/* ======================================================== */}
        {lessonId === 'bai-18' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left sliders menu */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sliders size={16} />
                  <h4 className="text-xs font-black uppercase tracking-wider">Thiết lập nhiệt lượng</h4>
                </div>

                {/* Cup 1: Hot water */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="text-xs font-black text-rose-600 uppercase tracking-wide">Cốc A (Nước Nóng)</div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Khối lượng m₁:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l18M1} kg (lít)</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={l18M1}
                      disabled={l18IsMixed}
                      onChange={(e) => setL18M1(Number(e.target.value))}
                      className="w-full accent-rose-600 disabled:opacity-40"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Nhiệt độ T₁:</span>
                      <span className="font-mono text-rose-600">{l18T1}°C</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={l18T1}
                      disabled={l18IsMixed}
                      onChange={(e) => setL18T1(Number(e.target.value))}
                      className="w-full accent-rose-600 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Cup 2: Cold water */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl space-y-3">
                  <div className="text-xs font-black text-blue-600 uppercase tracking-wide">Cốc B (Nước Lạnh)</div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Khối lượng m₂:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-100">{l18M2} kg (lít)</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={l18M2}
                      disabled={l18IsMixed}
                      onChange={(e) => setL18M2(Number(e.target.value))}
                      className="w-full accent-blue-600 disabled:opacity-40"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Nhiệt độ T₂:</span>
                      <span className="font-mono text-blue-600">{l18T2}°C</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="5"
                      value={l18T2}
                      disabled={l18IsMixed}
                      onChange={(e) => setL18T2(Number(e.target.value))}
                      className="w-full accent-blue-600 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Trigger button */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setL18IsMixed(true)}
                    disabled={l18IsMixed}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>☕ PHA TRỘN CHẤT</span>
                  </button>
                  {l18IsMixed && (
                    <button
                      type="button"
                      onClick={() => setL18IsMixed(false)}
                      className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-750"
                      title="Làm mới cốc"
                    >
                      <RotateCcw size={15} />
                    </button>
                  )}
                </div>

              </div>

              {/* Simulation visual display */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 2D Calorimeter beaker mix animation */}
                <div className="h-56 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 p-4 flex justify-around items-end">
                  
                  {/* Left: Cup A (Hot) */}
                  {!l18IsMixed && (
                    <div className="w-16 h-24 bg-slate-800/40 border-x-2 border-b-2 border-red-500/80 rounded-b-lg relative flex items-end shadow-md">
                      {/* Red Hot Liquid */}
                      <div
                        className="w-full bg-red-500/60 rounded-b"
                        style={{ height: `${l18M1 * 60}px` }}
                      ></div>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-400 font-mono text-center">
                        m₁={l18M1}kg<br />{l18T1}°C
                      </span>
                    </div>
                  )}

                  {/* Center: Insulated Calorimeter beaker */}
                  <div className="w-32 h-36 bg-slate-800/20 border-x-4 border-b-4 border-indigo-500/60 rounded-b-xl relative flex items-end justify-center p-0.5">
                    
                    {/* Double insulation layer line */}
                    <div className="absolute inset-x-1 bottom-1 top-0 border-x border-b border-dashed border-indigo-400/20 rounded-b"></div>

                    {/* Mixed Liquid filling up */}
                    {l18IsMixed && (
                      <div
                        className="w-full rounded-b-lg bg-gradient-to-t from-blue-500/40 to-red-500/40 transition-all duration-1000 ease-out flex items-center justify-center relative"
                        style={{
                          height: `${(l18M1 + l18M2) * 55}px`
                        }}
                      >
                        {/* Interactive dynamic temperature indicator inside water */}
                        <span className="text-[10px] font-mono font-black text-white bg-slate-950/80 px-2 py-0.5 rounded-full border border-white/20">
                          {l18TempProgress.toFixed(1)}°C
                        </span>
                      </div>
                    )}

                    {/* Insulated cap label */}
                    <span className="absolute bottom-1 right-2 text-[8px] font-bold text-slate-500">
                      BÌNH NHIỆT LƯỢNG KẾ
                    </span>
                  </div>

                  {/* Right: Cup B (Cold) */}
                  {!l18IsMixed && (
                    <div className="w-16 h-24 bg-slate-800/40 border-x-2 border-b-2 border-blue-500/80 rounded-b-lg relative flex items-end shadow-md">
                      {/* Blue Cold Liquid */}
                      <div
                        className="w-full bg-blue-500/60 rounded-b"
                        style={{ height: `${l18M2 * 60}px` }}
                      ></div>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-400 font-mono text-center">
                        m₂={l18M2}kg<br />{l18T2}°C
                      </span>
                    </div>
                  )}

                  {/* Thermometer scale HUD overlay on right of calorimeter */}
                  {l18IsMixed && (
                    <div className="absolute top-4 right-4 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                      <Thermometer size={20} className="text-red-500 animate-pulse" />
                      <div>
                        <span className="text-[8px] text-slate-500 font-bold block leading-none">CÂN BẰNG NHIỆT t_cb</span>
                        <span className="text-xs font-mono font-black text-white">
                          {l18TempProgress.toFixed(1)} <span className="text-red-400">°C</span>
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Quantitative formulas breakdown */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Thermometer size={16} />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Phương trình cân bằng nhiệt lượng
                    </h5>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 text-xs leading-normal">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Nhiệt lượng tỏa ra (Vật nóng A):</span>
                      <span className="font-mono font-bold text-rose-600">Q_tỏa = m₁ · c · (T₁ - t_cb)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Q_tỏa = {l18M1} · 4200 · ({l18T1} - {l18EquilibriumTemp.toFixed(1)}) = <span className="font-bold text-rose-600">{l18Q_toa.toFixed(0)} J</span>
                    </p>

                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pt-1 pb-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Nhiệt lượng thu vào (Vật lạnh B):</span>
                      <span className="font-mono font-bold text-blue-600">Q_thu = m₂ · c · (t_cb - T₂)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Q_thu = {l18M2} · 4200 · ({l18EquilibriumTemp.toFixed(1)} - {l18T2}) = <span className="font-bold text-blue-600">{l18Q_thu.toFixed(0)} J</span>
                    </p>

                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                      💡 Đối chiếu bảo toàn năng lượng: Q_tỏa = Q_thu ({l18Q_toa.toFixed(0)} J = {l18Q_thu.toFixed(0)} J). Nhiệt tự truyền từ cốc nóng sang cốc lạnh cho đến khi nhiệt độ cân bằng ổn định ở mức {l18EquilibriumTemp.toFixed(1)}°C!
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
