function renderRequestsTable(requests) {
  const container = document.getElementById('container')

  requests.forEach(request => {
    let dp = new DOMParser()
    let text =
      `
        <div class='item'>
          <div class='col col1'><input value='${request.hostname}' /></div>
          <div class='col col2'><input value='${request.error}' /></div>
        </div>
      `
    let dom = dp.parseFromString(text, 'text/html')
    container.appendChild(dom.body.firstChild)
  })

  if (requests.length > 0) {
    document.querySelector('.header').innerHTML = '异常请求'
  } else {
    document.querySelector('.header').innerHTML = '一切正常'
  }
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ action: 'getbadRequests', tabId: tabs[0].id }, (response) => {
      renderRequestsTable(response)
    })
  })
})

setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ action: 'updateBadge', tabId: tabs[0].id }, (response) => { })
  })
}, 1000)