import { existsSync } from 'node:fs';

import type { Browser, BrowserContext, Page } from 'playwright';

type SpxTrackingApiPayload = {
  retcode?: number;
  message?: string;
  data?: {
    current_status?: string;
    tracking_number?: string;
    tracking_list?: Array<{
      code?: number;
      message?: string;
      timestamp?: number;
    }>;
    data?: {
      order_info?: {
        tracking_code_group?: string;
        tracking_code_subgroup_name?: string;
      };
    };
  };
};

export type SpxSyncStatus = 'WAITING_FOR_GOODS' | 'SHIPPING' | 'DONE' | 'UNKNOWN';

export type SpxTrackingLookupResult =
  | {
      ok: true;
      trackingCode: string;
      sourceUrl: string;
      currentStatus: string | null;
      providerGroup: string | null;
      providerSubgroup: string | null;
      internalStatus: SpxSyncStatus;
      delivered: boolean;
      events: Array<{
        message: string | null;
        timestamp: number | null;
      }>;
    }
  | {
      ok: false;
      trackingCode: string;
      sourceUrl: string;
      reason: 'provider_error' | 'timeout' | 'browser_error';
      message: string;
    };

const WINDOWS_BROWSER_PATHS = [
  process.env.SPX_BROWSER_EXECUTABLE,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean) as string[];

function stripVietnamese(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeStatus(value: string | null | undefined) {
  return stripVietnamese(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function mapSpxStatusToOrderStatus(input: {
  currentStatus?: string | null;
  providerGroup?: string | null;
  providerSubgroup?: string | null;
  events?: Array<{ message?: string | null }>;
}): SpxSyncStatus {
  const values = [
    input.currentStatus,
    input.providerGroup,
    input.providerSubgroup,
    ...(input.events ?? []).map((event) => event.message ?? ''),
  ]
    .map((value) => normalizeStatus(value))
    .filter(Boolean);

  if (
    values.some((value) =>
      [
        'delivered',
        'giao thanh cong',
        'da giao',
        'giao hang thanh cong',
        'delivery completed',
        'successfully delivered',
      ].some((keyword) => value.includes(keyword)),
    )
  ) {
    return 'DONE';
  }

  if (
    values.some((value) =>
      [
        'shipping',
        'in transit',
        'dang van chuyen',
        'dang giao',
        'delivering',
        'out for delivery',
        'van chuyen',
      ].some((keyword) => value.includes(keyword)),
    )
  ) {
    return 'SHIPPING';
  }

  if (
    values.some((value) =>
      [
        'pending pickup',
        'pickup',
        'processing',
        'created',
        'ready to ship',
        'cho lay hang',
        'doi lay hang',
        'dang xu ly',
      ].some((keyword) => value.includes(keyword)),
    )
  ) {
    return 'WAITING_FOR_GOODS';
  }

  return 'UNKNOWN';
}

function resolveBrowserExecutablePath() {
  if (process.platform !== 'win32') {
    return process.env.SPX_BROWSER_EXECUTABLE || undefined;
  }

  return WINDOWS_BROWSER_PATHS.find((candidate) => existsSync(candidate));
}

async function launchBrowser() {
  const { chromium } = await import('playwright');
  const executablePath = resolveBrowserExecutablePath();

  try {
    return await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown browser error';
    throw new Error(
      `Cannot launch browser for SPX sync. Set SPX_BROWSER_EXECUTABLE or install a compatible browser. ${details}`,
    );
  }
}

async function extractBodyText(page: Page) {
  try {
    return await page.locator('body').innerText({ timeout: 5_000 });
  } catch {
    return '';
  }
}

function parseTrackingPayload(
  trackingCode: string,
  payload: SpxTrackingApiPayload | null,
  pageText: string,
): SpxTrackingLookupResult {
  const sourceUrl = `https://spx.vn/detail/${encodeURIComponent(trackingCode)}`;

  if (!payload) {
    return {
      ok: false,
      trackingCode,
      sourceUrl,
      reason: 'timeout',
      message: pageText || 'SPX did not return tracking data in time.',
    };
  }

  if (payload.retcode !== 0 || !payload.data) {
    return {
      ok: false,
      trackingCode,
      sourceUrl,
      reason: 'provider_error',
      message: payload.message || pageText || 'SPX returned an unexpected response.',
    };
  }

  const events =
    payload.data.tracking_list?.map((event) => ({
      message: event.message ?? null,
      timestamp: event.timestamp ?? null,
    })) ?? [];

  const providerGroup = payload.data.data?.order_info?.tracking_code_group ?? null;
  const providerSubgroup = payload.data.data?.order_info?.tracking_code_subgroup_name ?? null;
  const currentStatus = payload.data.current_status ?? null;
  const internalStatus = mapSpxStatusToOrderStatus({
    currentStatus,
    providerGroup,
    providerSubgroup,
    events,
  });

  return {
    ok: true,
    trackingCode,
    sourceUrl,
    currentStatus,
    providerGroup,
    providerSubgroup,
    internalStatus,
    delivered: internalStatus === 'DONE',
    events,
  };
}

export async function fetchSpxTracking(
  trackingCode: string,
  browser?: Browser,
  context?: BrowserContext,
): Promise<SpxTrackingLookupResult> {
  const normalizedCode = trackingCode.trim();
  const ownedBrowser = !browser;
  const activeBrowser = browser ?? (await launchBrowser());
  const activeContext = context ?? (await activeBrowser.newContext());
  const page = await activeContext.newPage();
  const sourceUrl = `https://spx.vn/detail/${encodeURIComponent(normalizedCode)}`;

  try {
    const trackingResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes('/api/v2/fleet_order/tracking/search') &&
          response.request().resourceType() === 'xhr',
        { timeout: 20_000 },
      )
      .catch(() => null);

    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => null);

    const trackingResponse = await trackingResponsePromise;
    const payload = trackingResponse
      ? ((await trackingResponse.json().catch(() => null)) as SpxTrackingApiPayload | null)
      : null;
    const pageText = await extractBodyText(page);

    return parseTrackingPayload(normalizedCode, payload, pageText);
  } catch (error) {
    return {
      ok: false,
      trackingCode: normalizedCode,
      sourceUrl,
      reason: 'browser_error' as const,
      message: error instanceof Error ? error.message : 'Unexpected browser error.',
    };
  } finally {
    await page.close().catch(() => null);
    if (!context) {
      await activeContext.close().catch(() => null);
    }
    if (ownedBrowser) {
      await activeBrowser.close().catch(() => null);
    }
  }
}

export async function withSpxBrowser<T>(
  callback: (browser: Browser, context: BrowserContext) => Promise<T>,
) {
  const browser = await launchBrowser();
  const context = await browser.newContext();

  try {
    return await callback(browser, context);
  } finally {
    await context.close().catch(() => null);
    await browser.close().catch(() => null);
  }
}
