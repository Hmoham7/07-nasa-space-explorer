// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const spaceFactText = document.getElementById('spaceFactText');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalMediaMessage = document.getElementById('modalMediaMessage');
const closeModalButton = document.getElementById('closeModalButton');

// NASA APOD endpoint and demo key
const APOD_URL = 'https://api.nasa.gov/planetary/apod';
const API_KEY = 'XSzSSA6I3FNXFPN3h8tM2Tp1rOxceI1ujKSgihaz';

// A small list of fun facts shown above the gallery
const spaceFacts = [
	'A day on Venus is longer than a year on Venus.',
	'Neutron stars can spin at more than 600 rotations every second.',
	'Jupiter is so large that more than 1,300 Earths could fit inside it.',
	'Saturn could float in water because it is mostly made of gas and has very low density.',
	'The footprints left on the Moon can last for millions of years because there is no wind there.',
	'The International Space Station orbits Earth about every 90 minutes.'
];

let currentGalleryItems = [];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Pick one random fact each time the page loads
function showRandomSpaceFact() {
	if (!spaceFactText) {
		return;
	}

	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

showRandomSpaceFact();

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
function createGalleryCard(item, index) {
	const mediaTag = item.media_type === 'image'
		? `<img src="${item.url}" alt="${item.title}" loading="lazy" />`
		: `<p>This date has a video instead of an image. Open it <a href="${item.url}" target="_blank" rel="noopener noreferrer">here</a>.</p>`;

	return `
		<article class="gallery-item" data-index="${index}" role="button" tabindex="0" aria-label="Open details for ${item.title}">
			${mediaTag}
			<p><strong>${item.title}</strong></p>
			<p>${item.date}</p>
			<p>${item.explanation}</p>
		</article>
	`;
}

// Open modal with larger image and full text details
function openModal(item) {
	// 1) Fill text content first
	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;

	// 2) Check if this APOD item is an image or a video
	const isImage = item.media_type === 'image';

	if (isImage) {
		// Use the HD image when available, otherwise use the normal URL
		const imageUrl = item.hdurl ? item.hdurl : item.url;

		modalImage.src = imageUrl;
		modalImage.alt = item.title;
		modalImage.style.display = 'block';

		// Clear any old video message
		modalMediaMessage.innerHTML = '';
	} else {
		// Hide the image area for non-image APOD entries (like videos)
		modalImage.removeAttribute('src');
		modalImage.style.display = 'none';

		modalMediaMessage.innerHTML = `This APOD entry is a video. Watch it <a href="${item.url}" target="_blank" rel="noopener noreferrer">here</a>.`;
	}

	// 3) Show modal and stop page scrolling behind it
	imageModal.classList.remove('hidden');
	imageModal.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';
}

// Close modal and reset temporary state
function closeModal() {
	imageModal.classList.add('hidden');
	imageModal.setAttribute('aria-hidden', 'true');
	modalImage.removeAttribute('src');
	document.body.style.overflow = '';
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
	currentGalleryItems = sortedItems;
	gallery.innerHTML = sortedItems.map((item, index) => createGalleryCard(item, index)).join('');
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

// Use event delegation so all current and future cards can open the modal
gallery.addEventListener('click', (event) => {
	const clickedCard = event.target.closest('.gallery-item');

	if (!clickedCard) {
		return;
	}

	const itemIndex = Number(clickedCard.dataset.index);
	const selectedItem = currentGalleryItems[itemIndex];

	if (!selectedItem) {
		return;
	}

	openModal(selectedItem);
});

// Allow keyboard users to open a card with Enter or Space
gallery.addEventListener('keydown', (event) => {
	if (event.key !== 'Enter' && event.key !== ' ') {
		return;
	}

	const focusedCard = event.target.closest('.gallery-item');

	if (!focusedCard) {
		return;
	}

	event.preventDefault();
	const itemIndex = Number(focusedCard.dataset.index);
	const selectedItem = currentGalleryItems[itemIndex];

	if (selectedItem) {
		openModal(selectedItem);
	}
});

closeModalButton.addEventListener('click', closeModal);

// Close when user clicks outside the modal content
imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		closeModal();
	}
});

// Close when user presses Escape
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageModal.classList.contains('hidden')) {
		closeModal();
	}
});
