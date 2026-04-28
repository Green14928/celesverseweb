// 會員中心 - 過往的課程入口整併到會員中心
import { redirect } from "next/navigation";

export default function MyOrdersPage() {
  redirect("/account");
}
