"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { randomUUID } from "crypto";

async function requireAdmin() {
  const adminId = await getSession();
  if (!adminId) redirect("/admin/login");
  return adminId;
}

export async function saveCalendarLegend(
  items: Array<{ key: string; label: string; color: string }>
): Promise<{ success: boolean }> {
  await requireAdmin();

  try {
    await prisma.siteContent.upsert({
      where: { key: "calendar_legend" },
      update: { value: JSON.stringify(items) },
      create: { key: "calendar_legend", value: JSON.stringify(items) },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getCalendarLegend(): Promise<
  Array<{ key: string; label: string; color: string }> | null
> {
  const record = await prisma.siteContent.findUnique({
    where: { key: "calendar_legend" },
  });
  if (!record) return null;
  try {
    return JSON.parse(record.value);
  } catch {
    return null;
  }
}

export type SitePopupSettings = {
  enabled: boolean;
  title: string;
  body: string;
  qrImageUrl: string | null;
  lineUrl: string | null;
  updatedAt?: string;
};

export type SitePopupItem = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
};

export type SitePopupStore = {
  activeId: string | null;
  items: SitePopupItem[];
  updatedAt?: string;
};

const DEFAULT_POPUP_SETTINGS: SitePopupSettings = {
  enabled: false,
  title: "",
  body: "",
  qrImageUrl: null,
  lineUrl: null,
};

const DEFAULT_POPUP_STORE: SitePopupStore = {
  activeId: null,
  items: [],
};

function popupItemToSettings(
  item: SitePopupItem | null,
  updatedAt?: string,
): SitePopupSettings {
  if (!item) return { ...DEFAULT_POPUP_SETTINGS, updatedAt };
  return {
    enabled: true,
    title: item.title,
    body: item.body,
    qrImageUrl: item.imageUrl,
    lineUrl: item.linkUrl,
    updatedAt,
  };
}

function normalizePopupStore(value: unknown, updatedAt?: string): SitePopupStore {
  if (!value || typeof value !== "object") return { ...DEFAULT_POPUP_STORE, updatedAt };

  const record = value as {
    activeId?: unknown;
    items?: unknown;
    enabled?: unknown;
    title?: unknown;
    body?: unknown;
    qrImageUrl?: unknown;
    lineUrl?: unknown;
  };

  if (Array.isArray(record.items)) {
    const items = record.items
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Partial<SitePopupItem>;
        return {
          id: typeof raw.id === "string" && raw.id ? raw.id : randomUUID(),
          title: typeof raw.title === "string" ? raw.title : "",
          body: typeof raw.body === "string" ? raw.body : "",
          imageUrl: typeof raw.imageUrl === "string" && raw.imageUrl ? raw.imageUrl : null,
          linkUrl: typeof raw.linkUrl === "string" && raw.linkUrl ? raw.linkUrl : null,
        };
      })
      .filter((item): item is SitePopupItem => Boolean(item))
      .slice(0, 10);
    const activeId =
      typeof record.activeId === "string" &&
      items.some((item) => item.id === record.activeId)
        ? record.activeId
        : null;
    return { activeId, items, updatedAt };
  }

  const legacyItem: SitePopupItem = {
    id: randomUUID(),
    title: typeof record.title === "string" ? record.title : "",
    body: typeof record.body === "string" ? record.body : "",
    imageUrl:
      typeof record.qrImageUrl === "string" && record.qrImageUrl
        ? record.qrImageUrl
        : null,
    linkUrl:
      typeof record.lineUrl === "string" && record.lineUrl
        ? record.lineUrl
        : null,
  };
  const hasContent = legacyItem.title || legacyItem.body || legacyItem.imageUrl;
  return {
    activeId: record.enabled && hasContent ? legacyItem.id : null,
    items: hasContent ? [legacyItem] : [],
    updatedAt,
  };
}

export async function getSitePopupSettings(): Promise<SitePopupSettings> {
  noStore();

  const store = await getSitePopupStore();
  const activeItem = store.items.find((item) => item.id === store.activeId) ?? null;
  return popupItemToSettings(activeItem, store.updatedAt);
}

export async function getSitePopupStore(): Promise<SitePopupStore> {
  noStore();

  const record = await prisma.siteContent.findUnique({
    where: { key: "site_popup" },
    select: { value: true, updatedAt: true },
  });
  if (!record) return DEFAULT_POPUP_STORE;

  try {
    return normalizePopupStore(JSON.parse(record.value), record.updatedAt.toISOString());
  } catch {
    return DEFAULT_POPUP_STORE;
  }
}

export async function saveSitePopupStore(
  store: SitePopupStore,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const items = store.items
    .slice(0, 10)
    .map((item) => ({
      id: item.id || randomUUID(),
      title: item.title.trim(),
      body: item.body.trim(),
      imageUrl: item.imageUrl?.trim() || null,
      linkUrl: item.linkUrl?.trim() || null,
    }))
    .filter((item) => item.title || item.body || item.imageUrl);

  if (items.length > 10) {
    return { success: false, error: "彈跳視窗最多只能保存 10 筆" };
  }

  const activeId =
    store.activeId && items.some((item) => item.id === store.activeId)
      ? store.activeId
      : null;

  if (store.activeId && !activeId) {
    return { success: false, error: "啟用的彈跳視窗內容不可為空" };
  }

  const payload: SitePopupStore = { activeId, items };

  await prisma.siteContent.upsert({
    where: { key: "site_popup" },
    update: { value: JSON.stringify(payload) },
    create: { key: "site_popup", value: JSON.stringify(payload) },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
