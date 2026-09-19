chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tab)
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null)
  if (tab && tab.url) {
    updateBadge(tab)
  }
})

async function updateBadge(tab) {
  try {
    const params = getParams(tab.url)
    const count = params.length
    if (count > 0) {
      await chrome.action.setBadgeText({
        tabId: tab.id,
        text: String(count)
      })
      await chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: '#EBCB8B'
      })
    } else {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '' })
    }
  } catch {
    return
  }
}

function getParams(url) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'chrome:' ||
        parsed.protocol === 'edge:' ||
        parsed.protocol === 'about:' ||
        parsed.protocol === 'devtools:') {
      return []
    }
    const params = []
    parsed.searchParams.forEach((value, key) => {
      params.push({ key, value })
    })
    return params
  } catch {
    return []
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PARAMS') {
    const params = getParams(message.url)
    sendResponse({ params })
  }
  return true
})