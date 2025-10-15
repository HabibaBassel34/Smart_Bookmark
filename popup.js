const saveBtn = document.getElementById("saveBtn");
const list = document.getElementById("bookmarkList");
const tagSelect = document.getElementById("tagSelect");
const filterSelect = document.getElementById("filterSelect");

// Display bookmarks from local storage
function showBookmarks(filterTag = "All") {
  chrome.storage.local.get({ bookmarks: [] }, (data) => {
    list.innerHTML = "";

    let bookmarksToShow = data.bookmarks;
    if (filterTag !== "All") {
      bookmarksToShow = data.bookmarks.filter(b => b.tag === filterTag);
    }

    if (bookmarksToShow.length === 0) {
      list.innerHTML = `<p class="empty">No bookmarks found.</p>`;
      return;
    }

    bookmarksToShow.forEach((bm) => {
      const li = document.createElement("li");
      li.classList.add("bookmark-item");
      li.innerHTML = `
        <div class="bookmark-card">
          <img src="https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}" alt="icon" />
          <div class="info">
            <a href="${bm.url}" target="_blank">${bm.title}</a>
            <p class="meta">Saved on ${bm.date}</p>
          </div>
          <span class="tag ${bm.tag.toLowerCase()}">${bm.tag}</span>
          <button class="deleteBtn">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });

    // Delete functionality (by URL)
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".bookmark-card");
        const urlToDelete = card.querySelector("a").href;

        // Add fade-out animation
        card.style.transition = "opacity 0.3s ease";
        card.style.opacity = "0";

        setTimeout(() => {
          chrome.storage.local.get({ bookmarks: [] }, (data) => {
            const updated = data.bookmarks.filter(b => b.url !== urlToDelete);
            chrome.storage.local.set({ bookmarks: updated }, () => showBookmarks(filterTag));
          });
        }, 300);
      });
    });
  });
}

// Save current tab to extension + Chrome bookmarks
saveBtn.addEventListener("click", () => {
  const tag = tagSelect.value;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const newBookmark = {
      url: tab.url,
      title: tab.title,
      date: new Date().toLocaleDateString(),
      tag: tag
    };

    // 1️⃣ Save to local storage
    chrome.storage.local.get({ bookmarks: [] }, (data) => {
      const updated = data.bookmarks;
      if (!updated.some(b => b.url === tab.url)) {
        updated.push(newBookmark);
        chrome.storage.local.set({ bookmarks: updated }, showBookmarks);
      }
    });

    // 2️⃣ Save to Chrome’s native bookmarks
    const folderName = "Smart Bookmarks";

    chrome.bookmarks.search({ title: folderName }, (results) => {
      if (results.length > 0) {
        chrome.bookmarks.create({
          parentId: results[0].id,
          title: tab.title,
          url: tab.url
        });
      } else {
        chrome.bookmarks.create({ title: folderName }, (folder) => {
          chrome.bookmarks.create({
            parentId: folder.id,
            title: tab.title,
            url: tab.url
          });
        });
      }
    });
  });
});

// Filter by tag
filterSelect.addEventListener("change", (e) => {
  showBookmarks(e.target.value);
});

// Load bookmarks on popup open
showBookmarks();
