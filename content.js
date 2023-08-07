const elemMask = document.createElement('div');
const elemModal = document.createElement('section');
Object.assign(elemMask.style, {
    background: "rgba(0, 0, 0, 0.4)",
    position: "fixed", top: "0", bottom: "0", right: "0", left: "0",
    "z-index": "12345"
});
Object.assign(elemModal.style, {
    background: "#fff", color: "#555",
    width: "90%", padding: "0", 
    "border-radius": "4px",
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    "-webkit-transform": "translate(-50%, -50%)",
    "-ms-transform": "translate(-50%, -50%)",
    margin: "0 auto",
    "z-index": "12346",
    transition: "0.4s",
    display: "flex"
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "fd0cb59b8ef1") {
        // Modal PlaceHolder
        var modalPlaceHolder;
        if ( document.getElementById("jLqqAa1YSk0Ny8OL") != null ) {
            modalPlaceHolder = document.getElementById("jLqqAa1YSk0Ny8OL");
            if ( modalPlaceHolder.childElementCount>0 ) {
                while ( modalPlaceHolder.firstChild ) {
                    modalPlaceHolder.removeChild(modalPlaceHolder.firstChild);
                }
            }
        } else {
            modalPlaceHolder = document.createElement("div");
            modalPlaceHolder.setAttribute("id", "jLqqAa1YSk0Ny8OL");
        }
        // Modal
        const body = document.querySelector('body');
        const _elemMask = elemMask.cloneNode();
        const _elemModal = elemModal.cloneNode();
        body.append(modalPlaceHolder);
        modalPlaceHolder.append(_elemMask);
        modalPlaceHolder.append(_elemModal);
        _elemMask.addEventListener('click', function() {
            const _modalPlaceHolder = document.getElementById("jLqqAa1YSk0Ny8OL");
            if ( _modalPlaceHolder.childElementCount>0 ) {
                while ( _modalPlaceHolder.firstChild ) {
                    _modalPlaceHolder.removeChild(_modalPlaceHolder.firstChild);
                }
            }
        });
        // Div
        const elemDivLeft = document.createElement('div');
        const elemDivRight = document.createElement('div');
        Object.assign(elemDivLeft.style, {
            hight: "90%", width: "50%",
            margin: "3% 3%"
        });
        Object.assign(elemDivRight.style, {
            hight: "100%", width: "50%",
            margin: "3% 3%",
            "overflow-y": "auto"
        });
        _elemModal.append(elemDivLeft);
        _elemModal.append(elemDivRight);
        // Image
        const elemImg = document.createElement('img');
        elemImg.src = request.url;
        elemImg.addEventListener('load', (e)=> {
            elemDivLeft.append(elemImg);
            if( document.documentElement.clientHeight > document.documentElement.clientWidth * 1.2 ) {
                Object.assign(_elemModal.style, { height: "90%", "flex-direction": "column" });
                Object.assign(elemDivLeft.style, { height: "50%", width: ""});
                Object.assign(elemDivRight.style, { height: "50%", width: ""});
            } else {
                Object.assign(_elemModal.style, { height: "60%" });
            }
            if( elemImg.naturalHeight > elemImg.naturalWidth ) {
                Object.assign(elemImg.style, { height: "100%" });
                if( elemImg.width > elemDivLeft.clientWidth ){
                    Object.assign(elemImg.style, { height: "", width: "100%" });
                }
            } else {
                Object.assign(elemImg.style, { width: "100%" });
                if( elemImg.height > elemDivLeft.clientHeight ){
                    Object.assign(elemImg.style, { height: "100%", width: "" });
                }
            }
            Object.assign(elemImg.style, { display: "block", margin: "auto auto" });
	});

        // Analyze
        const elemTable = document.createElement('table');
        const elemTBody = document.createElement('tbody');
        elemDivRight.append(elemTable);
        Object.assign(elemTable.style, { margin: "0 auto" });
        elemTable.append(elemTBody);
        import(chrome.runtime.getURL("ExifReader-src/exif-reader.js"))
            .then(ExifReader => {
                ExifReader.load(request.url)
                    .then(tags => {
                        Object.keys(tags).forEach(function(tag) {
                            const elemTr = document.createElement('tr');
                            const elemTD1 = document.createElement('td');
                            const elemTD2 = document.createElement('td');
                            elemTD1.innerHTML = tag;
                            elemTD2.innerHTML = tags[tag].description;
                            elemTr.append(elemTD1);
                            elemTr.append(elemTD2);
                            elemTBody.append(elemTr);
                        });
                    })
                    .catch(event => {
                        const elemErr = document.createElement('p');
                        elemErr.innerHTML = event.toString();
                        elemDivRight.append(elemErr);
                    })
            })
    }
});

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "VCA_nkz7rhj_rge6gcz" ) {
        port.onMessage.addListener(function(msg) {
            switch (msg.state) {
            case "ping":
                const images = Array.from(document.getElementsByTagName('img'));
                switch (parseInt(msg.sortType)) {
                case 0:
                    images.sort((a,b) => -1* (a.naturalHeight*a.naturalWidth-b.naturalHeight*b.naturalWidth));
                    break;
                case 1:
                    images.sort((a,b) => -1* (a.naturalHeight - b.naturalHeight));
                    break;
                case 2:
                    images.sort((a,b) => -1* (a.naturalWidth - b.naturalWidth));
                    break;
                }
                images.slice(0,msg.listSize).forEach(img => {
                    port.postMessage({
                        state: "pong",
                        imgSrc: img.src,
                        imgSize: `${img.naturalHeight}x${img.naturalWidth}`
                    });
                });
                port.postMessage({ state: "over" });
                break;
            }
        });
    }
});
