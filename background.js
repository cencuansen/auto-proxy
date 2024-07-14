const badRequests = {}
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
const roots = ["com", "net", "org", "gov", "edu", "mil", "int"]
const errors = ["net::ERR_CONNECTION_TIMED_OUT", "net::ERR_CONNECTION_RESET"]
const ignoreErrors = ["net::ERR_ABORTED", "net::ERR_BLOCKED_BY_CLIENT", "net::ERR_CACHE_MISS"]
const otherErrors = ["net::ERR_TUNNEL_CONNECTION_FAILED", "net::ERR_BLOCKED_BY_ORB", "net::ERR_CONNECTION_REFUSED", "net::ERR_FAILED"]

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

function errorRequestHandler(details) {
  const { tabId, url, error, fromCache } = details
  const hostname = hostHandler(new URL(url).hostname)
  const reqs = badRequests[tabId] || []
  const include = reqs.some(req => req.tabId === tabId && req.hostname === hostname)
  if (include) { return }
  if (ignoreErrors.includes(error)) { return }
  reqs.unshift({ tabId, hostname, error })
  badRequests[tabId] = reqs
  updateBadge(tabId)
}

function completedRequestHandler(details) {
  const { tabId, url, error, fromCache } = details
  const hostname = hostHandler(new URL(url).hostname)
  const reqs = badRequests[tabId] || []
  reqs = reqs.filter(req => req.hostname !== hostname)
}

chrome.webRequest.onErrorOccurred.addListener(errorRequestHandler, { urls: ["<all_urls>"] })

chrome.webRequest.onCompleted.addListener(completedRequestHandler, { urls: ["<all_urls>"] })


chrome.tabs.onActivated.addListener(activeInfo => {
  updateBadge(activeInfo.tabId)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getbadRequests') {
    const { tabId } = message
    sendResponse(badRequests[tabId] || [])
    updateBadge(tabId)
  }
  if (message.action === 'updateBadge') {
    updateBadge(tabId)
  }
})