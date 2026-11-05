let currentParams = []

document.addEventListener('DOMContentLoaded', init)

async function init() {
  const tab = await getCurrentTab()
  if (!tab) return
  const url = document.getElementById('url')
  url.textContent = tab.url

  const response = await chrome.runtime.sendMessage({
    type: 'GET_PARAMS',
    url: tab.url
  })

  if (!response || !response.params || response.params.length === 0) {
    renderEmpty()
    return
  }

  currentParams = response.params
  renderParams()
  renderPreview()
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

function renderPreview() {
  const preview = document.getElementById('preview')
  const kept = getKeptParams()
  buildCleanUrlFromTab(kept).then((url) => {
    preview.textContent = url
    preview.title = url
  })
}

function renderParams() {
  const list = document.getElementById('paramList')
  list.innerHTML = ''

  const selectAllRow = document.createElement('label')
  selectAllRow.className = 'param-item select-all'

  const selectAll = document.createElement('input')
  selectAll.type = 'checkbox'
  selectAll.checked = true
  selectAll.id = 'selectAll'

  selectAllRow.appendChild(selectAll)
  list.appendChild(selectAllRow)

  currentParams.forEach((param, index) => {
    const item = document.createElement('label')
    item.className = 'param-item'

    const info = document.createElement('div')
    info.className = 'param-info'

    const key = document.createElement('div')
    key.className = 'param-key'
    key.textContent = param.key

    const value = document.createElement('div')
    value.className = 'param-value'
    value.textContent = param.value

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = true
    checkbox.dataset.index = index

    info.appendChild(key)
    info.appendChild(value)
    item.appendChild(info)
    item.appendChild(checkbox)
    list.appendChild(item)
  })
}

document.getElementById('paramList').addEventListener('change', (event) => {
  if (event.target.id === 'selectAll') {
    const checkboxes = document.querySelectorAll('#paramList .param-item:not(.select-all) input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = event.target.checked
    })
  }
  updateSelectAllState()
  renderPreview()
})

function updateSelectAllState() {
  const selectAll = document.getElementById('selectAll')
  if (!selectAll) return
  const checkboxes = document.querySelectorAll('#paramList .param-item:not(.select-all) input[type="checkbox"]')
  const checkedCount = Array.from(checkboxes).filter((checkbox) => checkbox.checked).length
  selectAll.checked = checkedCount === checkboxes.length
  selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length
}

function renderEmpty() {
  const list = document.getElementById('paramList')
  const div = document.createElement('div')
  div.className = 'no-params'
  div.textContent = 'No query parameters found'
  list.appendChild(div)
  document.getElementById('copyClean').disabled = true
  document.getElementById('reloadBtn').disabled = true
}

function getKeptParams() {
  const checkboxes = document.querySelectorAll('#paramList .param-item:not(.select-all) input[type="checkbox"]')
  const kept = []
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      kept.push(currentParams[Number(checkbox.dataset.index)])
    }
  })
  return kept
}

let currentTabUrl = null

async function buildCleanUrlFromTab(params) {
  if (!currentTabUrl) {
    const tab = await getCurrentTab()
    currentTabUrl = tab.url
  }
  const parsed = new URL(currentTabUrl)
  parsed.search = ''
  params.forEach((param) => {
    parsed.searchParams.append(param.key, param.value)
  })
  return parsed.href
}

document.getElementById('reloadBtn').addEventListener('click', async () => {
  const kept = getKeptParams()
  const cleanUrl = await buildCleanUrlFromTab(kept)
  const tab = await getCurrentTab()
  chrome.tabs.update(tab.id, { url: cleanUrl })
})

document.getElementById('copyClean').addEventListener('click', async () => {
  const kept = getKeptParams()
  const cleanUrl = await buildCleanUrlFromTab(kept)
  await navigator.clipboard.writeText(cleanUrl)
  const button = document.getElementById('copyClean')
  const originalText = button.textContent
  button.textContent = 'Copied!'
  setTimeout(() => {
    button.textContent = originalText
  }, 1500)
})