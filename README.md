# Public Holiday Finder

A beginner-friendly frontend project that helps users find public holidays by country and year.

## Features

- Select a country and year.
- Fetch holiday information from the Nager.Date API.
- Display holiday names, dates, local names, types and weekdays.
- Show loading, error and no-result states.
- Save recent searches in the browser and fetch the API again when a saved search is clicked.
- Clear search history.
- Filter holidays by month and type.
- Switch between light and dark themes.
- Export the filtered holiday list as a CSV file.
- Responsive layout for desktop, tablet and mobile.

## Technologies

- HTML
- Tailwind CSS (CDN)
- CSS
- JavaScript
- Nager.Date API

## Run locally

1. Download or clone this repository.
2. Open the folder in a code editor.
3. Open `index.html` in a browser. For a local development server, use the Live Server extension in VS Code.
4. Make sure you have an internet connection so the app can load Tailwind CSS and request data from the API.

## API

The project uses these Nager.Date endpoints:

- Available countries: `https://date.nager.at/api/v3/AvailableCountries`
- Public holidays: `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`

No API key is required.

## Notes

Search history and theme preference are stored in the browser using localStorage. They are not shared between different browsers or devices.

This project is intended as a learning assignment. Review the JavaScript functions and test the loading, error, empty and successful result states before submitting.
