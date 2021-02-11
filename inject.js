(function() {
  const baseURL = 'https://ru.wikipedia.org/api/rest_v1/page/summary/';
  const maxSelectionLength = 40;

  var listener;

  const getDefinition = (text) => {
    let requestUrl = baseURL + text;

    return fetch(requestUrl).then(response => response.json()).then(result => {
      return result;
    });
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
      var box = document.createElement('p');
      box.id = 'wiki-what-box';
      box.innerHTML = text;
      box.style.position = 'absolute';
      box.style.zIndex = '9999';
      box.style.top = position[1] + 'px';
      box.style.left = position[0] + 'px';
      box.style.minWidth = '85px';
      box.style.maxWidth = '200px';
      box.style.maxHeight = '100px';
      box.style.overflow = 'auto';
      box.style.backgroundColor = '#fff';
      box.style.color = '#000000';
      box.style.padding = '10px 15px';
      box.style.borderRadius = '8px';
      box.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      box.style.fontSize = '14px';

      var closeButton = document.createElement('span');
      closeButton.innerHTML = '&#10005;';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '2px';
      closeButton.style.right = '5px';
      closeButton.style.cursor = 'pointer';

      box.appendChild(closeButton);
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

    getDefinition(str).then(
      (res) => {
        let text = '';

        if (res.description && !res.type == 'disambiguation') {
          text = res.description;
        } else if (res.type == 'disambiguation' || res.extract) {
          text = res.extract;
        } else if (res.title == 'Not found.') {
          text = 'Не найдено.';
        } else {
          text = res.title;
        }

        hideInfoButton();
        generateBox(text, displayPosition(event, 0, -15));
      },
      (err) => {
        console.error(err);
        hideInfoButton();
        generateBox('Ошибка!', displayPosition(event, 0, -15));
      }
    );
  };

  const showInfoButton = (selectedText, position) => {
    let existing = document.getElementById('wiki-what-button');
    if (!existing) {
      var infoButton = document.createElement('button');
      infoButton.id = 'wiki-what-button';
      infoButton.innerHTML = "?";
      infoButton.style.position = 'absolute';
      infoButton.style.zIndex = '9999 !important';
      infoButton.style.top = position[1] + 'px';
      infoButton.style.left = position[0] + 'px';
      infoButton.style.width = '20px';
      infoButton.style.height = '20px';
      infoButton.style.boxSizing = 'border-box';
      infoButton.style.backgroundColor = '#807e78';
      infoButton.style.color = '#fff';
      infoButton.style.padding = '0';
      infoButton.style.border = 'none';
      infoButton.style.borderRadius = '50%';
      infoButton.style.fontSize = '14px';
      infoButton.style.cursor = 'pointer';
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
    if (event.target.id !== 'wiki-what-button' && event.target.id !== 'wiki-what-box') {
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
