(function() {
  // const baseURL = 'https://ru.wikipedia.org/api/rest_v1/page/summary/';
  const baseURL = 'https://ru.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&format=json&titles=';
  const maxSelectionLength = 40;

  var listener;

  const getDefinition = (text) => {
    let requestUrl = baseURL + text;

    // return fetch(requestUrl).then(response => response.json()).then(result => {
    //   return result;
    // });

    chrome.runtime.sendMessage(
      requestUrl,
      data => dataProcessFunction(data)
    );
  };

  const clearSelection = () => {
    var currentBox = document.getElementById('wiki-what-box');
    if (currentBox) {
      currentBox.remove();
    }
  };

  const hideInfoButton = () => {
    if (listener) {
      document.removeEventListener('click', listener, false);
    }

    var btn = document.getElementById('wiki-what-button');
    if (btn) {
      btn.parentNode.removeChild(btn);
    }
  };

  const generateBox = (text, position) => {
    let existing = document.getElementById('wiki-what-box');
    if (!existing) {
      var box = document.createElement('div');
      box.id = 'wiki-what-box';
      box.style.position = 'absolute';
      box.style.zIndex = '9999';
      box.style.top = position[1] + 'px';
      box.style.left = position[0] + 'px';
      box.style.minWidth = '85px';
      box.style.maxWidth = '200px';
      box.style.maxHeight = '100px';
      box.style.overflow = 'hidden';
      box.style.boxSizing = 'border-box';
      box.style.backgroundColor = '#fff';
      box.style.color = '#000000';
      box.style.borderRadius = '8px';
      box.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      box.style.fontSize = '14px';

      var innerContainer = document.createElement('div');
      innerContainer.innerHTML = text;
      innerContainer.id = 'wiki-what-body';
      innerContainer.style.maxHeight = '100px';
      innerContainer.style.boxSizing = 'border-box';
      innerContainer.style.overflow = 'auto';
      innerContainer.style.padding = '10px 15px';
      innerContainer.style.textAlign = 'left';

      var closeButton = document.createElement('span');
      closeButton.innerHTML = '&#10005;';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '2px';
      closeButton.style.right = '5px';
      closeButton.style.cursor = 'pointer';

      box.appendChild(closeButton);
      box.appendChild(innerContainer);

      document.body.appendChild(box);
    }
  };

  const sanitize = (string) => {
    var output = string.replace(/<script[^>]*?>.*?<\/script>/gi, '').
  			 replace(/<[\/\!]*?[^<>]*?>/gi, '').
  			 replace(/<style[^>]*?>.*?<\/style>/gi, '').
  			 replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '').
         trim();
    return output;
  };

  const displayPosition = (event, offsetLeft, offsetTop) => {
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    const posX = event.clientX - offsetLeft;
    const posY = event.clientY + offsetTop + scrollTop;

    return [posX, posY];
  };

  const sendRequest = (event, str) => {
    event.stopPropagation();


    getDefinition(str);

    // getDefinition(str).then(
    //   (res) => {
    //     let text = '';
    //
    //     if (res.description && !res.type == 'disambiguation') {
    //       text = res.description;
    //     } else if (res.type == 'disambiguation' || res.extract) {
    //       text = res.extract;
    //     } else if (res.title == 'Not found.') {
    //       text = 'Не найдено.';
    //     } else {
    //       text = res.title;
    //     }
    //
    //     hideInfoButton();
    //     generateBox(text, displayPosition(event, 0, -15));
    //   },
    //   (err) => {
    //     console.error(err);
    //     hideInfoButton();
    //     generateBox('Ошибка!', displayPosition(event, 0, -15));
    //   }
    // );
  };

  const dataProcessFunction = (res) => {
    data = JSON.parse(res);
    console.log(data);
  };

  const showInfoButton = (selectedText, position) => {
    let existing = document.getElementById('wiki-what-button');
    if (!existing) {
      var infoButton = document.createElement('button');
      infoButton.id = 'wiki-what-button';
      infoButton.innerHTML = "?";
      infoButton.style.position = 'absolute';
      infoButton.style.zIndex = '9999';
      infoButton.style.top = position[1] + 'px';
      infoButton.style.left = position[0] + 'px';
      infoButton.style.width = '20px';
      infoButton.style.height = '20px';
      infoButton.style.lineHeight = '20px';
      infoButton.style.boxSizing = 'border-box';
      infoButton.style.backgroundColor = '#807e78';
      infoButton.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';
      infoButton.style.color = '#fff';
      infoButton.style.padding = '0';
      infoButton.style.border = 'none';
      infoButton.style.borderRadius = '50%';
      infoButton.style.fontSize = '14px';
      infoButton.style.cursor = 'pointer';
      infoButton.style.outline = 'none';
      document.body.appendChild(infoButton);

      listener = (event) => {
        event.stopPropagation();
        if (event.target.id === 'wiki-what-button') {
          sendRequest(event, selectedText);
        }
      };

      document.addEventListener('click', listener, false);
    }
  };

  const mouseupListener = (event) => {
    event.stopPropagation();
    if (event.target.id !== 'wiki-what-button' && event.target.id !== 'wiki-what-body') {
      // Create info button
      clearSelection();
      hideInfoButton();

      let selectedText = window.getSelection().toString();
      let currentSelection = sanitize(selectedText);

      if (currentSelection && currentSelection.length > maxSelectionLength) {
        return false;
      }

      if (currentSelection && currentSelection.length) {
        showInfoButton(currentSelection, displayPosition(event, 10, 15));
      }
    }
  };

  document.addEventListener('mouseup', mouseupListener, false);

  document.addEventListener('keydown', (evt) => {
    evt = evt || window.event;
    var isEscape = false;
    if ('key' in evt) {
      isEscape = (evt.key == 'Escape' || evt.key == 'Esc');
    } else {
      isEscape = (evt.keyCode == 27);
    }
    if (isEscape) {
      clearSelection();
    }
  });
})();
