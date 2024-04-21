// input-proxy-server
const inputProxyServer = document.querySelector('#input-proxy-server')
// input-proxy-port
const inputProxyPort = document.querySelector('#input-proxy-port')
// textarea-server-list
const textareaServerList = document.querySelector('#textarea-server-list')
// input-file-import
const inputFileImport = document.querySelector('#input-file-import')
// proxy-server-count
const proxyServerCount = document.querySelector('.proxy-server-count')

function getOptions() {
    const keys = ['inputProxyServer', "inputProxyPort", "textareaServerList", "inputFileImport"]
    chrome.storage.local.get(keys, function (result) {
        console.log('get options', result)
        inputProxyServer.value = result['inputProxyServer'] || '127.0.0.1'
        inputProxyPort.value = result['inputProxyPort'] || 1080
        textareaServerList.value = result['textareaServerList'] || ''
        inputFileImport.value = result['inputFileImport'] || null

        proxyServerCount.innerHTML = `${(result['textareaServerList'] || '').split('\n').length || 0} 条`
    })
}

// 初始化
getOptions()

function saveOptions() {
    const conf = {
        inputProxyServer: inputProxyServer.value,
        inputProxyPort: inputProxyPort.value,
        textareaServerList: [...new Set(textareaServerList.value.split('\n').map(it => it.replace(/[\s+,'"]/g, '')))].join('\n'),
        inputFileImport: inputFileImport.value
    }

    chrome.storage.local.set(conf, function () {
        console.log('set options', conf)
        getOptions()
    })

    const saveMsg = document.querySelector('.save-msg')
    saveMsg.style['display'] = 'inherit'
    setTimeout(() => {
        saveMsg.style['display'] = ''
    }, 3 * 1000)
}

function ctrl_s(e) {
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault()
        saveOptions()
    }
}

document.querySelector('#input-save').addEventListener('click', saveOptions)

document.addEventListener("keydown", ctrl_s, false)