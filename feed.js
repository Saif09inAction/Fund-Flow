const NEWS_API_KEY = "a3561730183044ce82841d7f71fa54fd"; // Replace with your key
const newsContainer = document.getElementById("news-list");

function renderNewsCard(article) {
  return `
    <div class="news-card">
      ${article.urlToImage ? `<img src="${article.urlToImage}" alt="News Image">` : ""}
      <div class="news-card-title"><i class="fa-solid fa-circle-dot"></i> ${article.title}</div>
      <div class="news-card-meta">
        ${article.source.name} | ${new Date(article.publishedAt).toLocaleDateString()}
      </div>
      <div class="news-card-summary">${article.description || ""}</div>
      <a class="news-card-link" href="${article.url}" target="_blank" rel="noopener">
        Read Full Article <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </div>
  `;
}

async function fetchNews(query = "finance") {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=10&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`
    );
    const data = await res.json();
    return data.articles || [];
  } catch (err) {
    console.error("❌ Error fetching news:", err);
    return [];
  }
}

async function loadNews(query = "finance") {
  newsContainer.innerHTML = "Loading...";
  const articles = await fetchNews(query);
  if (articles.length === 0) {
    newsContainer.innerHTML = `<p>No results found for "<b>${query}</b>".</p>`;
    return;
  }
  newsContainer.innerHTML = articles.map(renderNewsCard).join("");
}

document.getElementById("search-btn").addEventListener("click", () => {
  const q = document.getElementById("search-input").value.trim();
  if (q) loadNews(q);
});

document.getElementById("search-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const q = document.getElementById("search-input").value.trim();
    if (q) loadNews(q);
  }
});

// Auto load on start
loadNews();
