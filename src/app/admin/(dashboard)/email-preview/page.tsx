// Email 預覽頁 — 即時查看確認信樣式
export default function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return <EmailPreviewContent searchParamsPromise={searchParams} />;
}

async function EmailPreviewContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ type?: string }>;
}) {
  const { type = "registration" } = await searchParamsPromise;

  const sampleData = {
    orderId: "58262026041293",
    buyerName: "王小明",
    buyerEmail: "dasmn928@gmail.com",
    courseName: "靈氣 Reiki 一階工作坊",
    categoryName: "靈氣療癒",
    location: "台北市大安區復興南路一段 390 號",
    price: "6,800",
  };

  const registrationHtml = `
    <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
      <img src="/images/logo-horizontal.png" alt="CELESVERSE" style="height: 36px; margin-bottom: 24px;" />
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">神仙部落付款連結</h1>
      <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
        ${sampleData.buyerName} 您好，感謝您報名${sampleData.categoryName}課程，以下是您的訂單資訊。
      </p>

      <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">訂單編號</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #1B4A3A;">${sampleData.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">付款狀態</td>
            <td style="padding: 8px 0; text-align: right; color: #D97706; font-weight: 500;">待付款</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">姓名</td>
            <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${sampleData.buyerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">Email</td>
            <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${sampleData.buyerEmail}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0;">
              <div style="border-top: 1px solid #E2EBE8;"></div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 4px; background: rgba(27,74,58,0.12); border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #5E7D6F; font-size: 14px;">報名課程</td>
                  <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${sampleData.courseName}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課時間</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">2026/6/15</td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課地點</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">${sampleData.location}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0;">
              <div style="border-top: 1px solid #E2EBE8;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F; font-size: 16px;">總計</td>
            <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #1B4A3A;">NT$ ${sampleData.price}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 16px;">
          請於 <strong style="color: #1B4A3A;">24 小時內</strong> 完成付款，逾期將自動取消訂單。
        </p>
        <a href="#" style="display: inline-block; background: #1B4A3A; color: #FAF8F3; padding: 14px 40px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em;">
          前往付款
        </a>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #5E7D6F; font-size: 12px;">
          付款前請確認訂單編號與姓名正確無誤
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #E2EBE8; margin: 24px 0;" />
      <div style="text-align: center;">
        <p style="color: #5E7D6F; font-size: 12px; margin-bottom: 12px;">
          如有疑問請聯絡我們。
        </p>
        <p style="color: #1B4A3A; font-size: 13px; letter-spacing: 0.3em; font-weight: 500;">
          CELESVERSE
        </p>
      </div>
    </div>
  `;

  const paymentHtml = `
    <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
      <img src="/images/logo-horizontal.png" alt="CELESVERSE" style="height: 36px; margin-bottom: 24px;" />
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">付款已確認</h1>
      <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
        ${sampleData.buyerName} 您好，我們已收到您的${sampleData.categoryName}課程付款，您的報名已正式完成！
      </p>

      <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">訂單編號</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #1B4A3A;">${sampleData.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">付款狀態</td>
            <td style="padding: 8px 0; text-align: right; color: #10B981; font-weight: 500;">已付款 ✓</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">姓名</td>
            <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${sampleData.buyerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F;">Email</td>
            <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${sampleData.buyerEmail}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0;">
              <div style="border-top: 1px solid #E2EBE8;"></div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 4px; background: rgba(27,74,58,0.12); border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #5E7D6F; font-size: 14px;">報名課程</td>
                  <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${sampleData.courseName}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課時間</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">2026/6/15</td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課地點</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">${sampleData.location}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0;">
              <div style="border-top: 1px solid #E2EBE8;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5E7D6F; font-size: 16px;">付款金額</td>
            <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #1B4A3A;">NT$ ${sampleData.price}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #5E7D6F; font-size: 14px;">
          期待在課程中與您相見！
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #E2EBE8; margin: 24px 0;" />
      <div style="text-align: center;">
        <p style="color: #5E7D6F; font-size: 12px; margin-bottom: 12px;">
          如有疑問請聯絡我們。
        </p>
        <p style="color: #1B4A3A; font-size: 13px; letter-spacing: 0.3em; font-weight: 500;">
          CELESVERSE
        </p>
      </div>
    </div>
  `;

  const postponeHtml = `
    <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
      <img src="/images/logo-horizontal.png" alt="CELESVERSE" style="height: 36px; margin-bottom: 24px;" />
      <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">課程延期通知</h1>
      <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
        ${sampleData.buyerName} 您好，您報名的${sampleData.categoryName}課程日期有所調整，請留意以下更新資訊。
      </p>

      <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td colspan="2" style="padding: 8px 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #5E7D6F; font-size: 14px;">報名課程</td>
                  <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${sampleData.courseName}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課時間</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">2026/6/15</td>
          </tr>
          <tr>
            <td style="padding: 8px 4px; color: #5E7D6F;">上課地點</td>
            <td style="padding: 8px 4px; text-align: right; color: #1B4A3A;">${sampleData.location}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0;">
              <div style="border-top: 1px solid #E2EBE8;"></div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #5E7D6F; font-size: 14px;">原定日期</td>
                  <td style="text-align: right; color: #1B4A3A; font-size: 14px; text-decoration: line-through;">2026/7/1</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 4px; background: #10B981; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #ffffff; font-size: 14px; font-weight: 700;">調整後日期</td>
                  <td style="text-align: right; color: #ffffff; font-size: 15px; font-weight: 700;">2026/8/15</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #5E7D6F; font-size: 14px;">
          造成不便，敬請見諒。<br />如需取消報名或有其他疑問，歡迎聯繫我們。
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #E2EBE8; margin: 24px 0;" />
      <div style="text-align: center;">
        <p style="color: #5E7D6F; font-size: 12px; margin-bottom: 12px;">
          如有疑問請聯絡我們。
        </p>
        <p style="color: #1B4A3A; font-size: 13px; letter-spacing: 0.3em; font-weight: 500;">
          CELESVERSE
        </p>
      </div>
    </div>
  `;

  const currentType = type;

  return (
    <>
      <div className="top-rail">
        <div className="crumb">
          <span>工具</span>
          <span className="sep">/</span>
          <span className="here">Email 預覽</span>
        </div>
      </div>

      <div className="page-head">
        <div>
          <h1 className="page-title">Email 預覽</h1>
          <div className="page-sub">Email Templates</div>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginBottom: 20 }}>
        修改{" "}
        <code
          style={{
            background: "var(--admin-bg-warm)",
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: 11,
          }}
        >
          src/lib/email.ts
        </code>{" "}
        後重新整理即可預覽
      </p>

      <div className="filter-pills" style={{ marginBottom: 20 }}>
        <a
          href="/admin/email-preview?type=registration"
          className={currentType === "registration" || !currentType ? "on" : ""}
        >
          報名確認信
        </a>
        <a
          href="/admin/email-preview?type=payment"
          className={currentType === "payment" ? "on" : ""}
        >
          付款確認信
        </a>
        <a
          href="/admin/email-preview?type=postpone"
          className={currentType === "postpone" ? "on" : ""}
        >
          延期通知信
        </a>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2 className="panel-title">
              {currentType === "postpone"
                ? "延期通知信"
                : currentType === "payment"
                  ? "付款確認信"
                  : "報名確認信"}
            </h2>
            <div className="panel-en">PREVIEW</div>
          </div>
        </div>
        <div
          className="panel-body"
          style={{ padding: 0 }}
          dangerouslySetInnerHTML={{
            __html:
              currentType === "postpone"
                ? postponeHtml
                : currentType === "payment"
                  ? paymentHtml
                  : registrationHtml,
          }}
        />
      </div>
    </>
  );
}
