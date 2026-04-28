"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImage } from "@/lib/upload";
import {
  saveSitePopupStore,
  type SitePopupItem,
  type SitePopupStore,
} from "@/features/admin/actions/site-content.action";

function createPopupItem(): SitePopupItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    imageUrl: null,
    linkUrl: null,
  };
}

export function SitePopupForm({ initial }: { initial: SitePopupStore }) {
  const [items, setItems] = useState<SitePopupItem[]>(
    initial.items.length > 0 ? initial.items : [createPopupItem()],
  );
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);
  const [editingId, setEditingId] = useState(items[0]?.id ?? "");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const editingItem = items.find((item) => item.id === editingId) ?? items[0];

  function updateItem(id: string, patch: Partial<SitePopupItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    if (items.length >= 10) {
      setError("最多只能保存 10 筆彈跳視窗");
      return;
    }
    const next = createPopupItem();
    setItems((current) => [...current, next]);
    setEditingId(next.id);
    setError(null);
    setMessage(null);
  }

  function removeItem(id: string) {
    if (!confirm("確定刪除這筆彈跳視窗？")) return;
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      if (editingId === id) setEditingId(next[0]?.id ?? "");
      if (activeId === id) setActiveId(null);
      return next.length > 0 ? next : [createPopupItem()];
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setUploadingId(editingItem.id);
    setError(null);
    try {
      const url = await uploadImage(file);
      updateItem(editingItem.id, { imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "圖片上傳失敗");
    } finally {
      setUploadingId(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await saveSitePopupStore({
        activeId,
        items,
      });
      if (result.success) {
        setMessage("已儲存彈跳視窗設定");
      } else {
        setError(result.error ?? "儲存失敗");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel-body" style={{ display: "grid", gap: 22 }}>
      {message && (
        <div style={{ padding: 12, borderRadius: 6, background: "var(--admin-green-light)", color: "var(--admin-green)", fontSize: 13 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: 12, borderRadius: 6, background: "var(--admin-red-light)", color: "var(--admin-red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="popup-settings-grid">
        <div className="popup-settings-list" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div className="caption">彈跳視窗清單</div>
              <p style={{ marginTop: 4, fontSize: 11, color: "var(--admin-text-muted)" }}>
                {items.length}/10 筆，每次只能啟用一筆
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={addItem}>
              新增
            </button>
          </div>

          {items.map((item, index) => {
            const isEditing = item.id === editingId;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setEditingId(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: `1px solid ${isEditing ? "var(--admin-accent)" : "var(--admin-border)"}`,
                  background: isEditing ? "var(--admin-accent-light)" : "var(--admin-bg-card)",
                  borderRadius: 6,
                  padding: 10,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "var(--admin-text)", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title || `未命名 ${index + 1}`}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: 10, color: "var(--admin-green)", flexShrink: 0 }}>
                      啟用中
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--admin-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.body || item.linkUrl || "尚未填寫內容"}
                </div>
              </button>
            );
          })}
        </div>

        {editingItem && (
          <div className="popup-settings-editor" style={{ display: "grid", gap: 22 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={activeId === editingItem.id ? "btn btn-accent" : "btn"}
                onClick={() => setActiveId(activeId === editingItem.id ? null : editingItem.id)}
              >
                {activeId === editingItem.id ? "目前啟用中" : "設為啟用"}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeItem(editingItem.id)}
              >
                刪除這筆
              </button>
            </div>

            <div>
              <label className="caption">活動標題</label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => updateItem(editingItem.id, { title: e.target.value })}
                placeholder="例：春季課程開放報名"
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>

            <div>
              <label className="caption">活動內容</label>
              <textarea
                value={editingItem.body}
                onChange={(e) => updateItem(editingItem.id, { body: e.target.value })}
                placeholder="輸入想讓訪客一進站就看到的活動資訊"
                rows={7}
                style={{ width: "100%", marginTop: 8, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label className="caption">圖片</label>
              {editingItem.imageUrl ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editingItem.imageUrl}
                    alt="彈跳視窗圖片"
                    style={{ width: 180, height: 140, objectFit: "cover", border: "1px solid var(--admin-border)", borderRadius: 6, background: "#fff" }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => updateItem(editingItem.id, { imageUrl: null })}
                  >
                    移除圖片
                  </button>
                </div>
              ) : (
                <div style={{ width: 180, height: 140, display: "grid", placeItems: "center", border: "2px dashed var(--admin-border)", borderRadius: 6, color: "var(--admin-text-muted)", fontSize: 12 }}>
                  尚未上傳
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                disabled={uploadingId === editingItem.id}
                style={{ fontSize: 12, color: "var(--admin-text-muted)" }}
              />
              {uploadingId === editingItem.id && (
                <p style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                  圖片上傳中...
                </p>
              )}
            </div>

            <div>
              <label className="caption">按鈕連結（選填）</label>
              <input
                type="url"
                value={editingItem.linkUrl ?? ""}
                onChange={(e) => updateItem(editingItem.id, { linkUrl: e.target.value })}
                placeholder="例：https://example.com/campaign"
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="submit"
          disabled={isPending || Boolean(uploadingId)}
          className="btn btn-primary"
        >
          {isPending ? "儲存中..." : "儲存全部設定"}
        </button>
      </div>
    </form>
  );
}
