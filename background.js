const badRequests = {}
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
const roots = ["com", "net", "org", "gov", "edu", "mil", "int"]

function updateBadge(tabId) {
  const req = badRequests[tabId] || []
  chrome.action.setBadgeText({ text: req.length.toString() })
}

function hostHandler(host) {
  if (!host) {
    return ""
  }
  if (ipRegex.test(host)) {
    return host
  }
  const items = host.split(".")
  let finalItems = []
  finalItems.unshift(items[items.length - 1])
  for (let index = items.length - 2; index >= 0; index--) {
    let item = items[index]
    finalItems.unshift(item)
    if (roots.indexOf(item) === -1) {
      break
    }
  }
  return finalItems.join(".")
}

function handleErrorRequest(details) {
  const { tabId, url, error, fromCache } = details
  const hostname = hostHandler(new URL(url).hostname)
  const reqs = badRequests[tabId] || []
  const include = reqs.some(req => req.tabId === tabId && req.hostname === hostname)
  if (include) { return }
  reqs.unshift({ tabId, hostname, error })
  badRequests[tabId] = reqs
  updateBadge(tabId)
}

chrome.webRequest.onErrorOccurred.addListener(handleErrorRequest, { urls: ["<all_urls>"] })

chrome.tabs.onActivated.addListener(activeInfo => {
  updateBadge(activeInfo.tabId)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getbadRequests') {
    const { tabId } = message
    sendResponse(badRequests[tabId] || [])
    updateBadge(tabId)
  }
})