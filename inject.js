(function() {
  const baseURL = 'https://ru.wikipedia.org/api/rest_v1/page/summary/';
  const maxSelectionLength = 40;

  function getDefinition(text) {
    let requestUrl = baseURL + text;

    return fetch(requestUrl).then(response => response.json()).then(result => {
      return result;
    });
  }

  function clearSelection() {
    var currentBox = document.getElementById('wiki-what-box');
    if (currentBox) {
      currentBox.remove();
    }
  }

  function generateBox(text, position) {
    var box = document.createElement('p');
    box.id = 'wiki-what-box';
    box.innerHTML = text;
    box.style.position = 'absolute';
    box.style.zIndex = '9999';
    box.style.top = position[1] + 'px';
    box.style.left = position[0] + 'px';
    box.style.maxWidth = '200px';
    box.style.maxHeight = '200px';
    box.style.overflow = 'auto';
    box.style.backgroundColor = '#bce6e1';
    box.style.color = '#000000';
    box.style.padding = '10px';
    box.style.borderRadius = '5px';
    document.body.appendChild(box);
  }

  function sanitize(string) {
    var output = string.replace(/<script[^>]*?>.*?<\/script>/gi, '').
  			 replace(/<[\/\!]*?[^<>]*?>/gi, '').
  			 replace(/<style[^>]*?>.*?<\/style>/gi, '').
  			 replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '').
         trim();
    return output;
  }

  function getBoxPosition(event) {
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    const posX = event.clientX - 50;
    const posY = event.clientY + 15 + scrollTop;

    return [posX, posY];
  }

  document.addEventListener('mouseup', function(event) {
    clearSelection();
    let selectedText = window.getSelection().toString();
    let sanitizedText = sanitize(selectedText);

    if (sanitizedText && sanitizedText.length > maxSelectionLength) {
      return;
    }

    if (sanitizedText && sanitizedText.length) {
      getDefinition(sanitizedText).then(
        function(res) {
          var text = '';
          if (res.description && !res.type == 'disambiguation') {
            text = res.description;
          } else if (res.type == 'disambiguation' || res.extract) {
            text = res.extract;
          } else {
            text = res.title;
          }

          generateBox(text, getBoxPosition(event));
        },
        function(err) {
          console.error(err);
          generateBox('Ошибка!', getBoxPosition(event));
        }
      );
    }
  }, false);

  document.addEventListener('keydown', function(evt) {
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
