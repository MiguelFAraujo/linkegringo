import type { CdpStatus, ChromeTabInfo, ChromeVersionResponse } from './types.js';

export async function checkChromeCdp(
  port = 9222,
  host = '127.0.0.1',
  timeoutMs = 2000
): Promise<CdpStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const versionRes = await fetch(`http://${host}:${port}/json/version`, {
      signal: controller.signal,
    });

    if (!versionRes.ok) {
      throw new Error(`HTTP ${versionRes.status}: ${versionRes.statusText}`);
    }

    const versionData = (await versionRes.json()) as ChromeVersionResponse;

    let pageTabs: ChromeTabInfo[] = [];
    try {
      const listRes = await fetch(`http://${host}:${port}/json/list`, {
        signal: controller.signal,
      });
      if (listRes.ok) {
        const rawTabs = (await listRes.json()) as ChromeTabInfo[];
        if (Array.isArray(rawTabs)) {
          pageTabs = rawTabs.filter((t) => t.type === 'page');
        }
      }
    } catch {
      // Ignora erro em /json/list se /json/version respondeu
    }

    const linkeGringoTab = pageTabs.find((t) => {
      const lowerUrl = (t.url || '').toLowerCase();
      return (
        lowerUrl.includes('linkegringo') ||
        lowerUrl.includes('5173') ||
        lowerUrl.includes('muriel-gasparini.github.io')
      );
    });

    return {
      isRunning: true,
      port,
      host,
      browser: versionData.Browser,
      protocolVersion: versionData['Protocol-Version'],
      activeTabs: pageTabs.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        webSocketDebuggerUrl: t.webSocketDebuggerUrl,
      })),
      linkeGringoTabFound: Boolean(linkeGringoTab),
      linkeGringoTabUrl: linkeGringoTab?.url,
    };
  } catch (err: unknown) {
    const error = err as Error;
    const isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError';
    return {
      isRunning: false,
      port,
      host,
      activeTabs: [],
      linkeGringoTabFound: false,
      error: isTimeout
        ? 'Conexão expirou (Chrome não respondeu em 2s na porta ' + port + ')'
        : 'Porta fechada ou depuração remota desativada. Acesse chrome://inspect/#remote-debugging para ativar.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
