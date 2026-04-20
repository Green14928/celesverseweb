// Email 寄信工具 — 使用 Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = (process.env.EMAIL_FROM || "noreply@celesverse.co").trim();
const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();
const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "CELESVERSE 神仙部落").trim();
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.celesverse.co").trim();

// 付款連結
const PAYMENT_LINK = process.env.ECPAY_PAYMENT_LINK || "";

interface OrderEmailData {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  courseName: string;
  categoryName?: string;
  location?: string;
  startDate?: string;
  price: number;
}

function courseInfoRows(loc?: string, startDate?: string) {
  let rows = "";
  if (startDate) {
    rows += `
    <tr>
      <td style="padding: 8px 0; color: #5E7D6F;">上課時間</td>
      <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${startDate}</td>
    </tr>`;
  }
  if (loc) {
    rows += `
    <tr>
      <td style="padding: 8px 0; color: #5E7D6F;">上課地點</td>
      <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${loc}</td>
    </tr>`;
  }
  return rows;
}

/** 報名通知信 — 含付款連結 */
export async function sendRegistrationEmail(data: OrderEmailData) {
  const paymentUrl = PAYMENT_LINK || `${siteUrl}/orders/${data.orderId}/confirmation`;
  const categoryText = data.categoryName ? `${data.categoryName}課程` : "課程";

  const result = await resend.emails.send({
    from: `${siteName} <${from}>`,
    replyTo: replyTo || undefined,
    to: data.buyerEmail,
    subject: `【${siteName}】神仙部落付款連結 — ${data.courseName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
        <img src="${siteUrl}/images/logo-horizontal.png" alt="${siteName}" style="height: 36px; margin-bottom: 24px;" />
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">神仙部落付款連結</h1>
        <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
          ${data.buyerName} 您好，感謝您報名${categoryText}，以下是您的訂單資訊。
        </p>

        <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">訂單編號</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #1B4A3A;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">付款狀態</td>
              <td style="padding: 8px 0; text-align: right; color: #D97706; font-weight: 500;">待付款</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">姓名</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${data.buyerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">Email</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${data.buyerEmail}</td>
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
                    <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${data.courseName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${courseInfoRows(data.location, data.startDate)}
            <tr>
              <td colspan="2" style="padding: 8px 0;">
                <div style="border-top: 1px solid #E2EBE8;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F; font-size: 16px;">總計</td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #1B4A3A;">NT$ ${data.price.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 16px;">
            請於 <strong style="color: #1B4A3A;">24 小時內</strong> 完成付款，逾期將自動取消訂單。
          </p>
          <a href="${paymentUrl}" style="display: inline-block; background: #1B4A3A; color: #FAF8F3; padding: 14px 40px; text-decoration: none; font-size: 14px; letter-spacing: 0.1em;">
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
    `,
  });
  console.log("Resend API 回應:", JSON.stringify(result));
  return result;
}

/** 付款確認信 — 確認已收款 */
export async function sendPaymentConfirmedEmail(data: OrderEmailData) {
  const categoryText = data.categoryName ? `${data.categoryName}課程` : "課程";

  await resend.emails.send({
    from: `${siteName} <${from}>`,
    replyTo: replyTo || undefined,
    to: data.buyerEmail,
    subject: `【${siteName}】付款確認 — ${data.courseName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
        <img src="${siteUrl}/images/logo-horizontal.png" alt="${siteName}" style="height: 36px; margin-bottom: 24px;" />
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">付款已確認</h1>
        <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
          ${data.buyerName} 您好，我們已收到您的${categoryText}付款，您的報名已正式完成！
        </p>

        <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">訂單編號</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px; color: #1B4A3A;">${data.orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">付款狀態</td>
              <td style="padding: 8px 0; text-align: right; color: #10B981; font-weight: 500;">已付款 ✓</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">姓名</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${data.buyerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">Email</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${data.buyerEmail}</td>
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
                    <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${data.courseName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${courseInfoRows(data.location, data.startDate)}
            <tr>
              <td colspan="2" style="padding: 8px 0;">
                <div style="border-top: 1px solid #E2EBE8;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F; font-size: 16px;">付款金額</td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #1B4A3A;">NT$ ${data.price.toLocaleString()}</td>
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
    `,
  });
}

/** 退費完成通知信 */
interface RefundEmailData {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  courseName: string;
  amount: number;
  invoiceVoided: boolean;
  invoiceNumber?: string;
  note?: string;
}

export async function sendRefundCompletedEmail(data: RefundEmailData) {
  const result = await resend.emails.send({
    from: `${siteName} <${from}>`,
    replyTo: replyTo || undefined,
    to: data.buyerEmail,
    subject: `【${siteName}】退費完成通知 — ${data.orderNumber}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
        <img src="${siteUrl}/images/logo-horizontal.png" alt="${siteName}" style="height: 36px; margin-bottom: 24px;" />
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">退費完成通知</h1>
        <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
          ${data.buyerName} 您好，您的退費流程已全部完成，詳情如下。
        </p>

        <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">訂單編號</td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 13px; color: #1B4A3A;">${data.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">原課程</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">${data.courseName}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px 0;">
                <div style="border-top: 1px solid #E2EBE8;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F; font-size: 15px;">退費金額</td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: 600; color: #1B4A3A;">NT$ ${data.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">刷退狀態</td>
              <td style="padding: 8px 0; text-align: right; color: #10B981; font-weight: 500;">已完成 ✓</td>
            </tr>
            ${
              data.invoiceVoided
                ? `
            <tr>
              <td style="padding: 8px 0; color: #5E7D6F;">發票</td>
              <td style="padding: 8px 0; text-align: right; color: #1B4A3A;">
                已作廢${data.invoiceNumber ? `<div style="font-family: monospace; font-size: 12px; color: #5E7D6F; margin-top: 2px;">${data.invoiceNumber}</div>` : ""}
              </td>
            </tr>`
                : ""
            }
            ${
              data.note
                ? `
            <tr>
              <td colspan="2" style="padding: 8px 0;">
                <div style="border-top: 1px solid #E2EBE8;"></div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px 0;">
                <div style="color: #5E7D6F; font-size: 13px; margin-bottom: 4px;">備註</div>
                <div style="color: #1B4A3A; font-size: 14px; line-height: 1.6;">${data.note.replace(/\n/g, "<br/>")}</div>
              </td>
            </tr>`
                : ""
            }
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #5E7D6F; font-size: 13px; line-height: 1.6;">
            退費金額將依您的信用卡發卡行作業時間入帳，<br />
            一般約 7～14 個工作天，請您留意信用卡帳單。<br />
            如有任何疑問，歡迎直接回覆此信與我們聯絡。
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #E2EBE8; margin: 24px 0;" />
        <div style="text-align: center;">
          <p style="color: #1B4A3A; font-size: 13px; letter-spacing: 0.3em; font-weight: 500;">
            CELESVERSE
          </p>
        </div>
      </div>
    `,
  });
  console.log("[sendRefundCompletedEmail]", JSON.stringify(result));
  return result;
}

/** 課程延期通知信 */
interface PostponeEmailData {
  buyerName: string;
  buyerEmail: string;
  courseName: string;
  categoryName?: string;
  location?: string;
  originalDate: string;
  newDate: string;
  note?: string;
}

export async function sendPostponeEmail(data: PostponeEmailData) {
  const categoryText = data.categoryName ? `${data.categoryName}課程` : "課程";

  await resend.emails.send({
    from: `${siteName} <${from}>`,
    replyTo: replyTo || undefined,
    to: data.buyerEmail,
    subject: `【${siteName}】課程延期通知 — ${data.courseName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B4A3A; background: #FAF8F3;">
        <img src="${siteUrl}/images/logo-horizontal.png" alt="${siteName}" style="height: 36px; margin-bottom: 24px;" />
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #1B4A3A;">課程延期通知</h1>
        <p style="color: #5E7D6F; font-size: 14px; margin-bottom: 32px;">
          ${data.buyerName} 您好，您報名的${categoryText}日期有所調整，請留意以下更新資訊。
        </p>

        <div style="background: #EFF4F2; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2EBE8;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td colspan="2" style="padding: 8px 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #5E7D6F; font-size: 14px;">報名課程</td>
                    <td style="text-align: right; color: #1B4A3A; font-size: 14px;">${data.courseName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${courseInfoRows(data.location)}
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
                    <td style="text-align: right; color: #1B4A3A; font-size: 14px; text-decoration: line-through;">${data.originalDate}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 8px 4px; background: #10B981; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #ffffff; font-size: 14px; font-weight: 700;">調整後日期</td>
                    <td style="text-align: right; color: #ffffff; font-size: 15px; font-weight: 700;">${data.newDate}</td>
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
    `,
  });
}
