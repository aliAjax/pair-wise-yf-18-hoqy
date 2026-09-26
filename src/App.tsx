import { useMemo, useState } from "react";
import "./styles.css";

const project = {
  sourceNo: 8,
  id: "hxyfront-62006",
  port: 62006,
  title: "珠宝镶嵌宝石分拣 · 班次交接工作台",
  domain: "珠宝镶嵌",
};

/* ---------------- 基础数据 ---------------- */

interface Shift {
  id: string;
  name: string;
  time: string;
}

interface OrderDef {
  id: string;
  customer: string;
  name: string;
  need: number;
}

type GemStatus = "pending" | "ready" | "handed";

interface Gem {
  id: string;
  species: string;
  shape: string;
  carat: string;
  size: string;
  clarity: string;
  color: string;
  cut: string;
  position: string;
  orderId: string;
  defectNote: string;
  defectUnconfirmed: boolean;
  status: GemStatus;
  originShiftId: string;
  ownerShiftId: string;
  holdReason: string;
  returnReason: string;
  handedAt: string;
}

interface LogEntry {
  id: number;
  time: string;
  text: string;
  tone: "hand" | "return" | "hold" | "add";
}

const SHIFTS: Shift[] = [
  { id: "S1", name: "早班", time: "08:00 – 16:00" },
  { id: "S2", name: "中班", time: "16:00 – 24:00" },
  { id: "S3", name: "夜班", time: "00:00 – 08:00" },
];

const ORDERS: OrderDef[] = [
  { id: "DD-101", customer: "景和珠宝", name: "蓝宝锁骨链", need: 3 },
  { id: "DD-102", customer: "瑞麟行", name: "满钻圆戒", need: 4 },
  { id: "DD-103", customer: "润翠堂", name: "祖母绿吊坠", need: 2 },
];

const POSITIONS = ["主石位", "围石A组", "围石B组", "配石位"];
const SHAPES = ["圆形", "椭圆", "梨形", "祖母绿切"];
const SPECIES = ["蓝宝石", "钻石", "祖母绿", "红宝石"];
const RETURN_REASONS = ["复检出缺陷", "尺寸复测不符", "客户变更要求", "镶嵌位置调整"];

const INITIAL_GEMS: Gem[] = [
  {
    id: "ST-2048",
    species: "蓝宝石",
    shape: "椭圆",
    carat: "1.02",
    size: "6.0×4.0mm",
    clarity: "VS",
    color: "皇家蓝",
    cut: "椭圆明亮切",
    position: "主石位",
    orderId: "DD-101",
    defectNote: "",
    defectUnconfirmed: false,
    status: "ready",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2049",
    species: "蓝宝石",
    shape: "椭圆",
    carat: "0.86",
    size: "5.2×3.6mm",
    clarity: "VVS",
    color: "矢车菊",
    cut: "椭圆明亮切",
    position: "围石A组",
    orderId: "DD-101",
    defectNote: "",
    defectUnconfirmed: false,
    status: "ready",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2050",
    species: "蓝宝石",
    shape: "圆形",
    carat: "0.31",
    size: "",
    clarity: "SI",
    color: "蓝",
    cut: "圆钻切",
    position: "配石位",
    orderId: "DD-101",
    defectNote: "",
    defectUnconfirmed: false,
    status: "pending",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2061",
    species: "钻石",
    shape: "圆形",
    carat: "0.08",
    size: "2.6mm",
    clarity: "VVS",
    color: "D",
    cut: "完美切",
    position: "围石A组",
    orderId: "DD-102",
    defectNote: "",
    defectUnconfirmed: false,
    status: "ready",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2062",
    species: "钻石",
    shape: "圆形",
    carat: "0.09",
    size: "2.7mm",
    clarity: "VS",
    color: "E",
    cut: "优秀切",
    position: "围石A组",
    orderId: "DD-102",
    defectNote: "",
    defectUnconfirmed: false,
    status: "ready",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2063",
    species: "钻石",
    shape: "圆形",
    carat: "0.07",
    size: "",
    clarity: "SI",
    color: "F",
    cut: "优秀切",
    position: "围石B组",
    orderId: "DD-102",
    defectNote: "",
    defectUnconfirmed: false,
    status: "pending",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2064",
    species: "钻石",
    shape: "梨形",
    carat: "0.15",
    size: "4.1×2.8mm",
    clarity: "SI",
    color: "G",
    cut: "梨形切",
    position: "围石B组",
    orderId: "DD-102",
    defectNote: "腰棱可见细小内含物",
    defectUnconfirmed: true,
    status: "pending",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2099",
    species: "祖母绿",
    shape: "祖母绿切",
    carat: "1.28",
    size: "7.0×5.2mm",
    clarity: "SI",
    color: "沃顿绿",
    cut: "阶梯切",
    position: "主石位",
    orderId: "DD-103",
    defectNote: "亭部内含物明显，需客户确认",
    defectUnconfirmed: true,
    status: "pending",
    originShiftId: "S1",
    ownerShiftId: "S1",
    holdReason: "",
    returnReason: "",
    handedAt: "",
  },
  {
    id: "ST-2100",
    species: "祖母绿",
    shape: "祖母绿切",
    carat: "0.96",
    size: "6.2×4.6mm",
    clarity: "VS",
    color: "木佐绿",
    cut: "阶梯切",
    position: "配石位",
    orderId: "DD-103",
    defectNote: "",
    defectUnconfirmed: false,
    status: "handed",
    originShiftId: "S1",
    ownerShiftId: "S2",
    holdReason: "",
    returnReason: "",
    handedAt: "上一班交接",
  },
];

const now = () =>
  new Date().toLocaleTimeString("zh-CN", { hour12: false });

const nextShiftOf = (id: string): Shift =>
  SHIFTS[(SHIFTS.findIndex((s) => s.id === id) + 1) % SHIFTS.length];

interface HandoverSummary {
  from: Shift;
  to: Shift;
  handed: string[];
  held: { id: string; reason: string }[];
}

function App() {
  const [gems, setGems] = useState<Gem[]>(INITIAL_GEMS);
  const [currentShiftId, setCurrentShiftId] = useState("S1");
  const [positionFilter, setPositionFilter] = useState("全部");
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        INITIAL_GEMS.filter((g) => g.status === "ready" && g.ownerShiftId === "S1").map(
          (g) => g.id,
        ),
      ),
  );
  const [sizeDraft, setSizeDraft] = useState<Record<string, string>>({});
  const [returnDraft, setReturnDraft] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 0, time: "开班", text: "早班接台：分拣一半的宝石仍挂在本班，缺陷与尺寸未闭环的不得转给中班。", tone: "add" },
  ]);
  const [summary, setSummary] = useState<HandoverSummary | null>(null);
  const [form, setForm] = useState({
    id: "",
    species: SPECIES[0],
    shape: SHAPES[0],
    carat: "",
    size: "",
    clarity: "",
    color: "",
    cut: "",
    position: POSITIONS[0],
    orderId: ORDERS[0].id,
    defectUnconfirmed: false,
    defectNote: "",
  });

  const currentShift = SHIFTS.find((s) => s.id === currentShiftId)!;
  const nextShift = nextShiftOf(currentShiftId);

  const pushLog = (text: string, tone: LogEntry["tone"]) =>
    setLogs((prev) => [{ id: prev.length ? prev[0].id + 1 : 1, time: now(), text, tone }, ...prev]);

  /* 未处理原因：缺陷未确认 / 尺寸待补，二者皆无则尚未标记分拣完成 */
  const blockers = (gem: Gem): string[] => {
    const list: string[] = [];
    if (gem.defectUnconfirmed) list.push("缺陷未确认");
    if (!gem.size.trim()) list.push("尺寸待补");
    return list;
  };

  const holdReasonOf = (gem: Gem) =>
    blockers(gem).length ? blockers(gem).join("、") : "未标记分拣完成";

  /* 当前班次持有的宝石；镶嵌位置筛选只看当前班次 */
  const ownedGems = useMemo(
    () => gems.filter((g) => g.ownerShiftId === currentShiftId),
    [gems, currentShiftId],
  );

  const visibleGems = useMemo(
    () =>
      positionFilter === "全部"
        ? ownedGems
        : ownedGems.filter((g) => g.position === positionFilter),
    [ownedGems, positionFilter],
  );

  const pendingGems = visibleGems.filter((g) => g.status === "pending");
  const readyGems = visibleGems.filter((g) => g.status === "ready");
  const handedGems = visibleGems.filter((g) => g.status === "handed");

  const handoverCandidates = ownedGems.filter((g) => g.status === "ready");
  const pendingHold = ownedGems.filter((g) => g.status === "pending");

  const metrics = [
    { label: "本班待办", value: ownedGems.filter((g) => g.status === "pending").length },
    { label: "可交接", value: handoverCandidates.length },
    { label: "已接手", value: ownedGems.filter((g) => g.status === "handed").length },
    {
      label: "缺陷待确认",
      value: ownedGems.filter((g) => g.defectUnconfirmed).length,
    },
  ];

  /* 已接手数量按订单统计：交接 +1，退回 -1（状态变化自动生效） */
  const orderStats = ORDERS.map((order) => {
    const orderGems = gems.filter((g) => g.orderId === order.id);
    return {
      ...order,
      accepted: orderGems.filter((g) => g.status === "handed").length,
      total: orderGems.length,
    };
  });

  const syncSelection = (shiftId: string) =>
    setSelected(
      new Set(
        gems
          .filter((g) => g.status === "ready" && g.ownerShiftId === shiftId)
          .map((g) => g.id),
      ),
    );

  const switchShift = (id: string) => {
    setCurrentShiftId(id);
    setPositionFilter("全部");
    setSummary(null);
    syncSelection(id);
  };

  /* ---------------- 宝石操作 ---------------- */

  const patchGem = (id: string, patch: Partial<Gem>) =>
    setGems((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const markReady = (gem: Gem) => {
    if (blockers(gem).length) return;
    patchGem(gem.id, { status: "ready", holdReason: "", returnReason: "" });
    setSelected((prev) => new Set(prev).add(gem.id));
    pushLog(`${gem.id} 分拣完成，加入「可交接」。`, "add");
  };

  const reopen = (gem: Gem) => {
    patchGem(gem.id, { status: "pending" });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(gem.id);
      return next;
    });
  };

  const confirmDefect = (gem: Gem) => {
    patchGem(gem.id, { defectUnconfirmed: false });
    pushLog(`${gem.id} 缺陷已确认（${gem.defectNote || "复检无异常"}）。`, "add");
  };

  const saveSize = (gem: Gem) => {
    const value = (sizeDraft[gem.id] || "").trim();
    if (!value) return;
    patchGem(gem.id, { size: value });
    setSizeDraft((prev) => ({ ...prev, [gem.id]: "" }));
    pushLog(`${gem.id} 补测尺寸：${value}。`, "add");
  };

  const doHandover = () => {
    const ids = handoverCandidates.filter((g) => selected.has(g.id)).map((g) => g.id);
    if (!ids.length) return;

    const held = pendingHold.map((g) => ({ id: g.id, reason: holdReasonOf(g) }));

    setGems((prev) =>
      prev.map((g) => {
        if (ids.includes(g.id)) {
          return { ...g, status: "handed", ownerShiftId: nextShift.id, handedAt: now() };
        }
        if (g.ownerShiftId === currentShiftId && g.status === "pending") {
          return { ...g, holdReason: holdReasonOf(g) };
        }
        return g;
      }),
    );

    setSummary({ from: currentShift, to: nextShift, handed: ids, held });
    setSelected(new Set());
    pushLog(
      `${currentShift.name} → ${nextShift.name}：交接 ${ids.length} 颗（${ids.join("、")}），${held.length} 颗留在原班。`,
      "hand",
    );
    if (held.length)
      pushLog(`留在${currentShift.name}：${held.map((h) => `${h.id}（${h.reason}）`).join("；")}。`, "hold");
  };

  const doReturn = (gem: Gem) => {
    const reason = returnDraft[gem.id] || RETURN_REASONS[0];
    const origin = SHIFTS.find((s) => s.id === gem.originShiftId)!;
    setGems((prev) =>
      prev.map((g) =>
        g.id === gem.id
          ? {
              ...g,
              status: "pending",
              ownerShiftId: g.originShiftId,
              returnReason: reason,
              defectUnconfirmed: reason === "复检出缺陷" ? true : g.defectUnconfirmed,
              handedAt: "",
            }
          : g,
      ),
    );
    setReturnDraft((prev) => ({ ...prev, [gem.id]: "" }));
    pushLog(
      `${currentShift.name} 退回 ${gem.id}：${reason}，已回到${origin.name}待办。`,
      "return",
    );
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addGem = () => {
    if (!form.id.trim()) return;
    const gem: Gem = {
      id: form.id.trim(),
      species: form.species,
      shape: form.shape,
      carat: form.carat.trim(),
      size: form.size.trim(),
      clarity: form.clarity.trim(),
      color: form.color.trim(),
      cut: form.cut.trim(),
      position: form.position,
      orderId: form.orderId,
      defectNote: form.defectNote.trim(),
      defectUnconfirmed: form.defectUnconfirmed,
      status: "pending",
      originShiftId: currentShiftId,
      ownerShiftId: currentShiftId,
      holdReason: "",
      returnReason: "",
      handedAt: "",
    };
    setGems((prev) => [...prev, gem]);
    pushLog(`${gem.id} 挂上${currentShift.name}分拣台（${gem.position} · ${gem.orderId}）。`, "add");
    setForm({
      id: "",
      species: form.species,
      shape: form.shape,
      carat: "",
      size: "",
      clarity: "",
      color: "",
      cut: "",
      position: form.position,
      orderId: form.orderId,
      defectUnconfirmed: false,
      defectNote: "",
    });
  };

  /* ---------------- 渲染 ---------------- */

  const renderGemCard = (gem: Gem) => {
    const origin = SHIFTS.find((s) => s.id === gem.originShiftId)!;
    const gemBlockers = blockers(gem);
    return (
      <article key={gem.id} className={`gem-card status-${gem.status}`}>
        <div className="gem-head">
          <h3>{gem.id}</h3>
          <span className={`pill pill-${gem.status}`}>
            {gem.status === "pending"
              ? "待办"
              : gem.status === "ready"
                ? "已处理·可交接"
                : "已接手"}
          </span>
        </div>
        <p className="gem-meta">
          {gem.species} · {gem.shape} · {gem.carat || "—"}ct
          {" · "}
          {gem.size || <em className="missing">尺寸未测</em>}
        </p>
        <p className="gem-sub">
          {[gem.clarity && `净度 ${gem.clarity}`, gem.color && `颜色 ${gem.color}`, gem.cut && gem.cut]
            .filter(Boolean)
            .join(" · ") || "净度/颜色/切工待录"}
        </p>
        <div className="gem-tags">
          <span className="tag tag-pos">{gem.position}</span>
          <span className="tag tag-order">{gem.orderId}</span>
          {gem.status === "handed" && <span className="tag tag-from">来自{origin.name}</span>}
        </div>

        {gem.defectNote && (
          <p className={`defect ${gem.defectUnconfirmed ? "is-open" : "is-done"}`}>
            缺陷备注：{gem.defectNote}
          </p>
        )}

        {gem.status === "pending" && gem.holdReason && (
          <p className="alert alert-hold">上次交接留在本班：{gem.holdReason}</p>
        )}
        {gem.status === "pending" && gem.returnReason && (
          <p className="alert alert-return">退回待办：{gem.returnReason}（原班 {origin.name}）</p>
        )}

        <div className="gem-actions">
          {gem.status === "pending" && (
            <>
              {gem.defectUnconfirmed && (
                <button className="mini" onClick={() => confirmDefect(gem)}>
                  ✓ 缺陷已确认
                </button>
              )}
              {!gem.size.trim() && (
                <span className="inline-input">
                  <input
                    placeholder="补测尺寸，如 3.8mm"
                    value={sizeDraft[gem.id] || ""}
                    onChange={(e) =>
                      setSizeDraft((prev) => ({ ...prev, [gem.id]: e.target.value }))
                    }
                  />
                  <button className="mini" onClick={() => saveSize(gem)}>
                    补尺寸
                  </button>
                </span>
              )}
              <button
                className="mini primary"
                disabled={gemBlockers.length > 0}
                title={gemBlockers.length ? gemBlockers.join("、") : "标记分拣完成"}
                onClick={() => markReady(gem)}
              >
                标记为已处理
              </button>
            </>
          )}

          {gem.status === "ready" && (
            <>
              <label className="check">
                <input
                  type="checkbox"
                  checked={selected.has(gem.id)}
                  onChange={() => toggleSelect(gem.id)}
                />
                本次交接
              </label>
              <button className="mini" onClick={() => reopen(gem)}>
                撤回到待办
              </button>
            </>
          )}

          {gem.status === "handed" && (
            <span className="return-row">
              <select
                value={returnDraft[gem.id] || RETURN_REASONS[0]}
                onChange={(e) =>
                  setReturnDraft((prev) => ({ ...prev, [gem.id]: e.target.value }))
                }
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r} value={r}>
                    退回原因：{r}
                  </option>
                ))}
              </select>
              <button className="mini danger" onClick={() => doReturn(gem)}>
                退回{origin.name}待办
              </button>
            </span>
          )}
        </div>
      </article>
    );
  };

  const selectedCount = handoverCandidates.filter((g) => selected.has(g.id)).length;

  return (
    <main className="app">
      <section className="hero">
        <p>{project.id} · 源提示词{project.sourceNo} · Port {project.port}</p>
        <h1>{project.title}</h1>
        <span>
          每颗宝石先挂在当前班次；交接时仅「已处理」记录转给下一班，缺陷未确认或尺寸待补的留在原班并标明原因。
          接走方可退回，宝石回到原班待办；订单已接手数量随交接与退回实时更新，镶嵌位置筛选只看当前班次。
        </span>
      </section>

      {/* 班次切换 */}
      <section className="shift-bar panel">
        <div className="shift-tabs">
          {SHIFTS.map((s) => {
            const count = gems.filter((g) => g.ownerShiftId === s.id).length;
            return (
              <button
                key={s.id}
                className={`shift-tab ${s.id === currentShiftId ? "active" : ""}`}
                onClick={() => switchShift(s.id)}
              >
                <b>{s.name}</b>
                <small>{s.time}</small>
                <span className="shift-count">{count} 颗在手</span>
              </button>
            );
          })}
        </div>
        <div className="shift-flow">
          当前工作台：<b>{currentShift.name}</b> → 交接目标：<b>{nextShift.name}</b>
        </div>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      {summary && (
        <section className="banner">
          <div>
            <b>
              {summary.from.name} → {summary.to.name} 交接完成
            </b>
            <span>
              已转走 {summary.handed.length} 颗：{summary.handed.join("、")}
            </span>
            {summary.held.length > 0 && (
              <span className="banner-held">
                留在{summary.from.name} {summary.held.length} 颗：
                {summary.held.map((h) => `${h.id}（${h.reason}）`).join("；")}
              </span>
            )}
          </div>
          <button className="mini" onClick={() => setSummary(null)}>
            知道了
          </button>
        </section>
      )}

      <section className="workspace">
        <aside className="panel">
          <h2>镶嵌位置筛选</h2>
          <p className="panel-note">仅统计与展示「{currentShift.name}」持有的宝石</p>
          <div className="chips">
            <button
              className={positionFilter === "全部" ? "on" : ""}
              onClick={() => setPositionFilter("全部")}
            >
              全部 ({ownedGems.length})
            </button>
            {POSITIONS.map((p) => (
              <button
                key={p}
                className={positionFilter === p ? "on" : ""}
                onClick={() => setPositionFilter(p)}
              >
                {p} ({ownedGems.filter((g) => g.position === p).length})
              </button>
            ))}
          </div>

          <div className="handover-box">
            <h3>交接给{nextShift.name}</h3>
            <p>
              已勾选 <b>{selectedCount}</b> / {handoverCandidates.length} 颗可交接宝石
            </p>
            <p className="panel-note">
              另有 {pendingHold.length} 颗待办将留在{currentShift.name}并标明原因，不会混进下一班订单。
            </p>
            <div className="chips small">
              <button className="mini" onClick={() => setSelected(new Set(handoverCandidates.map((g) => g.id)))}>
                全选
              </button>
              <button className="mini" onClick={() => setSelected(new Set())}>
                清空
              </button>
            </div>
            <button
              className="primary full"
              disabled={selectedCount === 0}
              onClick={doHandover}
            >
              交接 {selectedCount} 颗给{nextShift.name}
            </button>
            {pendingHold.length > 0 && (
              <ul className="hold-list">
                {pendingHold.map((g) => (
                  <li key={g.id}>
                    <b>{g.id}</b>
                    <span>{holdReasonOf(g)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="board">
          <div className="column">
            <header className="column-head pending">
              <h2>本班待办</h2>
              <span>{pendingGems.length}</span>
            </header>
            <div className="column-body">
              {pendingGems.length === 0 && <p className="empty">暂无待办宝石</p>}
              {pendingGems.map(renderGemCard)}
            </div>
          </div>

          <div className="column">
            <header className="column-head ready">
              <h2>已处理 · 可交接</h2>
              <span>{readyGems.length}</span>
            </header>
            <div className="column-body">
              {readyGems.length === 0 && (
                <p className="empty">
                  没有可交接宝石。待办完成「确认缺陷 / 补尺寸」后，标记为已处理才会进入本班。
                </p>
              )}
              {readyGems.map(renderGemCard)}
            </div>
          </div>

          <div className="column">
            <header className="column-head handed">
              <h2>本班已接手</h2>
              <span>{handedGems.length}</span>
            </header>
            <div className="column-body">
              {handedGems.length === 0 && (
                <p className="empty">尚未从其他班次接手宝石；接走的宝石可在此退回原班待办。</p>
              )}
              {handedGems.map(renderGemCard)}
            </div>
          </div>
        </section>
      </section>

      <section className="panel form-panel">
        <div className="heading">
          <div>
            <p>上架分拣</p>
            <h2>新到宝石挂在「{currentShift.name}」</h2>
          </div>
        </div>
        <div className="field-grid">
          <label>
            <span>宝石编号</span>
            <input
              placeholder="如 ST-2101"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </label>
          <label>
            <span>种类</span>
            <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
              {SPECIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>形状</span>
            <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })}>
              {SHAPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>克拉重量</span>
            <input
              placeholder="如 1.02"
              value={form.carat}
              onChange={(e) => setForm({ ...form, carat: e.target.value })}
            />
          </label>
          <label>
            <span>尺寸</span>
            <input
              placeholder="如 6.0×4.0mm，可稍后补"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
          </label>
          <label>
            <span>镶嵌位置</span>
            <select
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            >
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span>所属订单</span>
            <select
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            >
              {ORDERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} · {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>净度 / 颜色 / 切工</span>
            <input
              placeholder="如 VS · 皇家蓝 · 椭圆明亮切"
              value={[form.clarity, form.color, form.cut].filter(Boolean).join(" · ")}
              onChange={(e) => {
                const [clarity = "", color = "", cut = ""] = e.target.value.split("·").map((x) => x.trim());
                setForm({ ...form, clarity, color, cut });
              }}
            />
          </label>
          <label className="full">
            <span>缺陷备注</span>
            <input
              placeholder="如 亭部内含物明显，需客户确认"
              value={form.defectNote}
              onChange={(e) => setForm({ ...form, defectNote: e.target.value })}
            />
          </label>
          <label className="check-line">
            <input
              type="checkbox"
              checked={form.defectUnconfirmed}
              onChange={(e) => setForm({ ...form, defectUnconfirmed: e.target.checked })}
            />
            <span>缺陷待确认（交接前必须处理，否则留在原班）</span>
          </label>
        </div>
        <button className="primary" disabled={!form.id.trim()} onClick={addGem}>
          挂上{currentShift.name}分拣台
        </button>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <div className="heading">
            <div>
              <p>按订单查看</p>
              <h2>订单宝石清单</h2>
            </div>
          </div>
          <div className="orders">
            {orderStats.map((o) => (
              <article key={o.id} className="order-row">
                <div className="order-info">
                  <h3>
                    {o.id} · {o.name}
                  </h3>
                  <p>
                    {o.customer} · 需求 {o.need} 颗 · 分拣中 {o.total} 颗
                  </p>
                </div>
                <div className="order-progress">
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{ width: `${Math.min(100, (o.accepted / o.need) * 100)}%` }}
                    />
                  </div>
                  <small>
                    已接手 <b>{o.accepted}</b> / {o.need}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="heading">
            <div>
              <p>交接流水</p>
              <h2>近期动态</h2>
            </div>
          </div>
          <ul className="logs">
            {logs.map((log) => (
              <li key={log.id} className={`log-${log.tone}`}>
                <time>{log.time}</time>
                <span>{log.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default App;
