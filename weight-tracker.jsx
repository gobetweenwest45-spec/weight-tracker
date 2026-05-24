import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

const STORAGE_KEY = "weight-tracker-data";

const defaultData = {
  goal: null,
  entries: [],
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function WeightTracker() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [dateInput, setDateInput] = useState(today());
  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [toast, setToast] = useState(null);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result?.value) {
          const parsed = JSON.parse(result.value);
          setData(parsed);
          if (parsed.goal) setGoalInput(String(parsed.goal));
        }
      } catch {
        // no data yet
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (newData) => {
    setData(newData);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Save failed", e);
    }
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const addEntry = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w < 20 || w > 300) {
      showToast("体重を正しく入力してください", "err");
      return;
    }
    const newEntries = data.entries.filter((e) => e.date !== dateInput);
    newEntries.push({ date: dateInput, weight: w });
    newEntries.sort((a, b) => a.date.localeCompare(b.date));
    save({ ...data, entries: newEntries });
    setWeightInput("");
    showToast("記録しました！");
  };

  const saveGoal = () => {
    const g = parseFloat(goalInput);
    if (isNaN(g) || g < 20 || g > 300) {
      showToast("目標体重を正しく入力してください", "err");
      return;
    }
    save({ ...data, goal: g });
    setEditingGoal(false);
    showToast("目標を設定しました！");
  };

  const deleteEntry = (date) => {
    const newEntries = data.entries.filter((e) => e.date !== date);
    save({ ...data, entries: newEntries });
  };

  const latest = data.entries[data.entries.length - 1];
  const diff = data.goal && latest ? (latest.weight - data.goal).toFixed(1) : null;

  const chartData = data.entries.map((e) => ({
    date: formatDate(e.date),
    体重: e.weight,
  }));

  const weights = data.entries.map((e) => e.weight);
  const minW = weights.length ? Math.min(...weights, data.goal || Infinity) - 3 : 40;
  const maxW = weights.length ? Math.max(...weights, data.goal || -Infinity) + 3 : 100;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: "#1a1a2e", border: "1px solid #7c6af7", borderRadius: 10,
          padding: "8px 14px", color: "#fff", fontSize: 14
        }}>
          <div style={{ color: "#a89cf7", marginBottom: 2 }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{payload[0].value} <span style={{ fontSize: 12, color: "#aaa" }}>kg</span></div>
        </div>
      );
    }
    return null;
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c6af7", fontFamily: "'Noto Sans JP', sans-serif" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d1a",
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      color: "#f0eeff",
      padding: "0 0 60px",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1040 0%, #0d0d1a 100%)",
        borderBottom: "1px solid #2a2050",
        padding: "28px 24px 20px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 26 }}>⚖️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", color: "#e8e0ff" }}>体重トラッカー</h1>
              <div style={{ fontSize: 11, color: "#7c6af7", marginTop: 1 }}>Weight Tracker</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
            background: toast.type === "err" ? "#3a1a2a" : "#1a2a3a",
            border: `1px solid ${toast.type === "err" ? "#e05577" : "#7c6af7"}`,
            color: toast.type === "err" ? "#f07090" : "#b8aaff",
            padding: "10px 22px", borderRadius: 30, fontSize: 14, zIndex: 100,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}>
            {toast.msg}
          </div>
        )}

        {/* Status Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
          {/* Current */}
          <div style={{
            background: "linear-gradient(145deg, #16122a, #1e1640)",
            border: "1px solid #2e2860",
            borderRadius: 16, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 11, color: "#7c6af7", marginBottom: 6, letterSpacing: "0.5px" }}>現在の体重</div>
            {latest ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#e8e0ff", lineHeight: 1 }}>
                  {latest.weight}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>kg</div>
                <div style={{ fontSize: 11, color: "#554d88", marginTop: 6 }}>{formatDate(latest.date)}</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#443d66", marginTop: 6 }}>未記録</div>
            )}
          </div>

          {/* Goal */}
          <div style={{
            background: "linear-gradient(145deg, #0d1a16, #111e18)",
            border: "1px solid #1e4030",
            borderRadius: 16, padding: "16px 18px", cursor: "pointer",
          }} onClick={() => setEditingGoal(true)}>
            <div style={{ fontSize: 11, color: "#4caf80", marginBottom: 6, letterSpacing: "0.5px" }}>目標体重</div>
            {data.goal ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#a0f0c0", lineHeight: 1 }}>
                  {data.goal}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>kg</div>
                {diff !== null && (
                  <div style={{
                    fontSize: 11, marginTop: 6,
                    color: parseFloat(diff) <= 0 ? "#4caf80" : "#e05577"
                  }}>
                    {parseFloat(diff) <= 0 ? `目標達成！🎉` : `あと ${diff} kg`}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, color: "#2a4a38", marginTop: 6 }}>タップして設定</div>
            )}
          </div>
        </div>

        {/* Goal editor */}
        {editingGoal && (
          <div style={{
            background: "#111e18", border: "1px solid #2a5040",
            borderRadius: 16, padding: 18, marginTop: 12,
          }}>
            <div style={{ fontSize: 13, color: "#4caf80", marginBottom: 10 }}>目標体重を設定</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="例: 65.0"
                step="0.1"
                style={{
                  flex: 1, background: "#0d1a16", border: "1px solid #2a5040",
                  borderRadius: 10, padding: "10px 14px", color: "#e8f5e0",
                  fontSize: 16, outline: "none",
                }}
              />
              <button onClick={saveGoal} style={{
                background: "#2a7a50", border: "none", borderRadius: 10,
                color: "#fff", fontWeight: 700, fontSize: 14, padding: "0 18px", cursor: "pointer",
              }}>保存</button>
              <button onClick={() => setEditingGoal(false)} style={{
                background: "#1a2a22", border: "1px solid #2a5040", borderRadius: 10,
                color: "#aaa", fontSize: 14, padding: "0 14px", cursor: "pointer",
              }}>✕</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          background: "linear-gradient(145deg, #16122a, #1e1640)",
          border: "1px solid #2e2860", borderRadius: 20, padding: 20, marginTop: 16,
        }}>
          <div style={{ fontSize: 13, color: "#7c6af7", marginBottom: 14, fontWeight: 600 }}>今日の体重を記録</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={{
                flex: 1, background: "#0d0a1e", border: "1px solid #2e2860",
                borderRadius: 10, padding: "10px 12px", color: "#c8c0ff",
                fontSize: 14, outline: "none", colorScheme: "dark",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
                placeholder="体重 (kg)"
                step="0.1"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0d0a1e", border: "1px solid #2e2860",
                  borderRadius: 10, padding: "12px 14px", color: "#e8e0ff",
                  fontSize: 20, fontWeight: 700, outline: "none",
                }}
              />
            </div>
            <button onClick={addEntry} style={{
              background: "linear-gradient(135deg, #7c6af7, #5a48d0)",
              border: "none", borderRadius: 14, color: "#fff",
              fontWeight: 800, fontSize: 16, padding: "0 24px", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(124,106,247,0.4)",
              whiteSpace: "nowrap",
            }}>記録</button>
          </div>
        </div>

        {/* Chart */}
        {data.entries.length >= 2 && (
          <div style={{
            background: "linear-gradient(145deg, #16122a, #1e1640)",
            border: "1px solid #2e2860", borderRadius: 20, padding: "20px 10px 10px",
            marginTop: 16,
          }}>
            <div style={{ fontSize: 13, color: "#7c6af7", marginBottom: 16, fontWeight: 600, paddingLeft: 10 }}>📈 グラフ</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 14, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1a40" />
                <XAxis dataKey="date" tick={{ fill: "#554d88", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[minW, maxW]} tick={{ fill: "#554d88", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {data.goal && (
                  <ReferenceLine y={data.goal} stroke="#4caf80" strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: `目標 ${data.goal}kg`, fill: "#4caf80", fontSize: 10, position: "insideTopRight" }} />
                )}
                <Line
                  type="monotone" dataKey="体重" stroke="#7c6af7"
                  strokeWidth={2.5} dot={{ fill: "#7c6af7", r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#e8e0ff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.entries.length === 1 && (
          <div style={{
            textAlign: "center", color: "#443d66", fontSize: 13, marginTop: 16, padding: 20,
            background: "#16122a", borderRadius: 16, border: "1px solid #2e2860"
          }}>
            もう1件記録するとグラフが表示されます
          </div>
        )}

        {/* History */}
        {data.entries.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: "#7c6af7", fontWeight: 600, marginBottom: 10 }}>📋 記録一覧</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...data.entries].reverse().map((e) => (
                <div key={e.date} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#16122a", border: "1px solid #2e2860",
                  borderRadius: 12, padding: "12px 16px",
                }}>
                  <div style={{ color: "#554d88", fontSize: 13 }}>{e.date}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#e8e0ff" }}>
                    {e.weight} <span style={{ fontSize: 12, color: "#554d88" }}>kg</span>
                  </div>
                  {data.goal && (
                    <div style={{
                      fontSize: 12,
                      color: e.weight <= data.goal ? "#4caf80" : "#e05577",
                      minWidth: 60, textAlign: "right"
                    }}>
                      {e.weight <= data.goal ? "✓ 達成" : `+${(e.weight - data.goal).toFixed(1)}`}
                    </div>
                  )}
                  <button onClick={() => deleteEntry(e.date)} style={{
                    background: "none", border: "none", color: "#332a55",
                    cursor: "pointer", fontSize: 16, padding: "0 0 0 10px",
                    lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.entries.length === 0 && (
          <div style={{
            textAlign: "center", color: "#332a55", fontSize: 14, marginTop: 40,
            padding: "40px 20px",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
            <div>最初の体重を記録しましょう</div>
          </div>
        )}
      </div>
    </div>
  );
}
