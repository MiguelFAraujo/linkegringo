export interface ChromeVersionResponse {
  Browser: string;
  'Protocol-Version': string;
  'User-Agent': string;
  'V8-Version': string;
  'WebKit-Version': string;
  webSocketDebuggerUrl?: string;
}

export interface ChromeTabInfo {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
  webSocketDebuggerUrl?: string;
  devtoolsFrontendUrl?: string;
}

export interface CdpStatus {
  isRunning: boolean;
  port: number;
  host: string;
  browser?: string;
  protocolVersion?: string;
  activeTabs: Array<{
    id: string;
    title: string;
    url: string;
    webSocketDebuggerUrl?: string;
  }>;
  linkeGringoTabFound: boolean;
  linkeGringoTabUrl?: string;
  error?: string;
}
