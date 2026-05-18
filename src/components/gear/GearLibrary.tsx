"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Check, CircleDollarSign, Link, Package, Pencil, Search, ShieldCheck, Trash2, WandSparkles, Wrench } from "lucide-react";
import { Button } from "@/components/base/Button";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseCategoryDTO } from "@/components/ledger/types";
import type { GearDTO, GearLinkPreviewDTO, GearStatus, GearSummaryDTO } from "./types";

type Props = {
  initialItems: GearDTO[];
  initialSummary: GearSummaryDTO | null;
  expenseCategories: ExpenseCategoryDTO[];
};

const categoryOptions = [
  { value: "computer", label: "电脑与外设" },
  { value: "phone", label: "手机和平板" },
  { value: "camera", label: "影像设备" },
  { value: "audio", label: "音频设备" },
  { value: "wearable", label: "穿戴设备" },
  { value: "home", label: "家用设备" },
  { value: "outdoor", label: "户外装备" },
  { value: "tool", label: "工具" },
  { value: "other", label: "其他" },
];

const statusOptions: Array<{ value: GearStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "active", label: "在用" },
  { value: "wishlist", label: "想买" },
  { value: "repair", label: "维修" },
  { value: "sold", label: "已出" },
  { value: "retired", label: "退役" },
];

function centsToInput(value: number | null) {
  if (!value) return "";
  const yuan = value / 100;
  return Number.isInteger(yuan) ? String(yuan) : yuan.toFixed(2);
}

function inputToCents(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function dateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function inputDateToIso(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function shortDate(value: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "未记录";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function isWarrantySoon(item: GearDTO) {
  if (!item.warrantyUntil || item.status !== "active") return false;
  const warranty = new Date(item.warrantyUntil).getTime();
  const now = Date.now();
  return warranty >= now && warranty <= now + 90 * 24 * 60 * 60 * 1000;
}

function GearQuickCapture({
  categories,
  onCreated,
}: {
  categories: ExpenseCategoryDTO[];
  onCreated: (item: GearDTO) => void;
}) {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<GearStatus>("active");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseChannel, setPurchaseChannel] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyUntil, setWarrantyUntil] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [createExpense, setCreateExpense] = useState(true);
  const [expenseCategoryId, setExpenseCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [link, setLink] = useState("");
  const [linkDraft, setLinkDraft] = useState<GearLinkPreviewDTO | null>(null);
  const [readingLink, setReadingLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function readLink() {
    const url = link.trim();
    if (!url || readingLink) return;

    setReadingLink(true);
    setMessage("");
    const res = await fetch("/api/gear/link-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setReadingLink(false);

    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "这个链接暂时读不到，先手动录入");
      return;
    }

    const preview = data.preview as GearLinkPreviewDTO;
    setLinkDraft(preview);
    setValue(preview.rawText);
    if (!category && preview.draft.category) setCategory(preview.draft.category);
    setBrand((current) => current || preview.draft.brand || "");
    setModel((current) => current || preview.draft.model || "");
    setPurchasePrice((current) => current || centsToInput(preview.draft.purchasePrice));
    setPurchaseChannel((current) => current || preview.draft.purchaseChannel || "");
    setNotes((current) => current || preview.draft.notes || "");
    setCreateExpense(false);
    setMessage(`已读取 ${preview.sourceHost}，确认后入库。`);
  }

  async function submit() {
    const rawText = value.trim();
    if (!rawText || saving) return;

    setSaving(true);
    setMessage("");
    const activeLinkDraft = linkDraft && rawText === linkDraft.rawText ? linkDraft.draft : null;
    const res = await fetch("/api/gear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText,
        name: activeLinkDraft?.name,
        brand: brand.trim() || activeLinkDraft?.brand,
        model: model.trim() || activeLinkDraft?.model,
        category: category || activeLinkDraft?.category || undefined,
        status,
        location: location.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        purchasePrice: inputToCents(purchasePrice) ?? activeLinkDraft?.purchasePrice,
        currency: activeLinkDraft?.currency,
        purchaseDate: inputDateToIso(purchaseDate),
        purchaseChannel: purchaseChannel.trim() || activeLinkDraft?.purchaseChannel,
        warrantyUntil: inputDateToIso(warrantyUntil),
        specs: activeLinkDraft?.specs,
        notes: notes.trim() || activeLinkDraft?.notes,
        createExpense,
        expenseCategoryId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "这件装备先没入库，再试一次");
      return;
    }

    setValue("");
    setLink("");
    setLinkDraft(null);
    setBrand("");
    setModel("");
    setPurchasePrice("");
    setPurchaseChannel("");
    setPurchaseDate("");
    setWarrantyUntil("");
    setSerialNumber("");
    setLocation("");
    setNotes("");
    setMessage("已放进装备库。");
    window.setTimeout(() => setMessage(""), 2200);
    onCreated(data.item);
  }

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 shadow-[var(--shadow-sm)] sm:p-4">
      <div className="flex items-center gap-2 px-1 text-xs text-[var(--text-muted)]">
        <Package size={14} />
        快速入库
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)]">
          <Link size={14} className="shrink-0 text-[var(--text-muted)]" />
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void readLink();
              }
            }}
            placeholder="粘贴商品链接自动识别型号和价格"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-placeholder)]"
            inputMode="url"
          />
        </label>
        <Button variant="secondary" icon={<WandSparkles size={15} />} loading={readingLink} onClick={readLink} className="w-full sm:w-auto">
          读取
        </Button>
      </div>
      {linkDraft ? (
        <div className="mt-2 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2 text-xs leading-5 text-[var(--text-muted)]">
          <span className="text-[var(--text-secondary)]">{linkDraft.title}</span>
          {linkDraft.draft.purchasePrice ? (
            <span className="ml-2">{formatMoney(linkDraft.draft.purchasePrice, linkDraft.draft.currency)}</span>
          ) : null}
        </div>
      ) : null}
      <textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (linkDraft && event.target.value !== linkDraft.rawText) setLinkDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
        rows={2}
        placeholder="输入设备或物品型号，比如 MacBook Pro M4 32G 15999 京东 保修到 2027-05-18"
        className="mt-3 min-h-[76px] w-full resize-none rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-3 text-[15px] leading-6 outline-none placeholder:text-[var(--text-placeholder)]"
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:items-center">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)]"
          aria-label="装备分类"
        >
          <option value="">自动识别分类</option>
          {categoryOptions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as GearStatus)}
          className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)]"
          aria-label="装备状态"
        >
          {statusOptions.filter((item) => item.value !== "all").map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Wrench size={13} />
          自定义字段
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="品牌" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="型号" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <input value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} inputMode="decimal" placeholder="价格" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <input value={purchaseChannel} onChange={(event) => setPurchaseChannel(event.target.value)} placeholder="渠道" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" aria-label="购买日期" />
          <input type="date" value={warrantyUntil} onChange={(event) => setWarrantyUntil(event.target.value)} className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" aria-label="保修到期" />
          <input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="序列号" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="位置" className="h-10 min-w-0 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 text-sm outline-none" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="备注、配件、序列记录" className="min-h-20 min-w-0 resize-none rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-sm outline-none sm:col-span-2 lg:col-span-4" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--text-muted)]">
        <label className="inline-flex min-h-8 items-center gap-2">
          <input
            type="checkbox"
            checked={createExpense}
            onChange={(event) => setCreateExpense(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          识别到价格时同步记账
        </label>
        {categories.length > 0 ? (
          <select
            value={expenseCategoryId ?? ""}
            onChange={(event) => setExpenseCategoryId(event.target.value || null)}
            className="h-8 max-w-full rounded-lg border border-[var(--hairline)] bg-[var(--material-inset)] px-2 text-xs"
            aria-label="同步记账类型"
          >
            <option value="">不分类</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>{item.emoji} {item.name}</option>
            ))}
          </select>
        ) : null}
      </div>
      <Button onClick={submit} loading={saving} className="mt-3 w-full">
        入库
      </Button>
      {message ? <p className="mt-2 text-center text-xs text-[var(--text-muted)]">{message}</p> : null}
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)] numeric-display">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function GearCard({ item, onSelect }: { item: GearDTO; onSelect: (item: GearDTO) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[var(--text-muted)]">{item.categoryLabel} · {item.statusLabel}</p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--primary)]">
            {item.name}
          </h3>
        </div>
        {isWarrantySoon(item) ? (
          <span className="shrink-0 rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[11px] text-[var(--warning)]">
            保修临近
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
        <span className="truncate">品牌：{item.brand || "未记录"}</span>
        <span className="truncate">位置：{item.location || "未记录"}</span>
        <span className="truncate">购入：{shortDate(item.purchaseDate)}</span>
        <span className="truncate">价格：{item.purchasePrice ? formatMoney(item.purchasePrice, item.currency) : "未记录"}</span>
      </div>
      {item.notes ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{item.notes}</p>
      ) : null}
    </button>
  );
}

function GearDetailSheet({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: GearDTO;
  onClose: () => void;
  onUpdated: (item: GearDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand);
  const [model, setModel] = useState(item.model);
  const [category, setCategory] = useState(String(item.category));
  const [status, setStatus] = useState(String(item.status));
  const [location, setLocation] = useState(item.location);
  const [serialNumber, setSerialNumber] = useState(item.serialNumber);
  const [purchasePrice, setPurchasePrice] = useState(centsToInput(item.purchasePrice));
  const [purchaseDate, setPurchaseDate] = useState(dateInput(item.purchaseDate));
  const [purchaseChannel, setPurchaseChannel] = useState(item.purchaseChannel);
  const [warrantyUntil, setWarrantyUntil] = useState(dateInput(item.warrantyUntil));
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/gear/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brand,
        model,
        category,
        status,
        location,
        serialNumber,
        purchasePrice: inputToCents(purchasePrice),
        purchaseDate: inputDateToIso(purchaseDate),
        purchaseChannel,
        warrantyUntil: inputDateToIso(warrantyUntil),
        notes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "保存失败");
      return;
    }
    onUpdated(data.item);
    setEditing(false);
    setMessage("已更新。");
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/gear/${item.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setMessage("删除失败");
      return;
    }
    onDeleted(item.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[var(--overlay-scrim)] px-3 py-4 sm:px-6">
      <button type="button" className="absolute inset-0" aria-label="关闭装备详情" onClick={onClose} />
      <article className="absolute inset-x-3 bottom-3 mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] shadow-[var(--shadow-md)] sm:bottom-auto sm:top-8">
        <header className="shrink-0 border-b border-[var(--hairline)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[var(--text-muted)]">{item.categoryLabel} · {item.statusLabel}</p>
              <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-[var(--text-primary)]">{item.name}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm sm:col-span-2" aria-label="装备名称" />
              <input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="品牌" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="型号" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm">
                {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm">
                {statusOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} inputMode="decimal" placeholder="价格" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input value={purchaseChannel} onChange={(event) => setPurchaseChannel(event.target.value)} placeholder="渠道" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input type="date" value={warrantyUntil} onChange={(event) => setWarrantyUntil(event.target.value)} className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="位置" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} placeholder="序列号" className="h-11 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm" />
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="备注" className="min-h-24 resize-none rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3 text-sm sm:col-span-2" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="购入价格" value={item.purchasePrice ? formatMoney(item.purchasePrice, item.currency) : "未记录"} hint={item.purchaseChannel || "渠道未记录"} icon={<CircleDollarSign size={14} />} />
              <MetricCard label="保修" value={shortDate(item.warrantyUntil)} hint={isWarrantySoon(item) ? "90 天内到期" : "保修状态正常"} icon={<ShieldCheck size={14} />} />
              <div className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4 text-sm leading-7 text-[var(--text-secondary)] sm:col-span-2">
                <p>品牌：{item.brand || "未记录"}</p>
                <p>型号：{item.model || "未记录"}</p>
                <p>序列号：{item.serialNumber || "未记录"}</p>
                <p>位置：{item.location || "未记录"}</p>
                <p>购入日期：{shortDate(item.purchaseDate)}</p>
                {item.linkedExpense ? <p>关联记账：{formatMoney(item.linkedExpense.amount, item.linkedExpense.currency)}</p> : null}
              </div>
              {item.notes ? (
                <p className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4 text-sm leading-7 text-[var(--text-secondary)] sm:col-span-2">{item.notes}</p>
              ) : null}
            </div>
          )}
          {message ? <p className="mt-3 text-center text-xs text-[var(--text-muted)]">{message}</p> : null}
        </div>

        <footer className="shrink-0 border-t border-[var(--hairline)] px-4 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="danger" icon={<Trash2 size={15} />} loading={deleting} onClick={remove}>删除</Button>
            <div className="flex gap-2">
              {editing ? <Button variant="secondary" onClick={() => setEditing(false)}>取消</Button> : null}
              <Button icon={editing ? <Check size={15} /> : <Pencil size={15} />} loading={saving} onClick={editing ? save : () => setEditing(true)}>
                {editing ? "保存" : "编辑"}
              </Button>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

export function GearLibrary({ initialItems, initialSummary, expenseCategories }: Props) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<GearStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GearDTO | null>(null);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const statusMatched = status === "all" || item.status === status;
      const queryMatched = !normalized || [item.name, item.brand, item.model, item.notes, item.serialNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return statusMatched && queryMatched;
    });
  }, [items, query, status]);

  const summary = useMemo(() => {
    const source = items;
    const totalValue = source.reduce((sum, item) => sum + (item.status === "active" || item.status === "repair" ? item.purchasePrice ?? 0 : 0), 0);
    return {
      total: source.length || initialSummary?.total || 0,
      active: source.filter((item) => item.status === "active").length || initialSummary?.active || 0,
      wishlist: source.filter((item) => item.status === "wishlist").length || initialSummary?.wishlist || 0,
      totalValue: totalValue || initialSummary?.totalValue || 0,
      warrantyExpiring: source.filter(isWarrantySoon).slice(0, 5),
    };
  }, [initialSummary, items]);

  function handleCreated(item: GearDTO) {
    setItems((prev) => [item, ...prev]);
  }

  function handleUpdated(item: GearDTO) {
    setItems((prev) => prev.map((current) => (current.id === item.id ? item : current)));
    setSelected(item);
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 shadow-[var(--shadow-sm)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">Gear Library</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">我的装备对象库</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            设备型号、购买渠道、保修、价格和状态统一管理，链接读取和手动录入可以混用。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-muted)]">
          <span className="rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2">链接识别</span>
          <span className="rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2">保修提醒</span>
          <span className="rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2">关联记账</span>
        </div>
      </section>

      <GearQuickCapture categories={expenseCategories} onCreated={handleCreated} />

      <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <MetricCard label="装备数量" value={String(summary.total)} hint={`${summary.active} 件在用`} icon={<Package size={14} />} />
        <MetricCard label="估算投入" value={formatMoney(summary.totalValue)} hint="只统计在用与维修中" icon={<CircleDollarSign size={14} />} />
        <MetricCard label="想买清单" value={String(summary.wishlist)} hint="候选设备先放这里" icon={<Search size={14} />} />
        <MetricCard label="保修提醒" value={String(summary.warrantyExpiring.length)} hint="90 天内到期" icon={<ShieldCheck size={14} />} />
      </section>

      {summary.warrantyExpiring.length > 0 ? (
        <section className="rounded-[var(--radius-xl)] border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--warning)]">
            <Wrench size={15} />
            有装备保修临近
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {summary.warrantyExpiring.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelected(item)} className="shrink-0 rounded-xl border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-left text-xs text-[var(--text-secondary)]">
                <span className="block max-w-[220px] truncate text-[var(--text-primary)]">{item.name}</span>
                <span>保修到 {shortDate(item.warrantyUntil)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {statusOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(item.value)}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-xs transition ${
                  status === item.value
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--hairline)] text-[var(--text-muted)] hover:bg-[var(--interactive-hover)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)]">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索型号、品牌、序列号"
              className="min-w-0 bg-transparent outline-none placeholder:text-[var(--text-placeholder)]"
            />
          </label>
        </div>

        {visibleItems.length === 0 ? (
          <div className="quiet-inset rounded-[var(--radius-xl)] px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            还没有匹配的装备。先从一个设备型号开始。
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <GearCard key={item.id} item={item} onSelect={setSelected} />
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <GearDetailSheet
          item={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  );
}
