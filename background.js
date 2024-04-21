let abnormalRequests = []

function updateBadgeText(nowTabId) {
  const tabRequests = abnormalRequests.filter(request => request.tabId === nowTabId)
  chrome.action.setBadgeText({ text: tabRequests.length.toString() })
}

function addServerList(server) {
  chrome.storage.local.get(['textareaServerList'], function (result) {
    let textareaServerList = result['textareaServerList'] || ''
    textareaServerList = `${server}\n${textareaServerList}`
    // 更新
    chrome.storage.local.set({ textareaServerList }, function () { })
  })
}

function handleErrorRequest(details) {
  const { tabId, url, error, fromCache } = details
  if (error && !fromCache) {
    let hostname = new URL(url).hostname
    let include = abnormalRequests.some(iii => iii.hostname === hostname && iii.tabId === tabId)
    if (!include) {
      abnormalRequests.push({ tabId, hostname, error })
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        updateBadgeText(tabs[0].id)
      })
      addServerList(hostname)
    }
  }
}

chrome.webRequest.onErrorOccurred.addListener(handleErrorRequest, { urls: ["<all_urls>"] })

chrome.tabs.onActivated.addListener(activeInfo => {
  updateBadgeText(activeInfo.tabId)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAbnormalRequests') {
    const { tabId } = message
    const filteredRequests = abnormalRequests.filter(request => request.tabId === tabId)
    sendResponse(filteredRequests)
  }
})

chrome.webNavigation.onCommitted.addListener(function (details) {
  const url = new URL(details.url)
  const hostname = url.hostname
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    // 清空当前 tab 下的旧纪录
    abnormalRequests = abnormalRequests.filter(req => req.tabId !== tabs[0].id)
    chrome.action.setBadgeText({ text: '0' })
  })
})