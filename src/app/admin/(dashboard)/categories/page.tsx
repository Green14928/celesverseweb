import { getCategories } from "@/features/admin/actions/category.action";
import { CategoryManager } from "@/features/admin/components/CategoryManager";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">分類管理</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">分類管理</h1>
          <div className="page-sub">Categories</div>
        </div>
      </div>

      <div style={{ maxWidth: 720 }}>
        <CategoryManager initialCategories={categories} />
      </div>
    </>
  );
}
