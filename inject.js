(function() {
  var currentSelection;
  const baseURL = "https://ru.wikipedia.org/api/rest_v1/page/summary/";
  const maxSelectionLength = 40;

  function getDefinition(text) {
    // Search for the text definition in Wikipedia
    // https://ru.wikipedia.org/api/rest_v1/page/summary/Stack_Overflow

    let requestUrl = baseURL + text;

    return fetch(requestUrl).then(response => response.json()).then(result => {
      return result;
    });
  }

  function clearSelection() {
    currentSelection = '';
    var currentBox = document.getElementById('wiki-what-box');
    if (currentBox) {
      currentBox.remove();
    }
  }

  function generateBox(text) {
    var box = document.createElement('p');
    box.id = 'wiki-what-box';
    box.innerHTML = text;
    box.style.position = "fixed";
    box.style.zIndex = "9999";
    box.style.top = "0px";
    box.style.right = "0px";
    box.style.maxWidth = "200px";
    box.style.maxHeight = "200px";
    box.style.overflow = "auto";
    box.style.backgroundColor = "#bce6e1";
    box.style.color = "#000000";
    box.style.opacity = "0.8";
    box.style.padding = "10px";
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
          if (res.description && !res.type == "disambiguation") {
            generateBox(res.description);
          } else if (res.type == "disambiguation" || res.extract) {
            generateBox(res.extract);
          } else {
            generateBox(res.title);
          }
        },
        function(err) {
          console.error(err);
          generateBox("Error!");
        }
      );


      // var range = window.getSelection().getRangeAt(0);
      // console.log(range);
    }
  }, false);

  document.addEventListener("keydown", function(evt) {
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
      isEscape = (evt.key == "Escape" || evt.key == "Esc");
    } else {
      isEscape = (evt.keyCode == 27);
    }
    if (isEscape && currentSelection) {
      clearSelection();
    }
  });
})();
