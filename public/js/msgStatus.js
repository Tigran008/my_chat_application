document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const messageContainer = document.getElementById("displayMessage");
  const message = params.get("message");
  const status = params.get("status");
  if (message) {
    if (status === "success") {
      messageContainer.style.color = "green";
    } else if (status === "fail") {
      messageContainer.style.color = "red";
    }
    messageContainer.innerText = message;
    setTimeout(() => {
      messageContainer.innerText = "";
    }, 2000);
  }
});

