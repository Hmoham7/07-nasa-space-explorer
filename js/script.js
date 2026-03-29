// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

// NASA APOD endpoint and demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'XSzSSA6I3FNXFPN3h8tM2Tp1rOxceI1ujKSgihaz';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Show a loading message while API data is being fetched
function renderLoadingState() {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🚀</div>
			<p>Loading images from NASA...</p>
		</div>
	`;
}

// Show an error message if something goes wrong
function renderErrorState(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">⚠️</div>
			<p>${message}</p>
		</div>
	`;
}

// Build one gallery card for each APOD entry
function createGalleryCard(item) {
	const mediaTag = item.media_type === 'image'
		? `<img src="${item.url}" alt="${item.title}" loading="lazy" />`
		: `<p>This date has a video instead of an image. Open it <a href="${item.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>`;

	return `
		<article class="gallery-item">
			${mediaTag}
			<p><strong>${item.title}</strong></p>
			<p>${item.date}</p>
			<p>${item.explanation}</p>
		</article>
	`;
}

// Fetch APOD data for a selected date range
async function getApodByDateRange(startDate, endDate) {
	const requestUrl = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

	const response = await fetch(requestUrl);

	if (!response.ok) {
		throw new Error('NASA API request failed. Please try again.');
	}

	const data = await response.json();

	// API can return a single object or an array depending on date range
	return Array.isArray(data) ? data : [data];
}

// Render APOD results inside the gallery
function renderGallery(items) {
	if (!items.length) {
		renderErrorState('No images found for this date range.');
		return;
	}

	// Show newest items first
	const sortedItems = [...items].sort((a, b) => b.date.localeCompare(a.date));
	gallery.innerHTML = sortedItems.map(createGalleryCard).join('');
}

// Handle button click: validate dates, fetch data, and display cards
async function handleGetImagesClick() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		renderErrorState('Please choose both a start and end date.');
		return;
	}

	if (startDate > endDate) {
		renderErrorState('Start date must be earlier than or equal to end date.');
		return;
	}

	try {
		renderLoadingState();
		const apodItems = await getApodByDateRange(startDate, endDate);
		renderGallery(apodItems);
	} catch (error) {
		renderErrorState(error.message);
	}
}

getImagesButton.addEventListener('click', handleGetImagesClick);
