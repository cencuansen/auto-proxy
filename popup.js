function renderRequestsTable(requests) {
  const container = document.getElementById('container')

  requests.forEach(request => {
    let div = document.createElement('div')
    div.classList.add('item')
    let input = document.createElement('input')
    input.value = request.hostname
    div.appendChild(input)
    container.appendChild(div)
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