const list = document.getElementById("bookmarkList");

chrome.storage.local.get({ bookmarks: [] }, (data) => {
  list.innerHTML = "";

  if (data.bookmarks.length === 0) {
    list.innerHTML = "<li>No bookmarks saved yet.</li>";
    return;
  }

  data.bookmarks.forEach((b) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = b.url;
    link.textContent = b.title || b.url;
    link.target = "_blank";
    li.appendChild(link);
    list.appendChild(li);
  });
});
