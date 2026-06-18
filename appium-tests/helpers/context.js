async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function switchToWebView(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const contexts = await driver.getContexts();
    const webview = contexts.find((ctx) => String(ctx).includes('WEBVIEW'));
    if (webview) {
      await driver.switchContext(webview);
      try {
        const handles = await browser.getWindowHandles();
        if (handles && handles.length > 0) {
          // Switch to the latest window handle to ensure we interact with active WebView page
          await browser.switchToWindow(handles[handles.length - 1]);
        }
      } catch (err) {
        console.warn('[Context] Failed to select window handle:', err.message);
      }
      return webview;
    }
    await sleep(500);
  }
  throw new Error('WEBVIEW context not available');
}

async function switchToNative() {
  const contexts = await driver.getContexts();
  const native = contexts.find((ctx) => String(ctx).includes('NATIVE'));
  if (native) await driver.switchContext(native);
}

module.exports = { sleep, switchToWebView, switchToNative };
