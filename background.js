let ports = []
let currentTabId = null
let abnormalRequests = []

let inputProxyServer = null
let inputProxyPort = null
let textareaServerList = []
let inputFileImport = null

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAbnormalRequests') {
    const { tabId } = message
    const filteredRequests = abnormalRequests.filter(request => request.tabId === tabId)
    sendResponse(filteredRequests)
  }
})

chrome.webRequest.onErrorOccurred.addListener(handleErrorRequest, { urls: ["<all_urls>"] })

chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  currentTabId = tabs[0].id
})

chrome.tabs.onActivated.addListener(activeInfo => {
  currentTabId = activeInfo.tabId
  updateBadgeText()
})

function updateBadgeText() {
  const tabRequests = abnormalRequests.filter(request => request.tabId === currentTabId)
  chrome.action.setBadgeText({ text: tabRequests.length.toString() })
}

function requestProxy() {
  const keys = ['inputProxyServer', "inputProxyPort", "textareaServerList", "inputFileImport"]
  chrome.storage.local.get(keys, function (result) {

    inputProxyServer = result['inputProxyServer'] || '127.0.0.1'
    inputProxyPort = result['inputProxyPort'] || 1080
    textareaServerList = result['textareaServerList']?.split('\n') || []
    inputFileImport = result['inputFileImport']
    textareaServerList.concat(abnormalRequests.map(item => item.hostname))
    textareaServerList = textareaServerList.map(item => `'${item}'`)

    debugger
    const config = {
      mode: 'pac_script',
      pacScript: {
        data: `
        function FindProxyForURL(url, host) {
          const domains = [${textareaServerList}];
          const domainObject = {};
          domains.filter(Boolean).forEach((domain) => {
            domainObject[domain] = 1;
          });
          let suffix;
          let pos = host.lastIndexOf(".");
          pos = host.lastIndexOf(".", pos - 1);
          while (1) {
            if (pos <= 0) {
              if (Object.hasOwnProperty.call(domainObject, host)) {
                return 'PROXY ${inputProxyServer}:${inputProxyPort};';
              } else {
                return 'DIRECT;';
              }
            }
            suffix = host.substring(pos + 1);
            if (Object.hasOwnProperty.call(domainObject, suffix)) {
              return 'PROXY ${inputProxyServer}:${inputProxyPort};';
            }
            pos = host.lastIndexOf(".", pos - 1);
          }
        }
      `
      }
    }
    console.log("request with proxy...", config)
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      if (currentTabId) {
        debounce(() => chrome.tabs.reload(currentTabId), 50)
      }
    })
  })
}

requestProxy()

function throttle(func, delay) {
  let lastCall = 0
  return function () {
    const now = Date.now()
    if (now - lastCall < delay) {
      return
    }
    lastCall = now
    return func.apply(this, arguments)
  }
}

function debounce(func, delay) {
  let timerId
  return function () {
    const context = this
    const args = arguments
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func.apply(context, args)
    }, delay)
  }
}

function handleErrorRequest(details) {
  const { tabId, url, error, fromCache } = details
  if (error && !fromCache) {
    let hostname = new URL(url).hostname
    let include = abnormalRequests.some(iii => iii.hostname === hostname && iii.tabId === tabId)
    if (!include) {
      abnormalRequests.push({ tabId, hostname, error })
    }
    requestProxy()
    updateBadgeText()
  }
}
