import React, { useState, useEffect } from "react";
import {
  Plus, X, MapPin, Calendar, Package, ShoppingCart, ListChecks, Ticket,
  ArrowLeft, Archive, ExternalLink, Check, Menu, Trash2, Pencil, Download,
  Users, ChevronRight, RotateCcw, Sparkles, ArrowRight, Wallet,
} from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebaseClient";

/* ============================== 定数 ============================== */

const EMOJIS = ["✈️", "🏖️", "⛰️", "🗼", "🚗", "🚄", "🏯", "🎡", "🍜", "🏕️", "🛳️", "🌸"];
const CATEGORIES = ["移動", "食事", "宿泊", "観光", "その他"];
const CAT_COLORS = {
  移動: { bg: "#FFE3DC", text: "#C25B3E", dot: "#FFB4A2" },
  食事: { bg: "#FFF3D6", text: "#B8862E", dot: "#FFD97D" },
  宿泊: { bg: "#EDE6F9", text: "#6A4FA0", dot: "#B8A6E0" },
  観光: { bg: "#E1F5EC", text: "#3F8F6C", dot: "#7FC8A9" },
  その他: { bg: "#EEF0F2", text: "#6B7280", dot: "#C9CED6" },
};
const RESV_CATEGORIES = ["フライト", "ホテル", "レンタカー", "その他"];
const EXPENSE_CATEGORIES = ["交通", "宿泊", "食事", "観光", "買い物", "その他"];
const TODO_PHASES = [
  { key: "pre", label: "旅行前" },
  { key: "during", label: "旅行中" },
  { key: "post", label: "旅行後" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

/* ============================== サンプルデータ ============================== */
/* 今日を 2026-08-16 とみなし、少し先に出発する海外旅行を1件用意する */

function sampleTrips() {
  return [
    {
      id: "t1",
      emoji: "🏖️",
      name: "ハワイ家族旅行",
      destination: "ホノルル(ハワイ)",
      startDate: "2026-09-05",
      endDate: "2026-09-10",
      members: ["たろう", "はなこ", "みらい", "そら"],
      isInternational: true,
      timeDiffHours: -19,
      archived: false,
      budget: 350000,
      days: {
        "2026-09-05": [
          {
            id: uid(), time: "09:00", endTime: "21:30", endDayOffset: 0,
            title: "羽田空港 出発(HA451便)", category: "移動",
            location: "羽田空港 国際線ターミナル", arrivalLocation: "ダニエル・K・イノウエ国際空港",
            arrivalIsLocalTime: true, memo: "3時間前には集合", reservationNumber: "HA451",
            timeZone: "jst",
          },
          {
            id: uid(), time: "22:30", title: "ホテルへ移動", category: "移動",
            location: "空港", arrivalLocation: "ワイキキのホテル",
            memo: "", timeZone: "local",
          },
        ],
        "2026-09-06": [
          { id: uid(), time: "08:00", title: "ホテルで朝食", category: "食事", location: "ホテル最上階レストラン", timeZone: "local" },
          { id: uid(), time: "10:00", title: "ワイキキビーチでのんびり", category: "観光", location: "ワイキキビーチ", timeZone: "local" },
          { id: uid(), time: "18:30", title: "夕食(ステーキハウス)", category: "食事", location: "ワイキキ", reservationNumber: "予約番号 2246", timeZone: "local" },
        ],
        "2026-09-07": [
          { id: uid(), time: "09:00", title: "ダイヤモンドヘッド登山", category: "観光", location: "ダイヤモンドヘッド州立記念公園", memo: "水と帽子を忘れずに", timeZone: "local" },
          { id: uid(), time: "19:00", title: "ホテルにチェックイン延長分の確認", category: "宿泊", location: "ホテルフロント", timeZone: "local" },
        ],
        "2026-09-08": [
          { id: uid(), time: "10:00", title: "アラモアナセンターでお土産探し", category: "観光", location: "アラモアナセンター", timeZone: "local" },
        ],
        "2026-09-09": [
          { id: uid(), time: "09:30", title: "ノースショアへドライブ", category: "移動", location: "レンタカーで出発", timeZone: "local" },
          { id: uid(), time: "13:00", title: "ガーリックシュリンプの昼食", category: "食事", location: "ノースショア", timeZone: "local" },
        ],
        "2026-09-10": [
          {
            id: uid(), time: "12:00", endTime: "17:20", endDayOffset: 1,
            title: "ホノルル空港 出発(HA450便)", category: "移動",
            location: "ダニエル・K・イノウエ国際空港", arrivalLocation: "羽田空港",
            arrivalIsLocalTime: false, reservationNumber: "HA450",
            timeZone: "local",
          },
        ],
        "2026-09-11": [],
      },
      packingList: [
        { id: uid(), text: "パスポート", checked: true },
        { id: uid(), text: "海外旅行保険証", checked: false },
        { id: uid(), text: "水着", checked: false },
        { id: uid(), text: "日焼け止め", checked: false },
        { id: uid(), text: "変換プラグ", checked: true },
      ],
      shoppingList: [
        { id: uid(), text: "マカデミアナッツチョコ(お土産用)", checked: false },
        { id: uid(), text: "コナコーヒー", checked: false },
      ],
      todos: {
        pre: [
          { id: uid(), text: "ESTA申請", checked: true },
          { id: uid(), text: "海外旅行保険に加入する", checked: false },
          { id: uid(), text: "レンタカーの予約確認", checked: false, date: "2026-09-01", time: "20:00", location: "自宅", timeZone: "jst" },
        ],
        during: [
          { id: uid(), text: "現地SIMを有効化する", checked: false, date: "2026-09-05", time: "23:00", location: "ホテル到着後", timeZone: "local" },
        ],
        post: [
          { id: uid(), text: "現像・写真の整理", checked: false },
        ],
      },
      reservations: [
        { id: uid(), category: "フライト", name: "HA451便 羽田→ホノルル", number: "HA451", link: "" },
        { id: uid(), category: "フライト", name: "HA450便 ホノルル→羽田", number: "HA450", link: "" },
        { id: uid(), category: "ホテル", name: "ワイキキ・ビーチ・リゾート", number: "RSV-8827", link: "" },
        { id: uid(), category: "レンタカー", name: "アラモレンタカー", number: "AL-5521", link: "" },
      ],
      expenses: [
        { id: uid(), category: "交通", amount: 210000, memo: "航空券(4人分)" },
        { id: uid(), category: "宿泊", amount: 95000, memo: "ホテル5泊" },
        { id: uid(), category: "食事", amount: 18000, memo: "初日の夕食" },
      ],
    },
  ];
}

/* ============================== 時刻ユーティリティ ============================== */

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 日付(YYYY-MM-DD)+分 をソート可能な数値に変換(JST換算込み)
function sortValue(dateStr, minutes, timeZone, trip) {
  const base = new Date(dateStr + "T00:00:00").getTime();
  let jstMinutes = minutes;
  if (timeZone === "local" && trip.timeDiffHours) {
    jstMinutes = minutes - trip.timeDiffHours * 60;
  }
  return base + jstMinutes * 60000;
}

function fmtDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function dayList(trip) {
  return Object.keys(trip.days).sort();
}

function tripStatus(trip) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate + "T00:00:00");
  const end = new Date(trip.endDate + "T00:00:00");
  const diffDays = Math.round((start - today) / 86400000);
  if (today > end) return { kind: "past" };
  if (today >= start && today <= end) return { kind: "ongoing" };
  if (diffDays === 0) return { kind: "today" };
  return { kind: "future", diffDays };
}

/* ============================== 共通パーツ ============================== */

function Chip({ children, onRemove }) {
  return (
    <span className="chip">
      {children}
      {onRemove && <X size={12} onClick={onRemove} />}
    </span>
  );
}

function ConfirmInline({ text = "本当に削除しますか?元に戻せません", onConfirm, onCancel }) {
  return (
    <div className="confirm-delete">
      <span>{text}</span>
      <button className="btn-mini danger" onClick={onConfirm}>削除する</button>
      <button className="link-btn" onClick={onCancel}>やめる</button>
    </div>
  );
}

function TzToggle({ value, onChange }) {
  return (
    <div className="tz-toggle">
      <button type="button" className={"tz-btn" + (value === "jst" ? " active" : "")} onClick={() => onChange("jst")}>
        <span className="tz-pin">🇯🇵</span> 日本時間
      </button>
      <button type="button" className={"tz-btn" + (value === "local" ? " active" : "")} onClick={() => onChange("local")}>
        <span className="tz-pin">📍</span> 現地時間
      </button>
    </div>
  );
}

/* ============================== 旅行フォーム(新規/編集共通) ============================== */

function TripPanel({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial || {
      emoji: "✈️", name: "", destination: "", startDate: "", endDate: "",
      members: [], isInternational: false, timeDiffHours: "", budget: "",
    }
  );
  const [memberInput, setMemberInput] = useState("");

  const valid = form.name && form.destination && form.startDate && form.endDate && form.endDate >= form.startDate;

  const addMember = () => {
    if (!memberInput.trim()) return;
    setForm({ ...form, members: [...form.members, memberInput.trim()] });
    setMemberInput("");
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>{initial ? "旅行を編集" : "新しい旅行"}</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="panel-body">
          <label className="field-label">アイコン</label>
          <div className="emoji-picker">
            {EMOJIS.map((e) => (
              <button key={e} type="button" className={"emoji-choice" + (form.emoji === e ? " selected" : "")}
                onClick={() => setForm({ ...form, emoji: e })}>{e}</button>
            ))}
          </div>

          <label className="field-label">旅行名</label>
          <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="field-label">行き先</label>
          <input className="field-input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />

          <div className="field-row">
            <div>
              <label className="field-label">開始日</label>
              <input type="date" className="field-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="field-label">終了日</label>
              <input type="date" className="field-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>

          <label className="field-label">国内旅行?海外旅行?</label>
          <div className="field-row">
            <button type="button" className={form.isInternational ? "btn-secondary" : "btn-primary"}
              onClick={() => setForm({ ...form, isInternational: false, timeDiffHours: "" })}>国内旅行</button>
            <button type="button" className={form.isInternational ? "btn-primary" : "btn-secondary"}
              onClick={() => setForm({ ...form, isInternational: true })}>🌍 海外旅行</button>
          </div>

          {form.isInternational && (
            <>
              <label className="field-label">現地との時差(任意)</label>
              <input type="number" step="0.5" className="field-input" placeholder="例:日本より1時間遅い→ -1"
                value={form.timeDiffHours} onChange={(e) => setForm({ ...form, timeDiffHours: e.target.value })} />
              <div className="field-hint">現地の時計が日本より遅れていればマイナス、進んでいればプラスで入力してください(未入力なら時差なし扱い)</div>
            </>
          )}

          <label className="field-label">予算(任意)</label>
          <input type="number" className="field-input" placeholder="例:350000" value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <div className="field-hint">旅行全体のだいたいの予算を入れておくと、詳細ページの「予算」タブで実際の支出と比べられます</div>

          <label className="field-label">参加メンバー</label>
          <div className="chip-row">
            {form.members.map((m, i) => (
              <Chip key={i} onRemove={() => setForm({ ...form, members: form.members.filter((_, idx) => idx !== i) })}>{m}</Chip>
            ))}
          </div>
          <div className="add-inline">
            <input value={memberInput} onChange={(e) => setMemberInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()} placeholder="名前を入力" />
            <button className="btn-mini" onClick={addMember}><Plus size={14} /></button>
          </div>
        </div>
        <div className="panel-footer">
          <button className="btn-primary full" disabled={!valid}
            onClick={() => valid && onSave({
              ...form,
              id: initial?.id || uid(),
              timeDiffHours: form.isInternational ? (parseFloat(form.timeDiffHours) || 0) : 0,
              budget: form.budget !== "" && form.budget !== null ? parseFloat(form.budget) || 0 : null,
              archived: initial?.archived || false,
              days: initial?.days || {},
              packingList: initial?.packingList || [],
              shoppingList: initial?.shoppingList || [],
              todos: initial?.todos || { pre: [], during: [], post: [] },
              reservations: initial?.reservations || [],
              expenses: initial?.expenses || [],
            })}>
            {initial ? "保存する" : "この内容で作成"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== 予定 追加/編集フォーム ============================== */

function ScheduleForm({ trip, initial, onSave, onCancel }) {
  const [f, setF] = useState(
    initial || {
      time: "", endTime: "", category: "移動", timeZone: "jst", title: "",
      location: "", arrivalLocation: "", endDayOffset: 0, arrivalIsLocalTime: false,
      reservationNumber: "", memo: "",
    }
  );
  const showTz = trip.isInternational && trip.timeDiffHours !== 0;

  return (
    <div className="mini-form">
      <label className="field-label">開始時刻</label>
      <input type="time" className="field-input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />

      <label className="field-label">カテゴリ</label>
      <select className="field-input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      {showTz && (
        <>
          <label className="field-label">この時刻はどっち?</label>
          <TzToggle value={f.timeZone} onChange={(v) => setF({ ...f, timeZone: v })} />
        </>
      )}

      <label className="field-label">予定名</label>
      <input className="field-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />

      <label className="field-label">出発場所(任意)</label>
      <input className="field-input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />

      <div className="field-row">
        <div>
          <label className="field-label">到着時刻(任意)</label>
          <input type="time" className="field-input" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} />
        </div>
        <div>
          <label className="field-label">到着場所(任意)</label>
          <input className="field-input" value={f.arrivalLocation} onChange={(e) => setF({ ...f, arrivalLocation: e.target.value })} />
        </div>
      </div>

      <label className="field-label">到着日</label>
      <select className="field-input" value={f.endDayOffset} onChange={(e) => setF({ ...f, endDayOffset: Number(e.target.value) })}>
        <option value={0}>当日</option>
        <option value={1}>翌日</option>
        <option value={2}>2日後</option>
      </select>

      <label className="checkbox-label">
        <input type="checkbox" checked={f.arrivalIsLocalTime} onChange={(e) => setF({ ...f, arrivalIsLocalTime: e.target.checked })} />
        到着時刻は現地時間
      </label>

      <label className="field-label">予約番号(任意)</label>
      <input className="field-input" value={f.reservationNumber} onChange={(e) => setF({ ...f, reservationNumber: e.target.value })} />

      <label className="field-label">メモ(任意)</label>
      <input className="field-input" value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} />

      <div className="form-actions">
        <button className="btn-mini full" onClick={() => onSave({ ...f, id: initial?.id || uid() })} disabled={!f.time || !f.title}>
          {initial ? "保存する" : "追加する"}
        </button>
        <button className="btn-secondary full" onClick={onCancel}>やめる</button>
      </div>
    </div>
  );
}

/* ============================== 日程タブ ============================== */

function ScheduleTab({ trip, updateTrip }) {
  const days = dayList(trip);
  const [activeDay, setActiveDay] = useState(days[0]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const items = (trip.days[activeDay] || []).map((it) => ({ ...it, _kind: "schedule" }));
  const dayTodos = TODO_PHASES.flatMap((p) =>
    (trip.todos[p.key] || []).filter((t) => t.date === activeDay).map((t) => ({ ...t, _kind: "todo", _phase: p.key }))
  );
  const merged = [...items, ...dayTodos].sort((a, b) => {
    const va = sortValue(activeDay, toMinutes(a.time), a.timeZone || "jst", trip);
    const vb = sortValue(activeDay, toMinutes(b.time), b.timeZone || "jst", trip);
    return va - vb;
  });

  // 前日から日をまたいで到着する予定を探す
  const dayIdx = days.indexOf(activeDay);
  let carryover = null;
  if (dayIdx > 0) {
    const prevDay = days[dayIdx - 1];
    (trip.days[prevDay] || []).forEach((it) => {
      if (it.endTime && it.endDayOffset >= 1) {
        const arrivalDayIndex = days.indexOf(prevDay) + it.endDayOffset;
        if (days[arrivalDayIndex] === activeDay) {
          carryover = it;
        }
      }
    });
  }

  const saveItem = (item) => {
    const list = trip.days[activeDay] || [];
    const exists = list.some((x) => x.id === item.id);
    const newList = exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
    updateTrip({ ...trip, days: { ...trip.days, [activeDay]: newList } });
    setAdding(false);
    setEditingId(null);
  };

  const deleteItem = (id) => {
    updateTrip({ ...trip, days: { ...trip.days, [activeDay]: (trip.days[activeDay] || []).filter((x) => x.id !== id) } });
    setConfirmId(null);
  };

  const toggleTodo = (todo) => {
    const list = trip.todos[todo._phase].map((t) => (t.id === todo.id ? { ...t, checked: !t.checked } : t));
    updateTrip({ ...trip, todos: { ...trip.todos, [todo._phase]: list } });
  };

  return (
    <div className="tab-content">
      <div className="day-tabs">
        {days.map((d, i) => (
          <button key={d} className={"day-tab" + (d === activeDay ? " active" : "")}
            onClick={() => { setActiveDay(d); setAdding(false); setEditingId(null); }}>
            Day{i + 1}<span>{fmtDateLabel(d)}</span>
          </button>
        ))}
      </div>

      {carryover && (
        <div className="carryover-card">
          🛬 前日から:{carryover.title} 到着 ({carryover.endTime})
        </div>
      )}

      <div className="card-list">
        {merged.length === 0 && !adding && (
          <div className="empty-state">
            <Calendar size={28} strokeWidth={1.5} />
            <span>この日の予定はまだありません</span>
          </div>
        )}

        {merged.map((it) =>
          it._kind === "todo" ? (
            <div key={it.id} className={"schedule-item todo-linked" + (it.checked ? " checked" : "")}>
              <div className="check-circle" onClick={() => toggleTodo(it)}>{it.checked && <Check size={13} />}</div>
              <div className="check-text-col">
                <div className="schedule-title">{it.text}</div>
                {it.time && <div className="mini-loc">{it.time}{it.location ? ` ・ ${it.location}` : ""}</div>}
              </div>
            </div>
          ) : editingId === it.id ? (
            <ScheduleForm key={it.id} trip={trip} initial={it} onSave={saveItem} onCancel={() => setEditingId(null)} />
          ) : (
            <div key={it.id} className="schedule-item clickable" onClick={() => setEditingId(it.id)}>
              <div className="schedule-time-col">
                {trip.isInternational && trip.timeDiffHours !== 0 && <span>{it.timeZone === "local" ? "📍" : "🇯🇵"}</span>}
                <span>{it.time}</span>
                {it.endTime && (
                  <span className="schedule-time-sub">
                    ↓ {it.endDayOffset === 1 ? "翌日" : it.endDayOffset === 2 ? "2日後" : ""}{it.endTime}
                    {it.arrivalIsLocalTime ? "(現地)" : ""}
                  </span>
                )}
              </div>
              <div className="schedule-main">
                <div className="schedule-top">
                  <span className="cat-badge" style={{ background: CAT_COLORS[it.category].bg, color: CAT_COLORS[it.category].text }}>{it.category}</span>
                  <span className="schedule-title">{it.title}</span>
                </div>
                <div className="schedule-meta">
                  {it.location && (
                    <a className="meta-link" href={`https://maps.google.com/?q=${encodeURIComponent(it.location)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <MapPin size={11} />{it.location}<ExternalLink size={10} />
                    </a>
                  )}
                  {it.arrivalLocation && (
                    <a className="meta-link" href={`https://maps.google.com/?q=${encodeURIComponent(it.arrivalLocation)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      → {it.arrivalLocation}<ExternalLink size={10} />
                    </a>
                  )}
                  {it.reservationNumber && <span className="meta-tag"><Ticket size={11} />{it.reservationNumber}</span>}
                  {it.memo && <span className="meta-memo">{it.memo}</span>}
                </div>
                {confirmId === it.id && (
                  <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                    <ConfirmInline text="削除しますか?" onConfirm={() => deleteItem(it.id)} onCancel={() => setConfirmId(null)} />
                  </div>
                )}
              </div>
              {confirmId !== it.id && (
                <button className="icon-btn faint" onClick={(e) => { e.stopPropagation(); setConfirmId(it.id); }}><X size={16} /></button>
              )}
            </div>
          )
        )}

        {adding && <ScheduleForm trip={trip} onSave={saveItem} onCancel={() => setAdding(false)} />}
      </div>

      {!adding && <button className="btn-mini full" onClick={() => setAdding(true)}><Plus size={14} />予定を追加</button>}
    </div>
  );
}

/* ============================== チェックリスト系タブ(持ち物/買うもの) ============================== */

function CheckListTab({ items, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    onChange([...items, { id: uid(), text: input.trim(), checked: false }]);
    setInput("");
  };
  return (
    <div className="tab-content">
      <div className="card-list">
        {items.length === 0 && <div className="empty-state"><Package size={28} strokeWidth={1.5} /><span>{placeholder.empty}</span></div>}
        {items.map((it) => (
          <div key={it.id} className={"check-row" + (it.checked ? " checked" : "")}>
            <div className="check-circle" onClick={() => onChange(items.map((x) => x.id === it.id ? { ...x, checked: !x.checked } : x))}>
              {it.checked && <Check size={13} />}
            </div>
            <span className="check-text">{it.text}</span>
            <button className="icon-btn faint" onClick={() => onChange(items.filter((x) => x.id !== it.id))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="add-inline">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder.input} />
        <button className="btn-mini" onClick={add}><Plus size={14} /></button>
      </div>
    </div>
  );
}

/* ============================== やることタブ ============================== */

function TodoTab({ trip, updateTrip }) {
  const [phase, setPhase] = useState("pre");
  const [input, setInput] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState({ date: "", time: "", location: "", timeZone: "jst" });
  const [editingId, setEditingId] = useState(null);

  const list = trip.todos[phase] || [];
  const showTz = trip.isInternational && trip.timeDiffHours !== 0;

  const setList = (newList) => updateTrip({ ...trip, todos: { ...trip.todos, [phase]: newList } });

  const add = () => {
    if (!input.trim()) return;
    const item = { id: uid(), text: input.trim(), checked: false, ...(showDetail ? detail : {}) };
    setList([...list, item]);
    setInput("");
    setDetail({ date: "", time: "", location: "", timeZone: "jst" });
    setShowDetail(false);
  };

  return (
    <div className="tab-content">
      <div className="day-tabs">
        {TODO_PHASES.map((p) => (
          <button key={p.key} className={"day-tab" + (phase === p.key ? " active" : "")} onClick={() => setPhase(p.key)}>{p.label}</button>
        ))}
      </div>

      <div className="card-list">
        {list.length === 0 && <div className="empty-state"><ListChecks size={28} strokeWidth={1.5} /><span>タスクはまだありません</span></div>}
        {list.map((it) => (
          <div key={it.id} className={"check-row" + (it.checked ? " checked" : "")}>
            <div className="check-circle" onClick={() => setList(list.map((x) => x.id === it.id ? { ...x, checked: !x.checked } : x))}>
              {it.checked && <Check size={13} />}
            </div>
            {editingId === it.id ? (
              <div className="check-text-col" style={{ display: "flex", gap: 6 }}>
                <input className="field-input" defaultValue={it.text}
                  onBlur={(e) => { setList(list.map((x) => x.id === it.id ? { ...x, text: e.target.value } : x)); setEditingId(null); }} autoFocus />
              </div>
            ) : (
              <div className="check-text-col clickable" onClick={() => setEditingId(it.id)}>
                <span className="check-text">{it.text}</span>
                {it.date && (
                  <div className="todo-date-badge">
                    <Calendar size={11} />{fmtDateLabel(it.date)} {it.time}{it.location ? ` ・ ${it.location}` : ""}
                  </div>
                )}
              </div>
            )}
            <button className="icon-btn faint" onClick={() => setList(list.filter((x) => x.id !== it.id))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      <div className="mini-form">
        <div className="add-inline">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="やることを入力" />
          <button className="btn-mini" onClick={add}>追加</button>
        </div>
        {!showDetail ? (
          <button className="link-btn" onClick={() => setShowDetail(true)}>日時・場所を追加</button>
        ) : (
          <>
            <div className="field-row">
              <div>
                <label className="field-label">日付</label>
                <input type="date" className="field-input" value={detail.date} onChange={(e) => setDetail({ ...detail, date: e.target.value })} />
              </div>
              <div>
                <label className="field-label">時刻</label>
                <input type="time" className="field-input" value={detail.time} onChange={(e) => setDetail({ ...detail, time: e.target.value })} />
              </div>
            </div>
            {showTz && <TzToggle value={detail.timeZone} onChange={(v) => setDetail({ ...detail, timeZone: v })} />}
            <label className="field-label">場所(任意)</label>
            <input className="field-input" value={detail.location} onChange={(e) => setDetail({ ...detail, location: e.target.value })} />
            <button className="link-btn" onClick={() => { setShowDetail(false); setDetail({ date: "", time: "", location: "", timeZone: "jst" }); }}>日時・場所をクリア</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================== 予約タブ ============================== */

function ReservationTab({ trip, updateTrip }) {
  const [f, setF] = useState({ category: "フライト", name: "", number: "", link: "" });
  const list = trip.reservations || [];

  const add = () => {
    if (!f.name.trim()) return;
    updateTrip({ ...trip, reservations: [...list, { ...f, id: uid() }] });
    setF({ category: "フライト", name: "", number: "", link: "" });
  };

  return (
    <div className="tab-content">
      <div className="card-list">
        {list.length === 0 && <div className="empty-state"><Ticket size={28} strokeWidth={1.5} /><span>予約情報はまだありません</span></div>}
        {list.map((r) => (
          <div key={r.id} className="reservation-item">
            <div className="reservation-body">
              <div className="reservation-name">{r.name}</div>
              <div className="reservation-meta">
                <span className="cat-badge" style={{ background: "#EEF0F2", color: "#6B7280" }}>{r.category}</span>
                {r.number && <span>{r.number}</span>}
                {r.link && <a href={r.link} target="_blank" rel="noreferrer"><ExternalLink size={11} />リンク</a>}
              </div>
            </div>
            <button className="icon-btn faint" onClick={() => updateTrip({ ...trip, reservations: list.filter((x) => x.id !== r.id) })}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="mini-form">
        <label className="field-label">カテゴリ</label>
        <select className="field-input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {RESV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="field-label">名称</label>
        <input className="field-input" placeholder="名称(例:ANA123便 / ○○ホテル)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <label className="field-label">予約番号(任意)</label>
        <input className="field-input" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} />
        <label className="field-label">リンク(任意)</label>
        <input className="field-input" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
        <button className="btn-mini full" onClick={add}>予約を追加</button>
      </div>
    </div>
  );
}

/* ============================== 予算タブ ============================== */

const yen = (n) => `¥${Math.round(n).toLocaleString()}`;

function BudgetTab({ trip, updateTrip }) {
  const [f, setF] = useState({ category: "交通", amount: "", memo: "" });
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(trip.budget ?? "");
  const list = trip.expenses || [];
  const total = list.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const hasBudget = trip.budget !== null && trip.budget !== undefined && trip.budget !== "";
  const remaining = hasBudget ? trip.budget - total : null;
  const pct = hasBudget && trip.budget > 0 ? Math.min(100, Math.round((total / trip.budget) * 100)) : null;

  const add = () => {
    if (!f.amount || Number(f.amount) <= 0) return;
    updateTrip({ ...trip, expenses: [...list, { id: uid(), category: f.category, amount: Number(f.amount), memo: f.memo.trim() }] });
    setF({ category: "交通", amount: "", memo: "" });
  };

  const saveBudget = () => {
    updateTrip({ ...trip, budget: budgetInput === "" ? null : Number(budgetInput) });
    setEditingBudget(false);
  };

  return (
    <div className="tab-content">
      <div className="mini-form">
        {editingBudget ? (
          <>
            <label className="field-label">予算</label>
            <input type="number" className="field-input" placeholder="例:350000" value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)} autoFocus />
            <div className="form-actions">
              <button className="btn-mini full" onClick={saveBudget}>保存する</button>
              <button className="btn-secondary full" onClick={() => { setEditingBudget(false); setBudgetInput(trip.budget ?? ""); }}>やめる</button>
            </div>
          </>
        ) : (
          <>
            <div className="schedule-top" style={{ justifyContent: "space-between" }}>
              <span className="section-title" style={{ fontSize: 13 }}><Wallet size={15} />予算</span>
              <button className="icon-btn faint" onClick={() => setEditingBudget(true)}><Pencil size={15} /></button>
            </div>
            <div style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 900, fontSize: 22, color: "var(--sky-deep)", marginTop: 4 }}>
              {hasBudget ? yen(trip.budget) : "未設定"}
            </div>
            {!hasBudget && <div className="field-hint">予算を設定すると、実際の支出との差が分かります</div>}
          </>
        )}
      </div>

      <div className="mini-form">
        <div className="section-title" style={{ fontSize: 13 }}>実際に使った金額</div>
        <div style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 900, fontSize: 22, color: "var(--navy)", marginTop: 4 }}>
          {yen(total)}
        </div>
        {hasBudget && (
          <>
            <div style={{ background: "#EEF2F5", borderRadius: 999, height: 8, marginTop: 10, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 999,
                background: remaining < 0 ? "linear-gradient(135deg, #C25B3E, #FFB4A2)" : "linear-gradient(135deg, #3FA9E0, #5FBEEA)",
              }} />
            </div>
            <div className="field-hint" style={{ marginTop: 6, color: remaining < 0 ? "#C25B3E" : "var(--navy)", opacity: remaining < 0 ? 0.9 : 0.55 }}>
              {remaining < 0 ? `予算を ${yen(-remaining)} オーバーしています` : `残り ${yen(remaining)}(予算の${pct}%を使用)`}
            </div>
          </>
        )}
      </div>

      <div className="card-list">
        {list.length === 0 && <div className="empty-state"><Wallet size={28} strokeWidth={1.5} /><span>支出はまだ記録されていません</span></div>}
        {list.map((e) => (
          <div key={e.id} className="reservation-item">
            <span className="cat-dot" style={{ background: CAT_COLORS[e.category] ? CAT_COLORS[e.category].dot : "#C9CED6" }} />
            <div className="reservation-body">
              <div className="reservation-name">{e.memo || e.category}</div>
              <div className="reservation-meta">
                <span className="cat-badge" style={{ background: "#EEF0F2", color: "#6B7280" }}>{e.category}</span>
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>{yen(e.amount)}</span>
              </div>
            </div>
            <button className="icon-btn faint" onClick={() => updateTrip({ ...trip, expenses: list.filter((x) => x.id !== e.id) })}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      <div className="mini-form">
        <label className="field-label">カテゴリ</label>
        <select className="field-input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="field-label">金額</label>
        <input type="number" className="field-input" placeholder="例:18000" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        <label className="field-label">メモ(任意)</label>
        <input className="field-input" placeholder="例:初日の夕食" value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} />
        <button className="btn-mini full" onClick={add}>支出を追加</button>
      </div>
    </div>
  );
}

/* ============================== 旅行詳細ページ ============================== */

const TABS = [
  { key: "schedule", label: "日程", icon: Calendar },
  { key: "packing", label: "持ち物", icon: Package },
  { key: "shopping", label: "買うもの", icon: ShoppingCart },
  { key: "todo", label: "やること", icon: ListChecks },
  { key: "reservation", label: "予約", icon: Ticket },
  { key: "budget", label: "予算", icon: Wallet },
];

function TripDetail({ trip, updateTrip, onBack, onOpenDrawer, onDelete }) {
  const [tab, setTab] = useState("schedule");
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPdfPanel, setShowPdfPanel] = useState(false);

  return (
    <div className="screen">
      <div className="detail-header">
        <button className="icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="detail-title">
          <span className="detail-emoji">{trip.emoji}</span>
          <div>
            <div className="detail-name">{trip.name}</div>
            <div className="detail-sub"><MapPin size={11} />{trip.destination} ・ {trip.startDate}〜{trip.endDate}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowPdfPanel(true)}><Download size={19} /></button>
        <button className="icon-btn" onClick={() => setShowEdit(true)}><Pencil size={18} /></button>
        <button className="icon-btn" onClick={() => updateTrip({ ...trip, archived: !trip.archived })}>
          {trip.archived ? <RotateCcw size={18} /> : <Archive size={18} />}
        </button>
        <button className="icon-btn" onClick={onOpenDrawer}><Menu size={20} /></button>
      </div>

      {trip.members.length > 0 && (
        <div className="chip-row">
          <Users size={14} style={{ opacity: 0.5 }} />
          {trip.members.map((m, i) => <span key={i} className="chip static">{m}</span>)}
        </div>
      )}

      <div className="tab-bar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={"tab-btn" + (tab === key ? " active" : "")} onClick={() => setTab(key)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "schedule" && <ScheduleTab trip={trip} updateTrip={updateTrip} />}
      {tab === "packing" && <CheckListTab items={trip.packingList} onChange={(v) => updateTrip({ ...trip, packingList: v })} placeholder={{ empty: "持ち物はまだありません", input: "持ち物を入力(例:パスポート)" }} />}
      {tab === "shopping" && <CheckListTab items={trip.shoppingList} onChange={(v) => updateTrip({ ...trip, shoppingList: v })} placeholder={{ empty: "現地で買いたいものはまだありません", input: "買うものを入力(例:お土産)" }} />}
      {tab === "todo" && <TodoTab trip={trip} updateTrip={updateTrip} />}
      {tab === "reservation" && <ReservationTab trip={trip} updateTrip={updateTrip} />}
      {tab === "budget" && <BudgetTab trip={trip} updateTrip={updateTrip} />}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        {confirmDelete ? (
          <ConfirmInline onConfirm={() => onDelete(trip.id)} onCancel={() => setConfirmDelete(false)} />
        ) : (
          <button className="link-btn danger" onClick={() => setConfirmDelete(true)}>この旅行を削除する</button>
        )}
      </div>

      {showEdit && <TripPanel initial={trip} onSave={(t) => { updateTrip(t); setShowEdit(false); }} onClose={() => setShowEdit(false)} />}

      {showPdfPanel && (
        <div className="overlay" onClick={() => setShowPdfPanel(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h3>出力する項目を選んでください</h3>
              <button className="icon-btn" onClick={() => setShowPdfPanel(false)}><X size={20} /></button>
            </div>
            <div className="panel-body">
              {["📅 日程", "🎒 持ち物", "🛒 買うもの", "✅ やること"].map((label) => (
                <label key={label} className="checkbox-label"><input type="checkbox" defaultChecked />{label}</label>
              ))}
              <label className="field-label" style={{ marginTop: 12 }}>1ページに何日分載せる?</label>
              <select className="field-input" defaultValue="2">
                <option value="1">1日</option>
                <option value="2">2日</option>
                <option value="3">3日</option>
              </select>
              <div className="field-hint">予定が多い日がある場合は、少なめにすると崩れにくくなります</div>
              <div className="field-hint" style={{ marginTop: 10, color: "#C25B3E", opacity: 0.85 }}>
                ※ このプレビュー画面では印刷機能を確認できません。公開後の実際のアプリでお試しください。
              </div>
            </div>
            <div className="panel-footer">
              <button className="btn-primary full" onClick={() => setShowPdfPanel(false)}>この内容で出力する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== ホーム画面 ============================== */

function Home({ trips, onOpenDrawer, onOpenTrip, onAddTrip }) {
  const upcoming = trips
    .filter((t) => !t.archived)
    .map((t) => ({ t, status: tripStatus(t) }))
    .filter(({ status }) => status.kind !== "past")
    .sort((a, b) => new Date(a.t.startDate) - new Date(b.t.startDate))[0];

  if (!upcoming) {
    return (
      <div className="screen">
        <div className="home-topbar">
          <button className="icon-btn" onClick={onOpenDrawer}><Menu size={22} /></button>
          <span className="home-topbar-title">旅のしおり</span>
          <span style={{ width: 22 }} />
        </div>
        <div className="hero-empty">
          <Sparkles size={30} />
          <h2>次の旅行を計画しよう</h2>
          <p>まだ予定中の旅行がありません</p>
          <button className="btn-primary" onClick={onAddTrip}>旅行を追加する</button>
        </div>
      </div>
    );
  }

  const { t, status } = upcoming;
  const countdownText = status.kind === "ongoing" ? "旅行中!" : status.kind === "today" ? "今日から出発!" : `あと${status.diffDays}日`;

  // 次の予定(最大5件): 予定 + 日時付きtodo をマージし時系列順
  const scheduleEntries = Object.entries(t.days).flatMap(([date, items]) =>
    items.map((it) => ({ date, item: it, kind: "schedule" }))
  );
  const todoEntries = TODO_PHASES.flatMap((p) =>
    (t.todos[p.key] || []).filter((td) => td.date).map((td) => ({ date: td.date, item: td, kind: "todo" }))
  );
  const allEntries = [...scheduleEntries, ...todoEntries]
    .map((e) => ({ ...e, sv: sortValue(e.date, toMinutes(e.item.time), e.item.timeZone || "jst", t) }))
    .sort((a, b) => a.sv - b.sv)
    .slice(0, 5);

  const pendingPhase = status.kind === "ongoing" ? "during" : "pre";
  const pendingTodos = (t.todos[pendingPhase] || []).filter((x) => !x.checked);
  const pendingShopping = (t.shoppingList || []).filter((x) => !x.checked);

  return (
    <div className="screen">
      <div className="home-topbar">
        <button className="icon-btn" onClick={onOpenDrawer}><Menu size={22} /></button>
        <span className="home-topbar-title">旅のしおり</span>
        <span style={{ width: 22 }} />
      </div>

      <div className="home-hero" onClick={() => onOpenTrip(t.id)}>
        <div className="home-hero-emoji">{t.emoji}</div>
        <div className="home-hero-count">{countdownText}</div>
        <div className="home-hero-name">{t.name}</div>
        <div className="home-hero-dest"><MapPin size={12} />{t.destination}</div>
        <div className="home-hero-dates">{t.startDate} 〜 {t.endDate}</div>
      </div>

      <div className="section">
        <div className="section-title"><Calendar size={16} />次の予定</div>
        {allEntries.length === 0 && <div className="empty-state"><Calendar size={26} strokeWidth={1.5} /><span>予定はまだありません</span></div>}
        {allEntries.map(({ date, item, kind }, i) => (
          <div key={i} className="mini-item clickable" onClick={() => {
            const loc = item.location || item.arrivalLocation;
            if (loc) window.open(`https://maps.google.com/?q=${encodeURIComponent(loc)}`, "_blank");
          }}>
            {kind === "schedule" ? (
              <span className="cat-dot" style={{ background: CAT_COLORS[item.category].dot }} />
            ) : (
              <span style={{ fontSize: 13 }}>✅</span>
            )}
            <div className="mini-item-body">
              <div className="mini-item-time-row">
                {t.isInternational && t.timeDiffHours !== 0 && <span style={{ fontSize: 11 }}>{item.timeZone === "local" ? "📍" : "🇯🇵"}</span>}
                <span className="mini-time">{item.time}</span>
                <span className="mini-date-label">{fmtDateLabel(date)}</span>
                {item.endTime && <><ArrowRight size={10} style={{ opacity: 0.5 }} /><span className="mini-time">{item.endTime}</span></>}
              </div>
              <div className="mini-title">{kind === "schedule" ? item.title : `✅ ${item.text}`}</div>
              {item.location && <div className="mini-loc"><MapPin size={10} />{item.location}</div>}
            </div>
            <ChevronRight size={16} className="mini-arrow" />
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-title"><ListChecks size={16} />やることリスト({pendingPhase === "during" ? "旅行中" : "旅行前"})</div>
        {pendingTodos.length === 0 && <div className="empty-state"><span>未完了のタスクはありません</span></div>}
        {pendingTodos.map((td) => (
          <div key={td.id} className="mini-item"><span className="cat-dot" style={{ background: "#C9CED6" }} /><div className="mini-item-body"><div className="mini-title">{td.text}</div></div></div>
        ))}
      </div>

      <div className="section">
        <div className="section-title"><ShoppingCart size={16} />買うものリスト</div>
        {pendingShopping.length === 0 && <div className="empty-state"><span>買い忘れはなさそうです</span></div>}
        {pendingShopping.map((s) => (
          <div key={s.id} className="mini-item"><span className="cat-dot" style={{ background: "#C9CED6" }} /><div className="mini-item-body"><div className="mini-title">{s.text}</div></div></div>
        ))}
      </div>

      <button className="btn-secondary full" onClick={() => onOpenTrip(t.id)}>このしおりを開く</button>
    </div>
  );
}

/* ============================== ドロワー(旅行一覧) ============================== */

function Drawer({ open, trips, onClose, onOpenTrip, onAddTrip, onToggleArchive }) {
  const [showArchived, setShowArchived] = useState(false);
  const active = trips.filter((t) => !t.archived);
  const upcoming = active.filter((t) => tripStatus(t).kind !== "past").sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const past = active.filter((t) => tripStatus(t).kind === "past").sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  const archived = trips.filter((t) => t.archived);

  const TripCard = (t) => (
    <div key={t.id} className="trip-card" onClick={() => onOpenTrip(t.id)}>
      <span className="trip-card-emoji">{t.emoji}</span>
      <div className="trip-card-body">
        <div className="trip-card-name">{t.name}</div>
        <div className="trip-card-dest"><MapPin size={10} />{t.destination}</div>
        <div className="trip-card-dates">{t.startDate} 〜 {t.endDate}</div>
      </div>
      <button className="icon-btn faint" onClick={(e) => { e.stopPropagation(); onToggleArchive(t.id); }}>
        {t.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
      </button>
      <ChevronRight size={16} className="chevron" />
    </div>
  );

  return (
    <>
      <div className={"drawer-overlay" + (open ? " show" : "")} onClick={onClose} />
      <div className={"drawer" + (open ? " open" : "")}>
        <div className="drawer-header">
          <h2>旅行一覧</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="drawer-body">
          <button className="btn-primary full" onClick={onAddTrip}><Plus size={16} />旅行を追加</button>

          <div className="section">
            <div className="section-title">予定中</div>
            {upcoming.length === 0 && <div className="empty-state">予定中の旅行はありません</div>}
            {upcoming.map(TripCard)}
          </div>

          <div className="section">
            <div className="section-title">終わった旅行</div>
            {past.length === 0 && <div className="empty-state">終わった旅行はまだありません</div>}
            {past.map(TripCard)}
          </div>

          <button className="link-btn" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? "アーカイブ済みを隠す" : `アーカイブ済みを見る(${archived.length})`}
          </button>
          {showArchived && (
            <div className="section">
              {archived.length === 0 && <div className="empty-state">アーカイブ済みの旅行はありません</div>}
              {archived.map(TripCard)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================== ルート ============================== */

export default function App() {
  const [trips, setTrips] = useState(null); // null = 読み込み中
  const [saveError, setSaveError] = useState(false);
  const [view, setView] = useState("home"); // home | detail
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const tripsDocRef = doc(db, "appData", "trips");

  // Firestoreをリアルタイム監視。家族の誰かが編集したら、他の人の画面にも自動で反映される。
  useEffect(() => {
    const unsubscribe = onSnapshot(
      tripsDocRef,
      (snap) => {
        setTrips(snap.exists() ? (snap.data().value || []) : []);
      },
      (err) => {
        console.error(err);
        setSaveError(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const persist = async (newTrips) => {
    setTrips(newTrips); // 画面には即座に反映(操作した本人は待たされない)
    try {
      await setDoc(tripsDocRef, { value: newTrips });
      setSaveError(false);
    } catch (err) {
      console.error(err);
      setSaveError(true);
    }
  };

  const selectedTrip = (trips || []).find((t) => t.id === selectedId);

  const updateTrip = (t) => persist((trips || []).map((x) => (x.id === t.id ? t : x)));
  const addTrip = (t) => { persist([...(trips || []), t]); setShowCreate(false); setDrawerOpen(false); };
  const deleteTrip = (id) => { persist((trips || []).filter((t) => t.id !== id)); setView("home"); };
  const toggleArchive = (id) => persist((trips || []).map((t) => (t.id === id ? { ...t, archived: !t.archived } : t)));

  if (trips === null) {
    return (
      <div className="app-root">
        <style>{CSS}</style>
        <div className="loading">読み込み中…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <style>{CSS}</style>

      {saveError && <div className="save-error">保存できませんでした。通信環境をご確認ください</div>}

      <div className="content">
        {view === "home" && (
          <Home trips={trips} onOpenDrawer={() => setDrawerOpen(true)}
            onOpenTrip={(id) => { setSelectedId(id); setView("detail"); }}
            onAddTrip={() => setShowCreate(true)} />
        )}
        {view === "detail" && selectedTrip && (
          <TripDetail trip={selectedTrip} updateTrip={updateTrip}
            onBack={() => setView("home")} onOpenDrawer={() => setDrawerOpen(true)}
            onDelete={deleteTrip} />
        )}
      </div>

      <Drawer open={drawerOpen} trips={trips} onClose={() => setDrawerOpen(false)}
        onOpenTrip={(id) => { setSelectedId(id); setView("detail"); setDrawerOpen(false); }}
        onAddTrip={() => setShowCreate(true)} onToggleArchive={toggleArchive} />

      {showCreate && <TripPanel onSave={addTrip} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* ============================== CSS(指定どおり) ============================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');

.app-root {
  --sky: #7FCBF2;
  --sky-soft: #B4E0F5;
  --sky-deep: #3FA9E0;
  --navy: #33566E;
  --pink: #FFB6B9;
  --pink-soft: #FFD5D7;
  --coral: #FFB4A2;
  --cream: #F5FBFD;
  --sand: #FDF0E9;
  --gray: #BFC9D2;
  --green: #71C6AC;
  font-family: 'Zen Kaku Gothic New', sans-serif;
  background: linear-gradient(180deg, #EDF8FC 0%, #F5FBFD 30%, #FDF6F1 100%);
  background-attachment: fixed;
  color: var(--navy);
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}
.loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 100vh; color: var(--sky-deep); font-weight: 700;
}
.save-error {
  background: #FFE3DC; color: #C25B3E; font-size: 12px; text-align: center; padding: 6px;
}
.field-hint { font-size: 10.5px; opacity: 0.55; margin-top: 3px; line-height: 1.5; }
.tz-toggle { display: flex; gap: 6px; margin-top: 2px; }
.tz-btn {
  flex: 1; background: white; border: 1.5px solid #E4E9ED; border-radius: 12px; padding: 8px 6px;
  font-size: 12px; font-weight: 700; color: var(--navy); opacity: 0.55; cursor: pointer;
}
.tz-btn.active { opacity: 1; background: linear-gradient(135deg, #3FA9E0, #5FBEEA); color: white; border-color: transparent; box-shadow: 0 4px 10px rgba(63,169,224,0.25); }
.tz-pin { font-size: 12px; }
.carryover-card {
  background: #EAF6FB; border: 1.5px dashed var(--sky-soft); border-radius: 14px;
  padding: 10px 13px; font-size: 12px; font-weight: 700; color: var(--sky-deep);
}
.content { padding: 16px 16px 40px; }
.screen { display: flex; flex-direction: column; gap: 20px; }

.home-topbar { display: flex; align-items: center; justify-content: space-between; }
.home-topbar-title { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: 0.03em; }
.home-topbar-title::before { content: '🌴 '; }

.hero-empty {
  background: linear-gradient(150deg, #8FD3F4 0%, #B4E4F6 55%, #FFD5D7 100%);
  border-radius: 28px; padding: 44px 20px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px; color: #fff;
  box-shadow: 0 12px 28px rgba(63,169,224,0.25);
}
.hero-empty svg { filter: drop-shadow(0 2px 6px rgba(51,86,110,0.15)); }
.hero-empty h2 { font-family: 'Zen Maru Gothic', sans-serif; margin: 4px 0 0; font-size: 18px; }
.hero-empty p { margin: 0; opacity: 0.9; font-size: 13px; }
.hero-empty .btn-primary { background: #fff; color: var(--sky-deep); box-shadow: 0 6px 16px rgba(51,86,110,0.15); margin-top: 4px; }

.home-hero {
  background: linear-gradient(150deg, #8FD3F4 0%, #B4E4F6 55%, #FFD5D7 100%);
  border-radius: 28px; padding: 28px 22px; text-align: center; cursor: pointer;
  box-shadow: 0 12px 28px rgba(63,169,224,0.28);
  position: relative; overflow: hidden;
}
.home-hero::after {
  content: ''; position: absolute; top: -40px; right: -30px;
  width: 130px; height: 130px; border-radius: 50%;
  background: rgba(255,255,255,0.25);
}
.home-hero-emoji { font-size: 42px; position: relative; }
.home-hero-count {
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 900; font-size: 22px;
  color: #fff; margin-top: 4px; position: relative;
  text-shadow: 0 2px 8px rgba(51,86,110,0.18);
}
.home-hero-name { font-weight: 700; font-size: 15px; margin-top: 6px; color: #fff; position: relative; }
.home-hero-dest { font-size: 12px; color: #fff; opacity: 0.95; display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 4px; position: relative; }
.home-hero-dates { font-size: 11px; color: #fff; opacity: 0.85; margin-top: 2px; position: relative; }

.section { display: flex; flex-direction: column; gap: 8px; }
.section-title {
  font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; gap: 7px; color: var(--navy);
}
.section-title svg { color: var(--pink); }
.mini-item { display: flex; align-items: center; gap: 8px; background: white; border-radius: 16px; padding: 11px 13px; font-size: 13px; box-shadow: 0 3px 10px rgba(63,169,224,0.07); }
.mini-item.clickable { cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
.mini-item.clickable:active { transform: scale(0.99); background: #F3FAFE; }
.mini-item-body { flex: 1; min-width: 0; }
.mini-item-time-row { display: flex; align-items: center; gap: 4px; }
.mini-time { font-weight: 700; color: var(--sky-deep); font-size: 12.5px; }
.mini-date-label { font-weight: 700; color: var(--navy); opacity: 0.55; font-size: 11px; }
.mini-arrow { opacity: 0.5; }
.mini-title { font-size: 13px; margin-top: 1px; }
.mini-loc { font-size: 11px; opacity: 0.65; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }

.btn-primary {
  background: linear-gradient(135deg, #3FA9E0, #5FBEEA); color: white; border: none; border-radius: 16px;
  padding: 13px 18px; font-weight: 700; font-size: 14px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  box-shadow: 0 6px 16px rgba(63,169,224,0.3);
}
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary.full { width: 100%; }
.btn-secondary {
  background: white; color: var(--sky-deep); border: 1.5px solid var(--sky-soft); border-radius: 16px;
  padding: 12px 16px; font-weight: 700; font-size: 13px; cursor: pointer;
  box-shadow: 0 3px 10px rgba(63,169,224,0.08);
}
.btn-secondary.full { width: 100%; }
.btn-mini {
  background: linear-gradient(135deg, #5FBEEA, #7FCBF2); color: white; border: none; border-radius: 12px;
  padding: 9px 13px; font-size: 12.5px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(63,169,224,0.22);
}
.btn-mini.full { width: 100%; justify-content: center; margin-top: 6px; }
.btn-mini.danger { background: #FFB4A2; color: #8A3B26; box-shadow: none; }
.icon-btn { background: none; border: none; cursor: pointer; color: var(--navy); padding: 4px; display: flex; }
.icon-btn.faint { opacity: 0.45; }
.icon-btn.faint:hover { opacity: 0.9; }
.link-btn { background: none; border: none; color: var(--sky-deep); font-size: 12.5px; font-weight: 700; cursor: pointer; text-decoration: underline; padding: 6px; }
.link-btn.danger { color: #C25B3E; }

.drawer-overlay {
  position: fixed; inset: 0; background: rgba(44,74,99,0.35); z-index: 40;
  opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.drawer-overlay.show { opacity: 1; pointer-events: auto; }
.drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: 86%; max-width: 340px;
  background: var(--cream); z-index: 45; transform: translateX(-100%);
  transition: transform 0.25s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.12);
}
.drawer.open { transform: translateX(0); }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 16px 6px; }
.drawer-header h2 { font-family: 'Zen Maru Gothic', sans-serif; font-size: 17px; margin: 0; }
.drawer-body { padding: 6px 16px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }

.trip-card {
  display: flex; align-items: center; gap: 12px; background: white; border-radius: 18px;
  padding: 13px 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(63,169,224,0.1);
  transition: transform 0.12s;
}
.trip-card:active { transform: scale(0.99); }
.trip-card-emoji { font-size: 26px; }
.trip-card-body { flex: 1; min-width: 0; }
.trip-card-name { font-weight: 700; font-size: 14px; }
.trip-card-dest { font-size: 11.5px; opacity: 0.7; display: flex; align-items: center; gap: 3px; margin-top: 2px; }
.trip-card-dates { font-size: 11px; opacity: 0.55; margin-top: 2px; }
.chevron { opacity: 0.3; flex-shrink: 0; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--gray);
  padding: 22px 0; font-size: 12.5px;
}

.overlay {
  position: fixed; inset: 0; background: rgba(44,74,99,0.35); display: flex;
  align-items: flex-end; justify-content: center; z-index: 60;
}
.panel {
  background: var(--cream); width: 100%; max-width: 480px; border-radius: 24px 24px 0 0;
  max-height: 88vh; display: flex; flex-direction: column;
}
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 6px; }
.panel-header h3 { font-family: 'Zen Maru Gothic', sans-serif; margin: 0; font-size: 17px; }
.panel-body { padding: 6px 20px 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.panel-footer { padding: 12px 20px 20px; }

.field-label { font-size: 11.5px; font-weight: 700; opacity: 0.6; margin: 10px 0 4px; display: block; }
.field-input {
  width: 100%; border: 1.5px solid #E4E9ED; border-radius: 12px; padding: 10px 12px;
  font-size: 13.5px; font-family: inherit; background: white; color: var(--navy);
  box-sizing: border-box; -webkit-appearance: none; appearance: none; max-width: 100%;
}
input[type="time"].field-input, input[type="date"].field-input {
  -webkit-appearance: none; appearance: none; min-width: 0;
}
.field-row { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
.field-row > div { min-width: 0; }
.field-row input, .field-row select { width: 100%; box-sizing: border-box; }
.checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; margin-top: 8px; }

.emoji-picker { display: flex; flex-wrap: wrap; gap: 6px; }
.emoji-choice {
  font-size: 20px; background: white; border: 2px solid transparent; border-radius: 12px;
  width: 42px; height: 42px; cursor: pointer;
}
.emoji-choice.selected { border-color: var(--sky-deep); background: #E8F6FD; }

.chip-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.chip {
  background: #E3F4FC; color: var(--sky-deep); border-radius: 999px; padding: 5px 11px;
  font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; cursor: default;
}
.chip svg { cursor: pointer; opacity: 0.6; }
.chip.static { background: #E3F4FC; }

.add-inline { display: flex; gap: 8px; margin-top: 4px; }
.add-inline input {
  flex: 1; border: 1.5px solid #E4E9ED; border-radius: 12px; padding: 9px 12px; font-size: 13px;
  font-family: inherit; background: white; color: var(--navy);
}

.detail-header { display: flex; align-items: center; gap: 8px; }
.detail-title { flex: 1; display: flex; align-items: center; gap: 10px; min-width: 0; }
.detail-emoji { font-size: 28px; }
.detail-name { font-family: 'Zen Maru Gothic', sans-serif; font-weight: 700; font-size: 16px; }
.detail-sub { font-size: 11px; opacity: 0.65; display: flex; align-items: center; gap: 3px; margin-top: 2px; }

.tab-bar { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; }
.tab-btn {
  flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: white; border: none; border-radius: 15px; padding: 9px 14px; color: var(--navy);
  opacity: 0.5; font-size: 11px; font-weight: 700; cursor: pointer;
  box-shadow: 0 2px 8px rgba(63,169,224,0.06);
}
.tab-btn.active { opacity: 1; background: linear-gradient(135deg, #FFC2C4, #FFD5D7); color: #A85A5C; box-shadow: 0 4px 12px rgba(255,182,185,0.35); }
.tab-content { margin-top: 4px; display: flex; flex-direction: column; gap: 10px; }

.day-tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 10px; }
.day-tab {
  flex-shrink: 0; background: white; border: none; border-radius: 14px; padding: 8px 13px;
  font-size: 11.5px; font-weight: 700; color: var(--navy); opacity: 0.55; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  box-shadow: 0 2px 8px rgba(63,169,224,0.06);
}
.day-tab span { font-weight: 500; opacity: 0.8; font-size: 10px; }
.day-tab.active { opacity: 1; background: linear-gradient(135deg, #3FA9E0, #5FBEEA); color: white; box-shadow: 0 4px 12px rgba(63,169,224,0.28); }

.card-list { display: flex; flex-direction: column; gap: 8px; }

.check-row { display: flex; align-items: center; gap: 10px; background: white; border-radius: 16px; padding: 11px 13px; box-shadow: 0 3px 10px rgba(63,169,224,0.07); }
.check-row.checked .check-text { text-decoration: line-through; opacity: 0.45; }
.check-circle {
  width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--sky-deep); background: white;
  display: flex; align-items: center; justify-content: center; color: var(--sky-deep); cursor: pointer; flex-shrink: 0;
}
.check-row.checked .check-circle { background: var(--green); border-color: var(--green); color: white; }
.check-text { flex: 1; font-size: 13.5px; }
.check-text-col { flex: 1; min-width: 0; }
.check-text-col.clickable { cursor: pointer; }
.todo-date-badge {
  display: flex; align-items: center; gap: 3px; margin-top: 3px;
  font-size: 10.5px; font-weight: 700; color: var(--sky-deep); opacity: 0.85;
  text-decoration: none;
}
.check-row.checked .todo-date-badge { opacity: 0.4; }

.schedule-item.todo-linked { background: #FAFBFC; border: 1.5px dashed #DCE2E7; box-shadow: none; }
.schedule-item.todo-linked .schedule-time-col { color: var(--gray); }
.schedule-item.todo-linked.checked .schedule-title { text-decoration: line-through; opacity: 0.45; }
.todo-badge { background: #EEF0F2; color: #6B7280; display: inline-flex; align-items: center; gap: 3px; }

.schedule-item { display: flex; gap: 10px; background: white; border-radius: 18px; padding: 13px; box-shadow: 0 3px 12px rgba(63,169,224,0.08); }
.schedule-item.clickable { cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
.schedule-item.clickable:active { transform: scale(0.99); background: #F8FCFE; }
.schedule-time-badge { display: flex; align-items: center; gap: 4px; }
.schedule-time-col {
  display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 46px;
  font-weight: 900; color: var(--sky-deep); font-size: 12.5px; font-family: 'Zen Maru Gothic', sans-serif;
}
.schedule-time-sub { font-size: 10px; font-weight: 700; opacity: 0.75; }
.schedule-main { flex: 1; min-width: 0; }
.schedule-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cat-badge { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.schedule-title { font-weight: 700; font-size: 13.5px; }
.schedule-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; font-size: 11px; opacity: 0.75; }
.meta-link { display: flex; align-items: center; gap: 3px; color: var(--sky-deep); text-decoration: none; }
.meta-tag { display: flex; align-items: center; gap: 3px; }
.meta-memo { opacity: 0.7; }

.reservation-item { display: flex; align-items: center; gap: 10px; background: white; border-radius: 16px; padding: 11px 13px; box-shadow: 0 3px 10px rgba(63,169,224,0.07); }
.reservation-body { flex: 1; min-width: 0; }
.reservation-name { font-weight: 700; font-size: 13.5px; }
.reservation-meta { display: flex; gap: 10px; font-size: 11px; opacity: 0.7; margin-top: 3px; }
.reservation-meta a { color: var(--sky-deep); display: inline-flex; align-items: center; gap: 3px; }

.mini-form { background: white; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 3px 12px rgba(63,169,224,0.08); }
.form-actions { display: flex; gap: 8px; margin-top: 8px; }
.form-actions .btn-mini.full, .form-actions .btn-secondary.full { width: auto; flex: 1; margin-top: 0; }
.mini-form .field-row { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }

.confirm-delete { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; font-size: 12px; }
`;
