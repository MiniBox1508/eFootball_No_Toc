"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useReactToPrint } from "react-to-print";
import {
  Trophy,
  Trash2,
  Printer,
  Shuffle,
  CheckCircle,
  X,
  Users,
  RefreshCw,
  Star,
} from "lucide-react";
import confetti from "canvas-confetti";

// --- Types ---
type RoundKey =
  | "vongLoai1"
  | "vongLoai2"
  | "nhanhThua"
  | "tuKet"
  | "banKet"
  | "chungKet"
  | "tranhHang3";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#82E0AA",
  "#F1948A",
  "#85C1E9",
];

// --- Sub-component: MatchBox ---
interface MatchBoxProps {
  value: string;
  label?: string;
  showWheel?: boolean;
  onValueChange: (val: string) => void;
  onWheelClick?: () => void;
  onWinClick: () => void;
}

const MatchBox = ({
  value,
  label,
  showWheel,
  onValueChange,
  onWheelClick,
  onWinClick,
}: MatchBoxProps) => (
  <div className="flex flex-col w-full group transition-all duration-300 print:break-inside-avoid">
    {label && (
      <span className="text-[11px] text-slate-500 font-bold mb-1.5 uppercase text-center tracking-widest opacity-80 print:text-black print:opacity-100">
        {label}
      </span>
    )}
    <div className="bg-slate-800/95 border border-slate-700 rounded-xl overflow-hidden flex items-stretch shadow-xl min-h-[5rem] transition-all group-hover:border-indigo-500 group-hover:bg-slate-800 print:bg-gray-100 print:border-gray-400 print:shadow-none">
      <textarea
        className="bg-transparent px-3 py-2 text-sm w-full outline-none text-slate-100 text-center font-bold placeholder-slate-700 resize-none flex items-center justify-center leading-snug overflow-hidden print:text-black"
        value={value}
        rows={2}
        placeholder="..."
        onChange={(e) => onValueChange(e.target.value)}
        style={{
          scrollbarWidth: "none",
          fontFamily: "'Be Vietnam Pro', sans-serif",
        }}
      />
      <div className="flex flex-col bg-slate-900/50 border-l border-slate-700 w-12 shrink-0 no-print">
        {showWheel && (
          <button
            type="button"
            onClick={onWheelClick}
            className="flex-1 flex items-center justify-center hover:text-indigo-400 transition-colors border-b border-slate-800"
            title="Bốc thăm"
          >
            <Shuffle size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={onWinClick}
          className="flex-1 flex items-center justify-center hover:text-green-400 transition-colors"
          title="Thắng trận"
        >
          <CheckCircle size={16} />
        </button>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function TournamentApp() {
  const componentRef = useRef<HTMLDivElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Lich_Thi_Dau_No_Toc_2026",
    pageStyle: `
      @page { size: landscape; margin: 5mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
  });

  const [inputText, setInputText] = useState("");
  const [data, setData] = useState<Record<RoundKey, string[]>>({
    vongLoai1: Array(14).fill(""),
    vongLoai2: ["Đội Chờ 1", "", "", "", "", "", "", ""],
    nhanhThua: Array(4).fill(""),
    tuKet: ["Hạt Giống 1", "", "", "", "", "", "", "Hạt Giống 2"],
    banKet: Array(4).fill(""),
    chungKet: Array(2).fill(""),
    tranhHang3: Array(2).fill(""),
  });

  const [winnersPool, setWinnersPool] = useState<{
    vl2: string[];
    nt: string[];
  }>({
    vl2: [],
    nt: [],
  });

  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [targetCell, setTargetCell] = useState<{
    round: RoundKey;
    index: number;
  } | null>(null);

  const playerList = useMemo(
    () =>
      inputText
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    [inputText],
  );

  useEffect(() => {
    const combined = [...winnersPool.vl2, ...winnersPool.nt].filter(Boolean);
    if (combined.length > 0) {
      setInputText(combined.join("\n"));
    }
  }, [winnersPool]);

  // --- LOGIC ĐÓNG MỞ VÀ RESET VÒNG QUAY ---

  const openWheel = (round: RoundKey, index: number) => {
    // Luôn reset về trạng thái bình thường khi mở mới
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setWinner(null);
    setSpinning(false);
    setTargetCell({ round, index });
    setIsWheelOpen(true);
  };

  const closeWheelManual = () => {
    // 1. Dọn dẹp timer
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);

    // 2. Hủy người chiến thắng và trạng thái quay nếu đang quay
    setSpinning(false);
    setWinner(null);

    // 3. Đóng modal
    setIsWheelOpen(false);
  };

  const updateCell = useCallback(
    (round: RoundKey, index: number, value: string) => {
      setData((prev) => ({
        ...prev,
        [round]: prev[round].map((v, i) => (i === index ? value : v)),
      }));
    },
    [],
  );

  const handleWin = (round: RoundKey, index: number) => {
    const winnerName = data[round][index];
    if (!winnerName) return;

    const newData = { ...data };
    const newWinnersPool = { ...winnersPool };

    if (round === "vongLoai1") {
      const matchIdx = Math.floor(index / 2);
      if (matchIdx === 0) newData.vongLoai2[1] = winnerName;
      else if (matchIdx < 7) {
        const nextSlot = matchIdx + 1;
        if (nextSlot < 8) newData.vongLoai2[nextSlot] = winnerName;
      }
    } else if (round === "vongLoai2") {
      const opponentIdx = index % 2 === 0 ? index + 1 : index - 1;
      const loserName = data.vongLoai2[opponentIdx];
      const matchIdx = Math.floor(index / 2);
      if (loserName) newData.nhanhThua[matchIdx] = loserName;

      const updatedVl2Winners = [...newWinnersPool.vl2];
      updatedVl2Winners[matchIdx] = winnerName;
      newWinnersPool.vl2 = updatedVl2Winners;
    } else if (round === "nhanhThua") {
      const matchIdx = Math.floor(index / 2);
      const updatedNtWinners = [...newWinnersPool.nt];
      updatedNtWinners[matchIdx] = winnerName;
      newWinnersPool.nt = updatedNtWinners;
    } else if (round === "tuKet") {
      const matchIdx = Math.floor(index / 2);
      newData.banKet[matchIdx] = winnerName;
    } else if (round === "banKet") {
      const matchIdx = Math.floor(index / 2);
      const opponentIdx = index % 2 === 0 ? index + 1 : index - 1;
      const loserName = data[round][opponentIdx];
      newData.chungKet[matchIdx] = winnerName;
      if (loserName) newData.tranhHang3[matchIdx] = loserName;
    }

    setData(newData);
    setWinnersPool(newWinnersPool);
    confetti({ particleCount: 100, spread: 50, origin: { y: 0.8 } });
  };

  const startSpin = () => {
    if (spinning || playerList.length === 0) return;

    // Hủy timer tự động đóng nếu người dùng nhấn quay tiếp
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);

    setSpinning(true);
    setWinner(null); // Ẩn thông báo người thắng cũ để quay lượt mới

    const extraDegrees = 2160 + Math.random() * 360;
    const newRotation = rotation + extraDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const actualDegree = newRotation % 360;
      const segmentAngle = 360 / playerList.length;
      const winningIndex =
        Math.floor((360 - (actualDegree % 360)) / segmentAngle) %
        playerList.length;
      const selectedWinner = playerList[winningIndex];

      setWinner(selectedWinner);

      if (targetCell) {
        // Tìm ô trống tiếp theo trong vòng đấu nếu ô hiện tại đã có tên
        let finalIndex = targetCell.index;
        const currentRoundData = data[targetCell.round];

        if (
          currentRoundData[finalIndex] !== "" &&
          currentRoundData[finalIndex] !== "..."
        ) {
          const nextEmpty = currentRoundData.findIndex(
            (val, idx) => idx > finalIndex && (val === "" || val === "..."),
          );
          if (nextEmpty !== -1) finalIndex = nextEmpty;
        }

        updateCell(targetCell.round, finalIndex, selectedWinner);

        // Cập nhật targetCell cho lần quay tiếp theo (nếu người dùng không đóng)
        setTargetCell({ ...targetCell, index: finalIndex });

        const newLines = inputText
          .split("\n")
          .filter((line) => line.trim() !== selectedWinner);
        setInputText(newLines.join("\n"));
      }

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      // Tính năng tự động đóng sau 15 giây (Yêu cầu mới)
      autoCloseTimerRef.current = setTimeout(() => {
        setIsWheelOpen(false);
        setWinner(null);
      }, 15000);
    }, 4000);
  };

  return (
    <div
      className="min-h-screen bg-[#05070a] text-slate-200 p-4 md:p-10 flex flex-col items-center"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,700;0,900;1,900&display=swap");
        body {
          font-family: "Be Vietnam Pro", sans-serif;
          overflow-x: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          main {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            gap: 1% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          main > div {
            min-width: 0 !important;
            flex: 1 !important;
            margin: 0 5px !important;
          }
          h3,
          h4 {
            color: black !important;
            border-bottom: 2px solid #333 !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="w-full max-w-[95%] flex flex-col md:flex-row justify-between items-center mb-16 gap-8 border-b border-white/5 pb-10 no-print">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 bg-clip-text text-transparent uppercase tracking-tighter italic leading-tight">
            Efootball Nợ Tộc 2026
          </h1>
          <p className="text-slate-500 text-sm font-bold tracking-[0.6em] uppercase mt-2 opacity-50 text-center md:text-left">
            Tournament System Pro Edition
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all shadow-2xl"
          >
            <Printer size={20} />{" "}
            <span className="hidden sm:inline">IN LỊCH PDF</span>
          </button>
          <button
            onClick={() => {
              if (confirm("Làm mới toàn bộ dữ liệu?")) window.location.reload();
            }}
            className="p-4 text-red-500 border border-red-900/30 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </header>

      {/* Bracket Board */}
      <main
        ref={componentRef}
        className="w-full max-w-[100%] flex flex-row gap-[1.5%] justify-between p-10 bg-slate-900/20 rounded-[4rem] border border-white/5 shadow-3xl overflow-x-auto min-h-[950px] backdrop-blur-sm print:min-h-0"
      >
        {/* Vòng Loại 1 */}
        <div className="flex flex-col justify-between w-[16%] min-w-[210px]">
          <h3 className="text-blue-500 font-black uppercase text-center text-[1.125rem] tracking-widest mb-10 border-b border-blue-900/30 pb-3">
            Vòng Loại 1
          </h3>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-4 py-2">
              <MatchBox
                value={data.vongLoai1[i * 2]}
                label={`Trận ${i + 1}`}
                showWheel
                onValueChange={(v) => updateCell("vongLoai1", i * 2, v)}
                onWheelClick={() => openWheel("vongLoai1", i * 2)}
                onWinClick={() => handleWin("vongLoai1", i * 2)}
              />
              <MatchBox
                value={data.vongLoai1[i * 2 + 1]}
                showWheel
                onValueChange={(v) => updateCell("vongLoai1", i * 2 + 1, v)}
                onWheelClick={() => openWheel("vongLoai1", i * 2 + 1)}
                onWinClick={() => handleWin("vongLoai1", i * 2 + 1)}
              />
            </div>
          ))}
        </div>

        {/* Vòng Loại 2 & Nhánh Thua */}
        <div className="flex flex-col justify-around w-[15%] min-w-[210px]">
          <div className="space-y-12">
            <h3 className="text-purple-500 font-black uppercase text-center text-[1.125rem] tracking-widest mb-10 border-b border-purple-900/30 pb-3">
              Vòng Loại 2
            </h3>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <MatchBox
                  value={data.vongLoai2[i * 2]}
                  label={`Vòng 2 - T${i + 1}`}
                  onValueChange={(v) => updateCell("vongLoai2", i * 2, v)}
                  onWinClick={() => handleWin("vongLoai2", i * 2)}
                />
                <MatchBox
                  value={data.vongLoai2[i * 2 + 1]}
                  onValueChange={(v) => updateCell("vongLoai2", i * 2 + 1, v)}
                  onWinClick={() => handleWin("vongLoai2", i * 2 + 1)}
                />
              </div>
            ))}
          </div>
          <div className="mt-14 pt-10 border-t border-white/5">
            <h4 className="text-pink-600 font-black uppercase text-[1.125rem] text-center mb-6 tracking-widest border-b border-pink-900/30 pb-3">
              Nhánh Thua
            </h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <MatchBox
                  value={data.nhanhThua[0]}
                  label="Trận 1 NT"
                  onValueChange={(v) => updateCell("nhanhThua", 0, v)}
                  onWinClick={() => handleWin("nhanhThua", 0)}
                />
                <MatchBox
                  value={data.nhanhThua[1]}
                  onValueChange={(v) => updateCell("nhanhThua", 1, v)}
                  onWinClick={() => handleWin("nhanhThua", 1)}
                />
              </div>
              <div className="space-y-2">
                <MatchBox
                  value={data.nhanhThua[2]}
                  label="Trận 2 NT"
                  onValueChange={(v) => updateCell("nhanhThua", 2, v)}
                  onWinClick={() => handleWin("nhanhThua", 2)}
                />
                <MatchBox
                  value={data.nhanhThua[3]}
                  onValueChange={(v) => updateCell("nhanhThua", 3, v)}
                  onWinClick={() => handleWin("nhanhThua", 3)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tứ Kết */}
        <div className="flex flex-col justify-around w-[15%] min-w-[210px]">
          <h3 className="text-green-400 font-black uppercase text-center text-[1.125rem] tracking-widest mb-10 border-b border-green-900/30 pb-3">
            Tứ Kết
          </h3>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4 py-12">
              <MatchBox
                value={data.tuKet[i * 2]}
                label={`Tứ Kết ${i + 1}`}
                showWheel={true}
                onValueChange={(v) => updateCell("tuKet", i * 2, v)}
                onWheelClick={() => openWheel("tuKet", i * 2)}
                onWinClick={() => handleWin("tuKet", i * 2)}
              />
              <MatchBox
                value={data.tuKet[i * 2 + 1]}
                showWheel={true}
                onValueChange={(v) => updateCell("tuKet", i * 2 + 1, v)}
                onWheelClick={() => openWheel("tuKet", i * 2 + 1)}
                onWinClick={() => handleWin("tuKet", i * 2 + 1)}
              />
            </div>
          ))}
        </div>

        {/* Bán Kết */}
        <div className="flex flex-col justify-around w-[15%] min-w-[210px]">
          <h3 className="text-yellow-500 font-black uppercase text-center text-[1.125rem] tracking-widest mb-10 border-b border-yellow-900/30 pb-3">
            Bán Kết
          </h3>
          <div className="space-y-80 print:space-y-40">
            <div className="space-y-4">
              <MatchBox
                value={data.banKet[0]}
                label="Bán kết 1"
                onValueChange={(v) => updateCell("banKet", 0, v)}
                onWinClick={() => handleWin("banKet", 0)}
              />
              <MatchBox
                value={data.banKet[1]}
                onValueChange={(v) => updateCell("banKet", 1, v)}
                onWinClick={() => handleWin("banKet", 1)}
              />
            </div>
            <div className="space-y-4">
              <MatchBox
                value={data.banKet[2]}
                label="Bán kết 2"
                onValueChange={(v) => updateCell("banKet", 2, v)}
                onWinClick={() => handleWin("banKet", 2)}
              />
              <MatchBox
                value={data.banKet[3]}
                onValueChange={(v) => updateCell("banKet", 3, v)}
                onWinClick={() => handleWin("banKet", 3)}
              />
            </div>
          </div>
        </div>

        {/* Chung Kết */}
        <div className="flex flex-col justify-center w-[18%] min-w-[250px] gap-64 print:gap-32">
          <div className="relative text-center scale-125 print:scale-100">
            <Trophy
              className="text-yellow-400 mx-auto mb-8 drop-shadow-[0_0_35px_rgba(234,179,8,0.5)] no-print"
              size={90}
            />
            <h3 className="text-red-600 font-black uppercase text-[2.25rem] mb-8 tracking-tighter italic leading-none">
              Chung Kết
            </h3>
            <div className="space-y-4">
              <MatchBox
                value={data.chungKet[0]}
                onValueChange={(v) => updateCell("chungKet", 0, v)}
                onWinClick={() => handleWin("chungKet", 0)}
              />
              <MatchBox
                value={data.chungKet[1]}
                onValueChange={(v) => updateCell("chungKet", 1, v)}
                onWinClick={() => handleWin("chungKet", 1)}
              />
            </div>
          </div>
          <div className="space-y-4 border-t border-white/5 pt-14 print:pt-4">
            <h4 className="text-center text-slate-400 font-black uppercase text-[1.125rem] tracking-widest border-b border-slate-800 pb-3 mb-6">
              Tranh Hạng 3
            </h4>
            <MatchBox
              value={data.tranhHang3[0]}
              onValueChange={(v) => updateCell("tranhHang3", 0, v)}
              onWinClick={() => handleWin("tranhHang3", 0)}
            />
            <MatchBox
              value={data.tranhHang3[1]}
              onValueChange={(v) => updateCell("tranhHang3", 1, v)}
              onWinClick={() => handleWin("tranhHang3", 1)}
            />
          </div>
        </div>
      </main>

      {/* WHEEL MODAL */}
      {isWheelOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-slate-900 border border-white/10 rounded-[4rem] w-full max-w-6xl h-[780px] flex overflow-hidden shadow-2xl relative">
            {/* Nút đóng "X" */}
            <button
              onClick={closeWheelManual}
              className="absolute top-12 right-12 text-slate-600 hover:text-white z-50 transition-transform hover:rotate-90"
            >
              <X size={48} />
            </button>

            <div className="w-80 border-r border-white/5 p-10 flex flex-col bg-black/40">
              <h3 className="font-black uppercase text-xs tracking-widest text-indigo-400 mb-8 flex items-center gap-3">
                <Users size={20} /> DANH SÁCH QUAY
              </h3>
              <textarea
                className="flex-1 bg-black/50 border border-white/5 rounded-3xl p-6 text-sm outline-none focus:border-indigo-500/50 transition-all resize-none font-bold custom-scrollbar text-indigo-200 leading-relaxed"
                placeholder="Nhập danh sách..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
              />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 relative overflow-hidden">
              <div className="relative w-[500px] h-[500px] mb-12">
                {/* Winner Overlay */}
                {winner && !spinning && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 rounded-full animate-in zoom-in border-8 border-yellow-500/20 shadow-[0_0_100px_rgba(234,179,8,0.2)]">
                    <div className="text-center p-10">
                      <Star
                        className="text-yellow-400 mx-auto mb-4 animate-bounce"
                        size={72}
                      />
                      <p className="text-indigo-400 font-black text-2xl uppercase mb-3 tracking-widest">
                        WINNER
                      </p>
                      <h2 className="text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                        {winner}
                      </h2>
                      <div className="mt-12 flex flex-col items-center">
                        <div className="h-1.5 w-40 bg-indigo-600 rounded-full animate-pulse"></div>
                        <p className="text-slate-600 text-[12px] mt-6 uppercase font-bold tracking-widest italic">
                          Tự động đóng sau 15 giây
                        </p>
                        <p className="text-indigo-500 text-[10px] mt-2 font-bold uppercase">
                          Nhấn "Quay ngay" để bốc ô tiếp theo
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-2xl">
                  <div className="w-14 h-18 bg-red-600 [clip-path:polygon(50%_100%,0%_0%,100%_0%)]" />
                </div>
                <div
                  className="w-full h-full rounded-full border-[24px] border-slate-800 shadow-3xl overflow-hidden bg-slate-800"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                      ? "transform 4.5s cubic-bezier(0.1, 0, 0, 1)"
                      : "none",
                  }}
                >
                  {playerList.length > 0 && (
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {playerList.map((name, i) => {
                        const angle = 360 / playerList.length;
                        const startAngle = i * angle;
                        const x1 =
                          50 +
                          50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                        const y1 =
                          50 +
                          50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                        const x2 =
                          50 +
                          50 *
                            Math.cos(
                              (Math.PI * (startAngle + angle - 90)) / 180,
                            );
                        const y2 =
                          50 +
                          50 *
                            Math.sin(
                              (Math.PI * (startAngle + angle - 90)) / 180,
                            );
                        const textAngle = startAngle + angle / 2 - 90;
                        const tx =
                          50 + 35 * Math.cos((Math.PI * textAngle) / 180);
                        const ty =
                          50 + 35 * Math.sin((Math.PI * textAngle) / 180);
                        return (
                          <g key={i}>
                            <path
                              d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                              fill={COLORS[i % COLORS.length]}
                              stroke="#0f172a"
                              strokeWidth="0.3"
                            />
                            <text
                              x={tx}
                              y={ty}
                              transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                              fill="white"
                              fontSize={Math.max(1.8, 30 / playerList.length)}
                              fontWeight="900"
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="uppercase tracking-tighter"
                              style={{
                                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                                fontFamily: "'Be Vietnam Pro', sans-serif",
                              }}
                            >
                              {name.length > 12
                                ? name.slice(0, 10) + ".."
                                : name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              </div>
              <button
                onClick={startSpin}
                disabled={spinning || playerList.length < 1}
                className="w-full max-w-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-7 rounded-[3rem] font-black text-3xl uppercase shadow-[0_25px_60px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 tracking-widest"
              >
                {spinning ? "ĐANG QUAY..." : winner ? "QUAY TIẾP" : "QUAY NGAY"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
