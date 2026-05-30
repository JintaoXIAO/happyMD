export default defineBackground(() => {
  const action = browser.action || (browser as any).browserAction;
  action.onClicked.addListener(() => {
    browser.tabs.create({
      url: browser.runtime.getURL('/editor.html'),
    });
  });
});
