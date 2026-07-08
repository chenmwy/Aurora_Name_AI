(function () {
  "use strict";

  var MOCK_REPLY =
    "我听见了。\n\n让我为这个想法寻找一个有意义的名字。";

  var messagesEl = document.getElementById("namoraMessages");
  var inputEl = document.getElementById("namoraInput");
  var sendBtn = document.getElementById("namoraSend");

  if (!messagesEl || !inputEl || !sendBtn) return;

  function appendMessage(text, role) {
    var div = document.createElement("div");
    div.className = "namora-msg namora-msg--" + role;

    if (text.indexOf("\n") !== -1) {
      text.split(/\n+/).filter(Boolean).forEach(function (part) {
        var p = document.createElement("p");
        p.textContent = part;
        div.appendChild(p);
      });
    } else {
      div.textContent = text;
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function handleSend() {
    var text = inputEl.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    appendMessage(text, "user");
    inputEl.value = "";

    window.setTimeout(function () {
      appendMessage(MOCK_REPLY, "nana");
      sendBtn.disabled = false;
      inputEl.focus();
    }, 480);
  }

  sendBtn.addEventListener("click", handleSend);

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
})();
