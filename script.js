// Public Holiday Finder
// The functions are kept small so the app is easier to understand and update.

const API_BASE_URL = "https://date.nager.at/api/v3";
const HISTORY_KEY = "holidayFinderHistory";

const countrySelect = document.querySelector("#country");
const yearInput = document.querySelector("#year");
const searchForm = document.querySelector("#searchForm");
const searchButton = document.querySelector("#searchButton");
const searchButtonText = document.querySelector("#searchButtonText");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistory");
const monthFilter = document.querySelector("#monthFilter");
const typeFilter = document.querySelector("#typeFilter");
const holidayGrid = document.querySelector("#holidayGrid");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsSubtitle = document.querySelector("#resultsSubtitle");
const resultCount = document.querySelector("#resultCount");
const exportButton = document.querySelector("#exportButton");
const retryButton = document.querySelector("#retryButton");
const themeButton = document.querySelector("#themeButton");

const states = {
  empty: document.querySelector("#emptyState"),
  loading: document.querySelector("#loadingState"),
  error: document.querySelector("#errorState"),
  noResults: document.querySelector("#noResultsState"),
  content: document.querySelector("#holidayContent")
};

let currentHolidays = [];
let currentSearch = null;

// Use the current year as the default.
yearInput.value = new Date().getFullYear();

function showState(stateName) {
  Object.entries(states).forEach(([name, element]) => {
    element.classList.toggle("hidden", name !== stateName);
  });
}

function showMessage(message) {
  const messageElement = document.querySelector("#topMessage");
  messageElement.textContent = message;
  messageElement.classList.remove("hidden");
}

function hideMessage() {
  document.querySelector("#topMessage").classList.add("hidden");
}

async function loadCountries() {
  try {
    const response = await fetch(`${API_BASE_URL}/AvailableCountries`);
    if (!response.ok) throw new Error("Could not load the country list.");

    const countries = await response.json();
    countrySelect.innerHTML = '<option value="">Select a country</option>';

    countries.sort((a, b) => a.name.localeCompare(b.name));
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.countryCode;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });

    countrySelect.value = "IN";
  } catch (error) {
    countrySelect.innerHTML = '<option value="">Countries could not be loaded</option>';
    showMessage("The country list could not be loaded. Please refresh and try again.");
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveHistory(countryCode, countryName, year) {
  const history = getHistory();
  const newItem = { countryCode, countryName, year };
  const updatedHistory = [
    newItem,
    ...history.filter((item) => !(item.countryCode === countryCode && item.year === year))
  ].slice(0, 8);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    const note = document.createElement("p");
    note.className = "text-sm text-slate-500 dark:text-slate-400";
    note.textContent = "No searches yet.";
    historyList.appendChild(note);
    return;
  }

  history.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800";
    button.innerHTML = `<span>${escapeHtml(item.countryName)}</span><span class="text-slate-500">${item.year}</span>`;
    button.addEventListener("click", () => {
      countrySelect.value = item.countryCode;
      yearInput.value = item.year;
      searchHolidays(item.countryCode, item.countryName, item.year);
    });
    historyList.appendChild(button);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    day: "numeric", month: "short", year: "numeric"
  }).format(date);
}

function getHolidayTypes(holiday) {
  return Array.isArray(holiday.types) && holiday.types.length
    ? holiday.types.join(", ")
    : "Public";
}

function renderHolidays() {
  const selectedMonth = Number(monthFilter.value);
  const selectedType = typeFilter.value;

  const filteredHolidays = currentHolidays.filter((holiday) => {
    const monthMatches = selectedMonth === 0 || Number(holiday.date.slice(5, 7)) === selectedMonth;
    const types = holiday.types || [];
    const typeMatches = selectedType === "all" || types.includes(selectedType);
    return monthMatches && typeMatches;
  });

  holidayGrid.innerHTML = "";
  resultCount.textContent = `${filteredHolidays.length} holidays`;
  resultCount.classList.remove("hidden");
  exportButton.disabled = filteredHolidays.length === 0;

  if (filteredHolidays.length === 0) {
    showState("noResults");
    return;
  }

  filteredHolidays.forEach((holiday) => {
    const date = new Date(`${holiday.date}T00:00:00`);
    const weekday = new Intl.DateTimeFormat("en", { weekday: "long" }).format(date);
    const card = document.createElement("article");
    card.className = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">${escapeHtml(formatDate(holiday.date))}</p>
          <h4 class="mt-2 text-lg font-bold">${escapeHtml(holiday.name || "Holiday")}</h4>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">${escapeHtml(holiday.localName || holiday.name || "")}</p>
        </div>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">${escapeHtml(weekday)}</span>
      </div>
      <div class="mt-5 flex flex-wrap gap-2">
        ${(holiday.types && holiday.types.length ? holiday.types : ["Public"]).map((type) =>
          `<span class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">${escapeHtml(type)}</span>`
        ).join("")}
        ${holiday.counties ? '<span class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Regional</span>' : ""}
      </div>`;
    holidayGrid.appendChild(card);
  });

  showState("content");
}

async function searchHolidays(countryCode, countryName, year) {
  if (!countryCode || !year || year < 2000 || year > 2100) {
    showMessage("Please select a country and enter a valid year (2000–2100).");
    return;
  }

  hideMessage();
  currentSearch = { countryCode, countryName, year };
  searchButton.disabled = true;
  searchButtonText.textContent = "Searching...";
  showState("loading");
  resultsTitle.textContent = `${countryName} public holidays`;
  resultsSubtitle.textContent = `Holiday dates for ${year}`;

  try {
    const response = await fetch(`${API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok) throw new Error("The holiday service could not complete your request.");

    const holidays = await response.json();
    currentHolidays = Array.isArray(holidays) ? holidays : [];
    saveHistory(countryCode, countryName, year);
    renderHolidays();
  } catch (error) {
    showState("error");
    document.querySelector("#errorText").textContent =
      "We could not get holiday data. Check your internet connection and try again.";
    resultCount.classList.add("hidden");
    exportButton.disabled = true;
  } finally {
    searchButton.disabled = false;
    searchButtonText.textContent = "Search holidays";
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const countryName = countrySelect.options[countrySelect.selectedIndex]?.textContent || "";
  searchHolidays(countrySelect.value, countryName, Number(yearInput.value));
});

monthFilter.addEventListener("change", renderHolidays);
typeFilter.addEventListener("change", renderHolidays);

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

retryButton.addEventListener("click", () => {
  if (currentSearch) {
    searchHolidays(currentSearch.countryCode, currentSearch.countryName, currentSearch.year);
  }
});

exportButton.addEventListener("click", () => {
  const month = Number(monthFilter.value);
  const type = typeFilter.value;
  const rows = currentHolidays.filter((holiday) => {
    const monthMatches = month === 0 || Number(holiday.date.slice(5, 7)) === month;
    const typeMatches = type === "all" || (holiday.types || []).includes(type);
    return monthMatches && typeMatches;
  });

  const headings = ["Date", "Name", "Local Name", "Types", "Country Code"];
  const csvRows = rows.map((holiday) => [
    holiday.date, holiday.name, holiday.localName,
    getHolidayTypes(holiday), currentSearch?.countryCode || ""
  ]);
  const csv = [headings, ...csvRows]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `holidays-${currentSearch?.countryCode || "list"}-${currentSearch?.year || ""}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

themeButton.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  themeButton.textContent = isDark ? "☀ Light" : "🌙 Dark";
  localStorage.setItem("holidayFinderTheme", isDark ? "dark" : "light");
});

function applySavedTheme() {
  const savedTheme = localStorage.getItem("holidayFinderTheme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    themeButton.textContent = "☀ Light";
  }
}

async function startApp() {
  applySavedTheme();
  renderHistory();
  await loadCountries();
}

startApp();
