import { getSitePopupStore } from "@/features/admin/actions/site-content.action";
import { SitePopupForm } from "@/features/admin/components/SitePopupForm";

export default async function PopupSettingsPage() {
  const settings = await getSitePopupStore();

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>內容</span>
          <span className="sep">/</span>
          <span className="here">彈跳視窗設定</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">彈跳視窗設定</h1>
          <div className="page-sub">Site Popup</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-left">
            <h3 className="panel-title">前台進站提示</h3>
            <span className="panel-en">ONE ACTIVE · MAX 10</span>
          </div>
        </div>
        <SitePopupForm initial={settings} />
      </div>
    </>
  );
}
