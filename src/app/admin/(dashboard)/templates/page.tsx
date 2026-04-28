// 課程管理（模板列表）
import Link from "next/link";
import { getTemplates } from "@/features/admin/actions/course-template.action";
import { DeleteTemplateButton } from "@/features/admin/components/DeleteTemplateButton";
import { ArchiveTemplateButton } from "@/features/admin/components/ArchiveTemplateButton";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "active" } = await searchParams;
  const allTemplates = await getTemplates();

  const templates =
    view === "archived"
      ? allTemplates.filter((t) => t.isArchived)
      : allTemplates.filter((t) => !t.isArchived);

  const activeCount = allTemplates.filter((t) => !t.isArchived).length;
  const archivedCount = allTemplates.filter((t) => t.isArchived).length;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">課程管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">課程管理</h1>
          <div className="page-sub">Course Templates</div>
        </div>
        <div className="page-actions">
          <Link href="/admin/categories" className="btn">
            分類管理
          </Link>
          <Link href="/admin/templates/new" className="btn btn-primary">
            + 新增課程
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="filter-row">
          <div className="filter-pills">
            <Link
              href="/admin/templates?view=active"
              className={view === "active" ? "on" : ""}
            >
              使用中（{activeCount}）
            </Link>
            <Link
              href="/admin/templates?view=archived"
              className={view === "archived" ? "on" : ""}
            >
              已封存（{archivedCount}）
            </Link>
          </div>
          <div className="filter-spacer" />
          <div className="filter-count">
            共 <span className="num">{templates.length}</span> 門
          </div>
        </div>

        {templates.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p className="muted">
              {view === "archived" ? "沒有已封存的課程" : "尚無課程模板"}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 72 }}>圖片</th>
                <th>課程名稱</th>
                <th>分類</th>
                <th style={{ width: 100 }}>排程數</th>
                <th style={{ width: 240 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr key={tmpl.id}>
                  <td>
                    {tmpl.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tmpl.images[0].url}
                        alt={tmpl.title}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          background: "var(--admin-bg-warm)",
                          color: "var(--admin-text-muted)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 10,
                          letterSpacing: 1,
                        }}
                      >
                        無圖
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tmpl.title}</div>
                    <div
                      className="muted"
                      style={{
                        fontSize: 11,
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 520,
                      }}
                    >
                      {tmpl.description}
                    </div>
                  </td>
                  <td>
                    {tmpl.category?.name ? (
                      <span className="tag tag-neutral">{tmpl.category.name}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className="serif-num" style={{ fontSize: 14 }}>
                      {tmpl._count.courses}
                    </span>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 3 }}>
                      門
                    </span>
                  </td>
                  <td>
                    <div className="ops">
                      <Link
                        href={`/admin/templates/${tmpl.id}/edit`}
                        className="op-btn"
                      >
                        編輯
                      </Link>
                      <ArchiveTemplateButton
                        templateId={tmpl.id}
                        isArchived={tmpl.isArchived}
                      />
                      <DeleteTemplateButton
                        templateId={tmpl.id}
                        templateName={tmpl.title}
                        courseCount={tmpl._count.courses}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
