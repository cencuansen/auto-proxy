function renderRequestsTable(requests) {
  const table = document.getElementById('requests-table')
  table.innerHTML = ''

  requests.forEach(request => {
    const row = table.insertRow()
    row.insertCell().textContent = request.hostname
  })
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTabId = tabs[0].id
    chrome.runtime.sendMessage({ action: 'getAbnormalRequests', tabId: currentTabId }, (abnormalRequests) => {
      renderRequestsTable(abnormalRequests)
    })
  })
})