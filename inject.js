(function() {
  const baseURLWiki = 'https://ru.wikipedia.org/api/rest_v1/page/summary/';
  const yaKey = "dict.1.1.20210212T192358Z.6bd4e80f7085cc58.e4a4e2ff70e29e29ca401ed1dcf4c86032d9f295";
  const baseURLYand = `https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${yaKey}&lang=ru-ru&flags=4&text=`;
  const maxSelectionLength = 40;

  var listener;
  var currentSearch = '';
  var currentPosition = [];
  var loading = false;

  const getDefinition = (text, url) => {
    let requestUrl = url + text;

    chrome.runtime.sendMessage(
      requestUrl,
      data => dataProcessFunction(data)
    );
  };

  const clearSelection = () => {
    currentSearch = '';
    currentPosition = [];
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
      box.style.lineHeight = '1.2em';

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

  const displayPosition = (offsetLeft, offsetTop) => {
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    const posX = currentPosition[0] - offsetLeft;
    const posY = currentPosition[1] + offsetTop + scrollTop;

    return [posX, posY];
  };

  const sendRequest = (str) => {
    loading = true;
    var btn = document.getElementById('wiki-what-button');
    btn.innerHTML = '...';
    btn.style.pointerEvents = 'none';
    getDefinition(str, baseURLWiki);
  };

  const dataProcessFunction = (res) => {
    data = JSON.parse(res);
    var foundText = '';

    if (data.description && !data.type == 'disambiguation') {
      // Found Wiki description
      foundText = data.description;
    } else if (data.type == 'disambiguation' || data.extract) {
      // Found Wiki extract
      foundText = data.extract;
    } else if (data.title == 'Not found.') {
      // Not found in Wiki; search in Yandex
      getDefinition(currentSearch, baseURLYand);
      return;
    } else if (data?.def[0]?.tr?.length) {
      // Found Yandex definition
      let definitionsArray = data.def[0].tr;
      let iterations = definitionsArray.length;
      for (definition of definitionsArray) {
        if (--iterations) {
          foundText += definition.text + '; ';
        } else {
          foundText += definition.text;
        }
      }
    } else {
      // Not found
      foundText = 'Не найдено.';
    }

    if (foundText && foundText.length) {
      generateBox(foundText, displayPosition(10, 25));
    }

    loading = false;
    hideInfoButton();
  };

  const showInfoButton = (selectedText, position) => {
    let existing = document.getElementById('wiki-what-button');
    if (!existing) {
      var infoButton = document.createElement('button');
      infoButton.id = 'wiki-what-button';
      infoButton.innerHTML = '?';
      infoButton.style.position = 'absolute';
      infoButton.style.zIndex = '9999';
      infoButton.style.top = position[1] + 'px';
      infoButton.style.left = position[0] + 'px';
      infoButton.style.width = '20px';
      infoButton.style.height = '20px';
      infoButton.style.lineHeight = '20px';
      infoButton.style.boxSizing = 'border-box';
      infoButton.style.backgroundColor = '#807e78';
      infoButton.style.boxShadow = '0 0 10px rgba(255,255,255,0.8)';
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
          sendRequest(selectedText);
        }
      };

      document.addEventListener('click', listener, false);
    }
  };

  const mouseupListener = (event) => {
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
        currentSearch = currentSelection;
        currentPosition = [event.clientX, event.clientY];
        showInfoButton(currentSelection, displayPosition(10, 15));
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
