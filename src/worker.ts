chrome.runtime.onMessage.addListener((msg) => {
    const tabId = msg.tabId;

    chrome.tabs.get(tabId, () => {
        // @ts-ignore lastError is a valid property
        if (!chrome.runtime.lastError) {
            chrome.tabs.remove(tabId);
        }
    });

    return true;

});


function injectedFunction() {

    let [secondsToClose, tabId] = arguments;

    const checkIfRendered = setInterval(() => {
        const successLogEl = document.querySelector('.log-success');
        const simpleCloseText = Array.from(document.querySelectorAll('text')).find(el => el.textContent === 'Please close this browser window.');

        if (successLogEl || simpleCloseText) {
            clearInterval(checkIfRendered);
        } else {
            return;
        }

        const timerTime = document.createElement('span');
        const timerMessage = document.createElement('span');
        const timerContainer = document.createElement('span');
        
        timerTime.textContent = '10s';
        timerMessage.innerHTML = 'Closing window in&nbsp;';

        timerContainer.style.marginLeft = '10px';
        timerContainer.style.fontWeight = 'bold';
        timerContainer.appendChild(timerMessage);
        timerContainer.appendChild(timerTime);

        const closeMessageEl = successLogEl || simpleCloseText;

        if(!closeMessageEl) {
            return;
        }

        closeMessageEl.appendChild(timerContainer);

        let countdownTimeout: number;
        const countdownCallback = () => {
            --secondsToClose;

            if(timerTime) {
                timerTime.textContent = timerTime?.textContent?.replace(/[0-9]+/, `${secondsToClose}`) || '';
            }

            if(secondsToClose <= 0) {
                
                if(countdownTimeout) {
                    clearTimeout(countdownTimeout);
                }

                chrome.runtime.sendMessage({tabId: tabId});
            } else {
                countdownTimeout = setTimeout(countdownCallback, 1000);
            }
        }

        countdownTimeout = setTimeout(countdownCallback, 1000);

    }, 250);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    const url = tab.url;

    if(!url) {
        return;
    }

    if (!isCiscoNotificationUrl(url) || changeInfo.status !== 'complete') return;

    chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: injectedFunction,
        args: [10, tabId],
    });
    

});

function isCiscoNotificationUrl(url: string) {
    const isCiscoNotificationMatch = url.match(/\/\+CSCOE\+\/saml_ac_login\.html/);

    return isCiscoNotificationMatch;
}
