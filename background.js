chrome.runtime.onInstalled.addListener(function() {
    const menu = chrome.contextMenus.create({
        type: "normal",
        id: "fd0cb59b8ef1",
        title: "View EXIF",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "fd0cb59b8ef1") {
        let sndMsgPromise = chrome.tabs.sendMessage(tab.id, { action: "fd0cb59b8ef1", url: info.srcUrl });
    }
});

