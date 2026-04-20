"use client";

import { useState } from "react";
import {
  saveCategory,
  deleteCategory,
} from "@/features/admin/actions/category.action";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    const maxOrder = categories.reduce(
      (max, c) => Math.max(max, c.sortOrder),
      -1
    );
    const result = await saveCategory({
      name: newName.trim(),
      sortOrder: maxOrder + 1,
    });
    if (result.success) {
      setNewName("");
      window.location.reload();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditOrder(cat.sortOrder);
    setError("");
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    setLoading(true);
    setError("");
    const result = await saveCategory(
      { name: editName.trim(), sortOrder: editOrder },
      editingId
    );
    if (result.success) {
      setEditingId(null);
      window.location.reload();
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定要刪除分類「${name}」嗎？使用此分類的課程會變成無分類。`))
      return;
    setLoading(true);
    await deleteCategory(id);
    setCategories(categories.filter((c) => c.id !== id));
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            background: "var(--admin-red-light)",
            color: "var(--admin-red)",
            fontSize: 13,
            border: "1px solid rgba(192, 86, 75, 0.25)",
          }}
        >
          {error}
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">新增分類</h2>
            <div className="panel-en">NEW CATEGORY</div>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新分類名稱"
              style={{ flex: 1 }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="btn btn-primary"
            >
              新增
            </button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">現有分類</h2>
            <div className="panel-en">LIST</div>
          </div>
          <div className="filter-count">
            共 <span className="num">{categories.length}</span> 項
          </div>
        </div>

        {categories.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p className="muted">尚無分類</p>
          </div>
        ) : (
          <div className="panel-body" style={{ padding: 0 }}>
            {categories.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 22px",
                  borderTop:
                    i === 0 ? "none" : "1px solid var(--admin-border)",
                }}
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      value={editOrder}
                      onChange={(e) => setEditOrder(Number(e.target.value))}
                      style={{ width: 80 }}
                      placeholder="排序"
                    />
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading}
                      className="op-btn"
                    >
                      儲存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="op-btn"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>
                      {cat.name}
                    </span>
                    <span
                      className="muted"
                      style={{
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      排序 {cat.sortOrder}
                    </span>
                    <button
                      onClick={() => startEdit(cat)}
                      className="op-btn"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={loading}
                      className="op-btn danger"
                    >
                      刪除
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
