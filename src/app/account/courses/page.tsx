// 會員中心 - 我的課程已整併到會員中心主頁
import { redirect } from "next/navigation";

export default function MyCoursesPage() {
  redirect("/account");
}
