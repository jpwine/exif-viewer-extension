const rootDiv = document.getElementById('listPlaceholder');
const rootTable = document.getElementById('listTable');
const listSize = document.getElementById('listSize');
const sortType = document.getElementById('sortType');
const sortStatusH = document.getElementById('sortStatusH');
const sortStatusX = document.getElementById('sortStatusX');
const sortStatusW = document.getElementById('sortStatusW');
const regexGetFilename = /[^/]+$/;

document.getElementById("sortSwitch").addEventListener('click', (event) => {
    event.preventDefault();
    sortType.innerHTML = (sortType.innerHTML+1)%3;
    switch (parseInt(sortType.innerHTML)) {
    case 0:
        sortStatusH.style.color = "#222";
        sortStatusX.style.color = "#555";
        sortStatusW.style.color = "#222";
        break;
    case 1:
        sortStatusH.style.color = "#222";
        sortStatusX.style.color = "#BBB";
        sortStatusW.style.color = "#BBB";
        break;
    case 2:
        sortStatusH.style.color = "#BBB";
        sortStatusX.style.color = "#BBB";
        sortStatusW.style.color = "#222";
        break;
    }
});

document.getElementById("scanButton").addEventListener('click', (event) => {
    event.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        var port = chrome.tabs.connect(tabs[0].id, {name: `VCA_nkz7rhj_rge6gcz`});
        if (rootTable.childElementCount>0) {
            while (rootTable.firstChild) {
                rootTable.removeChild(rootTable.firstChild);
            }
        }
        const tBody = document.createElement('tbody');
        Object.assign(rootDiv.style, { display: "block", "overflow-y": "auto" });
        rootTable.append(tBody);
        port.postMessage({state: "ping", listSize: listSize.value, sortType: sortType.innerHTML});
        port.onMessage.addListener(function(msg) {
            switch (msg.state) {
            case "pong":
                const elemTr = document.createElement('tr');
                const elemTD1 = document.createElement('td');
                const elemTD2 = document.createElement('td');
                const elemSrc1 = document.createElement('p');
                const elemSrc2 = document.createElement('p');
                elemTr.style.cursor = "pointer";
                elemTr.append(elemTD1);
                elemTr.append(elemTD2);
                elemTD1.innerHTML = msg.imgSize;
                elemTD1.style.textAlign = "right";
                elemTD2.innerHTML = msg.imgSrc.match(regexGetFilename)[0];
                elemSrc1.innerHTML = msg.imgSrc;
                elemSrc1.style.display = "none";
                elemSrc2.innerHTML = msg.imgSrc;
                elemSrc2.style.display = "none";
                elemTD1.append(elemSrc1);
                elemTD2.append(elemSrc2);
                tBody.append(elemTr);
                elemTr.addEventListener('click', (evt) => {
                    evt.preventDefault();
                    const srcUrl = evt.target.getElementsByTagName('p')[0].innerHTML;
                    let sndMsgPromise = chrome.tabs.sendMessage(tabs[0].id, { action: "fd0cb59b8ef1", url: srcUrl });
                });
                break;
            case "over":
                port.disconnect();
                break;
            }
        });
    });
});
