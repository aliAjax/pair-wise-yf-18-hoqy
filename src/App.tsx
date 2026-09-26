import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import "./styles.css";

/* ---------------- 班次 ---------------- */

type ShiftId = "A" | "B" | "C";

interface Shift {
  id: ShiftId;
  name: string;
  time: string;
}

const SHIFTS: Shift[] = [
  { id: "A", name: "早班", time: "08:00–16:00" },
  { id: "B", name: "中班", time: "16:00–24:00" },
  { id: "C", name: "晚班", time: "00:00–08:00" },
];

const NEXT_SHIFT: Record<ShiftId, ShiftId> = { A: "B", B: "C", C: "A" };

const shiftName = (id: ShiftId): string =>
  SHIFTS.find((s) => s.id === id)?.name ?? id;

/* ---------------- 字典 ---------------- */

const HOLD_REASONS = ["缺陷未确认", "尺寸待补", "待客户确认", "待复检"];
const POSITIONS = ["主石位", "围石A组", "围石B组", "戒臂", "扣头", "耳钉位"];
const KINDS = ["蓝宝石", "红宝石", "钻石", "祖母绿", "尖晶石"];
const SHAPES = ["圆形", "椭圆", "梨形", "祖母绿切", "垫形", "马眼"];
const CLARITIES = ["VVS", "VS", "SI", "P"];
const CUTS = ["明亮切", "阶梯切", "混合切"];

/* ---------------- 数据模型 ---------------- */

interface Gem {
  id: string; // 宝石编号
  kind: string; // 种类
  shape: string; // 形状
  carat: number; // 克拉重量
  size: string; // 尺寸，空串 = 尺寸待补
  clarity: string; // 净度
  color: string; // 颜色
  cut: string; // 切工
  position: string; // 镶嵌位置
  orderId: string; // 所属订单
  holder: ShiftId; // 当前挂在哪个班次
  origin: ShiftId | null; // 从哪个班接来（退回目标）
  received: boolean; // 是否经交接接手
  status: "todo" | "done"; // 本班处理状态
  reason: string | null; // 留班原因
  defect: string | null; // 缺陷备注
  defectConfirmed: boolean; // 缺陷是否已确认
}

interface OrderInfo {
  id: string;
  title: string;
}

const ORDERS: OrderInfo[] = [
  { id: "SO-1024", title: "蓝宝石围镶戒指" },
  { id: "SO-1025", title: "红宝石吊坠" },
  { id: "SO-1026", title: "祖母绿耳饰" },
];

interface LogEntry {
  id: number;
  time: string;
  shift: string;
  kind: "handover" | "return" | "register" | "info";
  text: string;
}

/* ---------------- 种子数据 ---------------- */

const SEED_GEMS: Gem[] = [
  // 早班
  { id: "ST-2048", kind: "蓝宝石", shape: "椭圆", carat: 1.2, size: "6×4mm", clarity: "VS", color: "皇家蓝", cut: "明亮切", position: "主石位", orderId: "SO-1024", holder: "A", origin: null, received: false, status: "done", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2049", kind: "钻石", shape: "圆形", carat: 0.08, size: "2.6mm", clarity: "VS", color: "白", cut: "明亮切", position: "围石A组", orderId: "SO-1024", holder: "A", origin: null, received: false, status: "done", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2050", kind: "钻石", shape: "圆形", carat: 0.08, size: "2.6mm", clarity: "VS", color: "白", cut: "明亮切", position: "围石A组", orderId: "SO-1024", holder: "A", origin: null, received: false, status: "todo", reason: null, defect: "台面细微划痕", defectConfirmed: false },
  { id: "ST-2051", kind: "红宝石", shape: "椭圆", carat: 0.9, size: "", clarity: "VVS", color: "鸽血红", cut: "明亮切", position: "主石位", orderId: "SO-1025", holder: "A", origin: null, received: false, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2053", kind: "钻石", shape: "圆形", carat: 0.05, size: "2.2mm", clarity: "SI", color: "白", cut: "明亮切", position: "戒臂", orderId: "SO-1024", holder: "A", origin: null, received: false, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2054", kind: "祖母绿", shape: "祖母绿切", carat: 0.75, size: "5×4mm", clarity: "VS", color: "艳绿", cut: "阶梯切", position: "主石位", orderId: "SO-1026", holder: "A", origin: null, received: false, status: "done", reason: null, defect: null, defectConfirmed: false },
  // 中班
  { id: "ST-2044", kind: "蓝宝石", shape: "圆形", carat: 0.6, size: "5.0mm", clarity: "VS", color: "矢车菊", cut: "明亮切", position: "围石B组", orderId: "SO-1024", holder: "B", origin: "A", received: true, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2045", kind: "钻石", shape: "圆形", carat: 0.1, size: "3.0mm", clarity: "VS", color: "白", cut: "明亮切", position: "围石A组", orderId: "SO-1025", holder: "B", origin: "A", received: true, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2046", kind: "钻石", shape: "梨形", carat: 0.5, size: "6×4mm", clarity: "VS", color: "白", cut: "混合切", position: "扣头", orderId: "SO-1025", holder: "B", origin: null, received: false, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2047", kind: "钻石", shape: "圆形", carat: 0.03, size: "1.8mm", clarity: "SI", color: "白", cut: "明亮切", position: "戒臂", orderId: "SO-1026", holder: "B", origin: null, received: false, status: "done", reason: null, defect: null, defectConfirmed: false },
  // 晚班
  { id: "ST-2038", kind: "祖母绿", shape: "梨形", carat: 0.8, size: "7×5mm", clarity: "VS", color: "艳绿", cut: "混合切", position: "主石位", orderId: "SO-1026", holder: "C", origin: null, received: false, status: "todo", reason: null, defect: "内部棉裂，待确认是否影响镶嵌", defectConfirmed: false },
  { id: "ST-2039", kind: "钻石", shape: "圆形", carat: 0.06, size: "2.4mm", clarity: "VS", color: "白", cut: "明亮切", position: "耳钉位", orderId: "SO-1026", holder: "C", origin: null, received: false, status: "done", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2040", kind: "钻石", shape: "圆形", carat: 0.04, size: "", clarity: "SI", color: "白", cut: "明亮切", position: "耳钉位", orderId: "SO-1026", holder: "C", origin: null, received: false, status: "todo", reason: null, defect: null, defectConfirmed: false },
  { id: "ST-2041", kind: "钻石", shape: "圆形", carat: 0.04, size: "2.0mm", clarity: "SI", color: "白", cut: "明亮切", position: "围石B组", orderId: "SO-1025", holder: "C", origin: "B", received: true, status: "todo", reason: null, defect: null, defectConfirmed: false },
];

const SEED_LOGS: LogEntry[] = [
  { id: 2, time: "今天 16:10", shift: "中班", kind: "handover", text: "中班 → 晚班 交接 1 颗：ST-2041" },
  { id: 1, time: "今天 08:05", shift: "早班", kind: "handover", text: "早班 → 中班 交接 2 颗：ST-2044、ST-2045" },
];

/* ---------------- 工具 ---------------- */

const now = (): string =>
  `今天 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;

/** 留班时自动建议的原因 */
const suggestReason = (g: Gem): string => {
  if (!g.size) return "尺寸待补";
  if (g.defect && !g.defectConfirmed) return "缺陷未确认";
  return "待复检";
};

/** 阻止标记完成的原因（尺寸待补 / 缺陷未确认），可完成时返回 null */
const blockReason = (g: Gem): string | null => {
  if (!g.size) return "尺寸待补，无法标记完成";
  if (g.defect && !g.defectConfirmed) return "缺陷未确认，无法标记完成";
  return null;
};

/* ---------------- 镶嵌位置示意图 ---------------- */

function RingDiagram({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (position: string) => void;
}) {
  const part = (name: string, extra = "") => ({
    className: `part${extra} ${active === name ? "active" : ""}`.trim(),
    onClick: () => onSelect(name),
  });

  const haloA = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    return { x: 110 + 36 * Math.cos(a), y: 130 + 36 * Math.sin(a) };
  });
  const haloB = [45, 135, 225, 315].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x: 110 + 50 * Math.cos(a), y: 130 + 50 * Math.sin(a) };
  });

  return (
    <svg viewBox="0 0 220 252" className="diagram" role="img" aria-label="镶嵌位置示意图">
      <circle cx="110" cy="40" r="13" {...part("扣头")} />
      <line x1="110" y1="53" x2="110" y2="64" className="link" />
      <circle cx="110" cy="130" r="62" fill="none" {...part("戒臂", "band")} />
      {haloB.map((p, i) => (
        <circle key={`b${i}`} cx={p.x} cy={p.y} r="5.5" {...part("围石B组")} />
      ))}
      {haloA.map((p, i) => (
        <circle key={`a${i}`} cx={p.x} cy={p.y} r="7.5" {...part("围石A组")} />
      ))}
      <circle cx="110" cy="130" r="19" {...part("主石位")} />
      <text x="110" y="134">主石</text>
      <text x="110" y="44">扣头</text>
      <text x="110" y="197">戒臂</text>
    </svg>
  );
}

/* ---------------- 登记表单 ---------------- */

interface FormState {
  id: string;
  kind: string;
  shape: string;
  carat: string;
  size: string;
  clarity: string;
  color: string;
  cut: string;
  position: string;
  orderId: string;
  defect: string;
}

const EMPTY_FORM: FormState = {
  id: "",
  kind: KINDS[0],
  shape: SHAPES[0],
  carat: "",
  size: "",
  clarity: CLARITIES[1],
  color: "",
  cut: CUTS[0],
  position: POSITIONS[0],
  orderId: ORDERS[0].id,
  defect: "",
};

/* ---------------- 主应用 ---------------- */

function App() {
  const [gems, setGems] = useState<Gem[]>(SEED_GEMS);
  const [logs, setLogs] = useState<LogEntry[]>(SEED_LOGS);
  const [current, setCurrent] = useState<ShiftId>("A");
  const [posFilter, setPosFilter] = useState<string>("全部");
  const [shapeFilter, setShapeFilter] = useState<string>("全部");
  const [sizeDrafts, setSizeDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const logSeq = useRef(100);

  const next = NEXT_SHIFT[current];

  /* ---- 派生数据（仅当前班次） ---- */
  const shiftGems = useMemo(() => gems.filter((g) => g.holder === current), [gems, current]);
  const todoGems = shiftGems.filter((g) => g.status === "todo");
  const doneGems = shiftGems.filter((g) => g.status === "done");
  const receivedGems = shiftGems.filter((g) => g.received);
  const defectOpen = shiftGems.filter((g) => g.defect && !g.defectConfirmed);
  const unmarked = todoGems.filter((g) => !g.reason).length;

  const visible = shiftGems.filter(
    (g) =>
      (posFilter === "全部" || g.position === posFilter) &&
      (shapeFilter === "全部" || g.shape === shapeFilter)
  );

  const posCounts = useMemo(() => {
    const m: Record<string, number> = {};
    shiftGems.forEach((g) => {
      m[g.position] = (m[g.position] ?? 0) + 1;
    });
    return m;
  }, [shiftGems]);

  const shapeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    shiftGems.forEach((g) => {
      m[g.shape] = (m[g.shape] ?? 0) + 1;
    });
    return m;
  }, [shiftGems]);

  const orderRows = useMemo(
    () =>
      ORDERS.map((o) => {
        const inOrder = gems.filter((g) => g.orderId === o.id);
        return {
          ...o,
          total: inOrder.length,
          received: inOrder.filter((g) => g.received).length,
          inShift: inOrder.filter((g) => g.holder === current).length,
          todo: inOrder.filter((g) => g.status === "todo").length,
        };
      }),
    [gems, current]
  );

  /* ---- 动作 ---- */

  const pushLog = (kind: LogEntry["kind"], text: string) => {
    logSeq.current += 1;
    const entry: LogEntry = {
      id: logSeq.current,
      time: now(),
      shift: shiftName(current),
      kind,
      text,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 30));
  };

  const markDone = (id: string) => {
    setGems((prev) =>
      prev.map((g) => {
        if (g.id !== id || g.holder !== current) return g;
        if (g.status === "done") return { ...g, status: "todo" as const };
        if (blockReason(g)) return g; // 按钮已禁用，双保险
        return { ...g, status: "done" as const, reason: null };
      })
    );
  };

  const setReason = (id: string, reason: string) => {
    setGems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, reason: reason || null } : g))
    );
  };

  const confirmDefect = (id: string) => {
    setGems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, defectConfirmed: true } : g))
    );
  };

  const saveSize = (id: string) => {
    const v = (sizeDrafts[id] ?? "").trim();
    if (!v) return;
    setGems((prev) => prev.map((g) => (g.id === id ? { ...g, size: v } : g)));
    setSizeDrafts((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  /** 交接：只把已处理完的转给下一班；留班待办的自动补标原因 */
  const handover = () => {
    const moving = gems.filter((g) => g.holder === current && g.status === "done");
    if (!moving.length) return;
    const staying = gems.filter((g) => g.holder === current && g.status === "todo");
    const autoMarked = staying.filter((g) => !g.reason).length;

    setGems((prev) =>
      prev.map((g) => {
        if (g.holder !== current) return g;
        if (g.status === "done") {
          return {
            ...g,
            holder: next,
            origin: current,
            received: true,
            status: "todo" as const,
            reason: null,
          };
        }
        return g.reason ? g : { ...g, reason: suggestReason(g) };
      })
    );

    pushLog(
      "handover",
      `${shiftName(current)} → ${shiftName(next)} 交接 ${moving.length} 颗：${moving
        .map((g) => g.id)
        .join("、")}` +
        (staying.length
          ? `；${staying.length} 颗留班待办` +
            (autoMarked ? `，其中 ${autoMarked} 颗已补标留班原因` : "")
          : "")
    );
  };

  /** 退回：接走的宝石回到原班待办 */
  const returnGem = (id: string) => {
    const g = gems.find((x) => x.id === id);
    if (!g || !g.received || !g.origin || g.holder !== current) return;
    const target = g.origin;
    setGems((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              holder: target,
              origin: null,
              received: false,
              status: "todo" as const,
              reason: `${shiftName(current)}退回，待复核`,
            }
          : x
      )
    );
    pushLog("return", `${id} 由${shiftName(current)}退回${shiftName(target)}，回到原班待办`);
  };

  const addGem = () => {
    const id = form.id.trim().toUpperCase();
    if (!id) {
      setFormError("请填写宝石编号");
      return;
    }
    if (gems.some((g) => g.id === id)) {
      setFormError(`编号 ${id} 已存在`);
      return;
    }
    const gem: Gem = {
      id,
      kind: form.kind,
      shape: form.shape,
      carat: parseFloat(form.carat) || 0,
      size: form.size.trim(),
      clarity: form.clarity,
      color: form.color.trim() || "—",
      cut: form.cut,
      position: form.position,
      orderId: form.orderId,
      holder: current,
      origin: null,
      received: false,
      status: "todo",
      reason: null,
      defect: form.defect.trim() || null,
      defectConfirmed: false,
    };
    setGems((prev) => [...prev, gem]);
    pushLog(
      "register",
      `新宝石 ${id} 登记，挂到${shiftName(current)}待办` + (gem.size ? "" : "（尺寸待补）")
    );
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const upd =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickPosition = (p: string) =>
    setPosFilter((prev) => (prev === p ? "全部" : p));

  /* ---------------- 渲染 ---------------- */

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62006 · 源提示词8 · Port 62006</p>
        <h1>珠宝镶嵌 · 交接工作台</h1>
        <span>
          每颗宝石先挂在当前班次；交接时只把已处理完的记录转给下一班，未处理的留在原班并标明原因；
          下一班接走的宝石可退回，退回后回到原班待办；订单清单的已接手数量随交接与退回实时更新，
          镶嵌位置筛选只看当前班次。
        </span>
      </section>

      {/* 班次切换 + 交接操作 */}
      <section className="panel shift-bar">
        <div className="shift-tabs">
          {SHIFTS.map((s) => (
            <button
              key={s.id}
              className={s.id === current ? "shift-tab active" : "shift-tab"}
              onClick={() => setCurrent(s.id)}
            >
              <b>{s.name}</b>
              <small>{s.time}</small>
              <em>
                {gems.filter((g) => g.holder === s.id && g.status === "todo").length} 待办 ·{" "}
                {gems.filter((g) => g.holder === s.id && g.status === "done").length} 待交接
              </em>
            </button>
          ))}
        </div>
        <div className="handover-box">
          <p>
            交接给{shiftName(next)}：将转出 <b>{doneGems.length}</b> 颗已处理，
            <b>{todoGems.length}</b> 颗留班待办
            {unmarked > 0 && `（${unmarked} 颗将自动标明原因）`}
          </p>
          <button className="primary" onClick={handover} disabled={!doneGems.length}>
            {doneGems.length ? `交接给${shiftName(next)}` : "无已处理记录可交接"}
          </button>
        </div>
      </section>

      {/* 指标 */}
      <section className="metrics">
        <article className="m-todo">
          <small>本班待办</small>
          <strong>{todoGems.length}</strong>
          <em>未标原因 {unmarked} 颗</em>
        </article>
        <article className="m-done">
          <small>待交接（已处理）</small>
          <strong>{doneGems.length}</strong>
          <em>下一班：{shiftName(next)}</em>
        </article>
        <article className="m-recv">
          <small>本班已接手</small>
          <strong>{receivedGems.length}</strong>
          <em>可退回原班</em>
        </article>
        <article className="m-defect">
          <small>缺陷待确认</small>
          <strong>{defectOpen.length}</strong>
          <em>确认后才可交接</em>
        </article>
      </section>

      {/* 示意图/筛选 + 本班清单 */}
      <section className="workspace">
        <aside className="panel">
          <h2>镶嵌位置示意图</h2>
          <RingDiagram active={posFilter} onSelect={pickPosition} />
          <p className="note">位置筛选只看当前班次（{shiftName(current)}），点击示意图或下方标签筛选</p>
          <div className="chips">
            <button
              className={posFilter === "全部" ? "active" : ""}
              onClick={() => setPosFilter("全部")}
            >
              全部 · {shiftGems.length}
            </button>
            {POSITIONS.map((p) => (
              <button
                key={p}
                className={posFilter === p ? "active" : ""}
                disabled={!posCounts[p]}
                onClick={() => pickPosition(p)}
              >
                {p} · {posCounts[p] ?? 0}
              </button>
            ))}
          </div>

          <h2 className="sub-heading">形状筛选</h2>
          <div className="chips">
            <button
              className={shapeFilter === "全部" ? "active" : ""}
              onClick={() => setShapeFilter("全部")}
            >
              全部
            </button>
            {Object.keys(shapeCounts).map((s) => (
              <button
                key={s}
                className={shapeFilter === s ? "active" : ""}
                onClick={() => setShapeFilter((prev) => (prev === s ? "全部" : s))}
              >
                {s} · {shapeCounts[s]}
              </button>
            ))}
          </div>
        </aside>

        <section className="panel">
          <div className="heading">
            <div>
              <p>{shiftName(current)} · 宝石清单</p>
              <h2>
                本班宝石 {visible.length} / {shiftGems.length} 颗
              </h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="gem-table">
              <thead>
                <tr>
                  <th>编号 / 订单</th>
                  <th>种类</th>
                  <th>克拉</th>
                  <th>尺寸</th>
                  <th>品相</th>
                  <th>镶嵌位置</th>
                  <th>状态</th>
                  <th>缺陷 / 留班原因</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((g) => {
                  const blocked = g.status === "todo" ? blockReason(g) : null;
                  return (
                    <tr key={g.id}>
                      <td>
                        <b>{g.id}</b>
                        <small>{g.orderId}</small>
                        {g.received && g.origin && (
                          <span className="badge received">接自{shiftName(g.origin)}</span>
                        )}
                      </td>
                      <td>
                        {g.kind}
                        <small>{g.shape}</small>
                      </td>
                      <td>{g.carat.toFixed(2)}</td>
                      <td>
                        {g.size ? (
                          g.size
                        ) : (
                          <span className="size-fix">
                            <input
                              placeholder="补尺寸"
                              value={sizeDrafts[g.id] ?? ""}
                              onChange={(e) =>
                                setSizeDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))
                              }
                            />
                            <button className="btn-sm" onClick={() => saveSize(g.id)}>
                              补录
                            </button>
                          </span>
                        )}
                      </td>
                      <td>
                        <small>
                          {g.clarity} · {g.color} · {g.cut}
                        </small>
                      </td>
                      <td>{g.position}</td>
                      <td>
                        {g.status === "done" ? (
                          <span className="badge done">已处理</span>
                        ) : (
                          <span className="badge todo">待办</span>
                        )}
                      </td>
                      <td className="note-cell">
                        {g.defect && (
                          <p className="defect">
                            ⚠ {g.defect}
                            {g.defectConfirmed ? (
                              <em>（已确认）</em>
                            ) : (
                              <button className="btn-sm" onClick={() => confirmDefect(g.id)}>
                                确认缺陷
                              </button>
                            )}
                          </p>
                        )}
                        {g.status === "todo" && (
                          <select
                            value={g.reason ?? ""}
                            onChange={(e) => setReason(g.id, e.target.value)}
                          >
                            <option value="">选择留班原因</option>
                            {HOLD_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="actions">
                        {g.status === "todo" ? (
                          <>
                            <button
                              className="btn-sm primary-sm"
                              disabled={!!blocked}
                              title={blocked ?? "标记为已处理"}
                              onClick={() => markDone(g.id)}
                            >
                              标记完成
                            </button>
                            {blocked && <small className="block-hint">{blocked}</small>}
                          </>
                        ) : (
                          <button className="btn-sm" onClick={() => markDone(g.id)}>
                            撤销
                          </button>
                        )}
                        {g.received && (
                          <button className="btn-sm return" onClick={() => returnGem(g.id)}>
                            退回{g.origin ? shiftName(g.origin) : "原班"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!visible.length && (
                  <tr>
                    <td colSpan={9} className="empty">
                      当前筛选下{shiftName(current)}没有宝石
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {/* 订单清单 */}
      <section className="panel">
        <div className="heading">
          <div>
            <p>按订单查看</p>
            <h2>订单清单</h2>
          </div>
          <span className="note">已接手数量随交接与退回实时更新</span>
        </div>
        <div className="table-wrap">
          <table className="gem-table">
            <thead>
              <tr>
                <th>订单</th>
                <th>款型</th>
                <th>宝石总数</th>
                <th>已接手</th>
                <th>本班持有</th>
                <th>待处理</th>
                <th>接手进度</th>
              </tr>
            </thead>
            <tbody>
              {orderRows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <b>{o.id}</b>
                  </td>
                  <td>{o.title}</td>
                  <td>{o.total}</td>
                  <td>
                    <b className="recv-num">{o.received}</b>
                  </td>
                  <td>{o.inShift}</td>
                  <td>{o.todo}</td>
                  <td>
                    <div className="progress">
                      <i style={{ width: `${o.total ? (o.received / o.total) * 100 : 0}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 登记 + 交接动态 */}
      <section className="bottom-grid">
        <section className="panel">
          <div className="heading">
            <div>
              <p>新宝石登记</p>
              <h2>登记后挂到{shiftName(current)}待办</h2>
            </div>
            <button className="primary" onClick={addGem}>
              登记
            </button>
          </div>
          <div className="field-grid">
            <label>
              <span>宝石编号 *</span>
              <input value={form.id} onChange={upd("id")} placeholder="如 ST-2060" />
            </label>
            <label>
              <span>种类</span>
              <select value={form.kind} onChange={upd("kind")}>
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label>
              <span>形状</span>
              <select value={form.shape} onChange={upd("shape")}>
                {SHAPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              <span>克拉重量</span>
              <input value={form.carat} onChange={upd("carat")} placeholder="如 0.50" />
            </label>
            <label>
              <span>尺寸（留空 = 尺寸待补）</span>
              <input value={form.size} onChange={upd("size")} placeholder="如 6×4mm" />
            </label>
            <label>
              <span>净度</span>
              <select value={form.clarity} onChange={upd("clarity")}>
                {CLARITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <span>颜色</span>
              <input value={form.color} onChange={upd("color")} placeholder="如 皇家蓝" />
            </label>
            <label>
              <span>切工</span>
              <select value={form.cut} onChange={upd("cut")}>
                {CUTS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <span>镶嵌位置</span>
              <select value={form.position} onChange={upd("position")}>
                {POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              <span>所属订单</span>
              <select value={form.orderId} onChange={upd("orderId")}>
                {ORDERS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} · {o.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              <span>缺陷备注（可留空）</span>
              <input value={form.defect} onChange={upd("defect")} placeholder="如 台面划痕" />
            </label>
          </div>
          {formError && <p className="form-error">{formError}</p>}
        </section>

        <section className="panel">
          <div className="heading">
            <div>
              <p>交接动态</p>
              <h2>最近 {logs.length} 条</h2>
            </div>
          </div>
          <div className="logs">
            {logs.map((l) => (
              <article key={l.id} className={`log ${l.kind}`}>
                <small>
                  {l.time} · {l.shift}
                </small>
                <p>{l.text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
