document.addEventListener('DOMContentLoaded', () => {
    // ---------------- Lenis Smooth Scrolling ----------------
document.addEventListener("DOMContentLoaded", () => {
    if (window.Lenis) {
        const lenis = new Lenis();

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    } else {
        console.warn("Lenis library not loaded.");
    }
});

// ---------------- SOCKET.IO INIT ----------------
const socket = io();

// ---------------- Uploader Helper ----------------
async function uploadFile(file, type) {
    if (!file) return;

    console.log(`[uploader] uploading file "${file.name}" as type "${type}"`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
        const res = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        console.log("[uploader] success", data);

        // Append uploaded file depending on type
        if (type === "gallery") {
            addImageToGrid(data.path, "image-grid");
        } else if (type === "gif") {
            addImageToGrid(data.path, "gif-grid");
        } else if (type === "homework") {
            addFileToList(data.path, "homework-list");
        }

    } catch (err) {
        console.error("[uploader] error", err);
    }
}

// ---------------- DOM Helpers ----------------
function addImageToGrid(src, gridId) {
    const grid = document.getElementById(gridId);
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Uploaded Image";
    img.classList.add("uploaded-image");
    grid.appendChild(img);
}

function addFileToList(src, listId) {
    const list = document.getElementById(listId);
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = src;
    a.textContent = src.split("/").pop();
    a.target = "_blank";
    li.appendChild(a);
    list.appendChild(li);
}

// ---------------- Gallery Upload ----------------
const galleryInput = document.getElementById("gallery-upload-input");
const galleryUploadBtn = document.getElementById("gallery-upload-button");

galleryUploadBtn.addEventListener("click", () => {
    if (galleryInput.files.length > 0) {
        uploadFile(galleryInput.files[0], "gallery");
        galleryInput.value = "";
    } else {
        alert("Please select a file first.");
    }
});

// ---------------- GIF Upload ----------------
const gifInput = document.getElementById("gif-upload-input");
const gifUploadBtn = document.getElementById("gif-upload-button");

gifUploadBtn.addEventListener("click", () => {
    if (gifInput.files.length > 0) {
        uploadFile(gifInput.files[0], "gif");
        gifInput.value = "";
    } else {
        alert("Please select a file first.");
    }
});

// ---------------- Homework Upload ----------------
const homeworkInput = document.getElementById("homework-upload-input");
const homeworkUploadBtn = document.getElementById("homework-upload-button");

homeworkUploadBtn.addEventListener("click", () => {
    if (homeworkInput.files.length > 0) {
        uploadFile(homeworkInput.files[0], "homework");
        homeworkInput.value = "";
    } else {
        alert("Please select a file first.");
    }
});

// ---------------- Image Carousel ----------------
const scrollLeftBtn = document.getElementById("scroll-left-button");
const scrollRightBtn = document.getElementById("scroll-right-button");
const moreImagesGrid = document.getElementById("more-images-grid");

let scrollIndex = 0;
const visibleCount = 3;

function updateCarousel() {
    const images = moreImagesGrid.querySelectorAll("img");
    images.forEach((img, idx) => {
        img.style.display = (idx >= scrollIndex && idx < scrollIndex + visibleCount) ? "inline-block" : "none";
    });
}

scrollLeftBtn.addEventListener("click", () => {
    if (scrollIndex > 0) {
        scrollIndex--;
        updateCarousel();
    }
});

scrollRightBtn.addEventListener("click", () => {
    const images = moreImagesGrid.querySelectorAll("img");
    if (scrollIndex < images.length - visibleCount) {
        scrollIndex++;
        updateCarousel();
    }
});

// Run once at start
updateCarousel();

// ---------------- Placeholder Fix ----------------
document.getElementById("album-art").onerror = function () {
    this.src = "https://via.placeholder.com/150";
};
document.getElementById("profile-picture-display").onerror = function () {
    this.src = "https://via.placeholder.com/100";
};

    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';

    let currentGallery = [];
    let currentIndex = 0;
    let musicLibrary = [];
    let songIndex = 0;
    let isPlaying = false;

    // DOM elements (some may be null depending on which HTML variant you use)
    const elements = {
        body: document.body,
        username: document.getElementById('username-display'),
        profilePic: document.getElementById('profile-picture-display'),
        banner: document.getElementById('banner-display'),
        youtubeLink: document.getElementById('youtube-link'),
        imageGrid: document.getElementById('image-grid'),               // old layout
        gifGrid: document.getElementById('gif-grid'),
        storyList: document.getElementById('story-list'),
        homeworkList: document.getElementById('homework-list'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.querySelector('.lightbox-content'),
        lightboxPrev: document.getElementById('lightbox-prev'),
        lightboxNext: document.getElementById('lightbox-next'),
        audioPlayer: document.getElementById('audio-source'),
        playPauseBtn: document.getElementById('play-pause-button'),
        prevBtn: document.getElementById('prev-button'),
        nextBtn: document.getElementById('next-button'),
        albumArt: document.getElementById('album-art'),
        songTitle: document.getElementById('song-title'),
        songArtist: document.getElementById('song-artist'),
        progressContainer: document.getElementById('progress-container'),
        progress: document.getElementById('progress'),
        currentTimeEl: document.getElementById('current-time'),
        durationEl: document.getElementById('duration'),
        playlistToggle: document.getElementById('playlist-toggle'),
        playlist: document.getElementById('playlist'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        messages: document.getElementById('messages'),
        // socket might be undefined if socket.io isn't available; guard later
        socket: (typeof io === 'function') ? io() : null,
        moreImagesContainer: document.getElementById('more-images-container'),
        moreImagesTrigger: document.getElementById('more-images-trigger'),
        moreImagesWidget: document.getElementById('more-images-widget'),
        moreImagesGrid: document.getElementById('more-images-grid'),
        scrollLeftButton: document.getElementById('scroll-left-button'),
        scrollRightButton: document.getElementById('scroll-right-button'),
        backgroundCategories: document.getElementById('background-categories'),
        backgroundSwitcher: document.getElementById('background-switcher'),
        musicUploadButton: document.getElementById('music-upload-button'),
        musicUploadInput: document.getElementById('music-upload-input'),
        // new carousel elements (if present)
        carouselEl: document.getElementById('image-carousel'),
        carouselWrapper: document.querySelector('.carousel-wrapper'),
        carouselLeft: document.getElementById('carousel-left'),
        carouselRight: document.getElementById('carousel-right')
    };

    // --- HELPER FUNCTIONS ---

    const playSong = () => {
        isPlaying = true;
        elements.audioPlayer.play();
        elements.playPauseBtn.textContent = '⏸️';
    };

    const pauseSong = () => {
        isPlaying = false;
        elements.audioPlayer.pause();
        elements.playPauseBtn.textContent = '▶️';
    };

    const loadSong = (song) => {
        elements.songTitle.textContent = song.title;
        elements.songArtist.textContent = "Your Artist Name";
        elements.audioPlayer.src = song.src;
        elements.albumArt.src = song.cover;
        document.querySelectorAll('#playlist li').forEach(li => {
            li.classList.toggle('playing', li.dataset.songSrc === song.src);
        });
    };

    const prevSong = () => {
        songIndex--;
        if (songIndex < 0) { songIndex = musicLibrary.length - 1; }
        loadSong(musicLibrary[songIndex]);
        playSong();
    };

    const nextSong = () => {
        songIndex++;
        if (songIndex > musicLibrary.length - 1) { songIndex = 0; }
        loadSong(musicLibrary[songIndex]);
        playSong();
    };

    const updateProgress = (e) => {
        const { duration, currentTime } = e.srcElement;
        if (isNaN(duration)) return;
        const progressPercent = (currentTime / duration) * 100;
        elements.progress.style.width = `${progressPercent}%`;
        const formatTime = (time) => {
            if (isNaN(time)) return "0:00";
            const minutes = Math.floor(time / 60);
            let seconds = Math.floor(time % 60);
            if (seconds < 10) { seconds = `0${seconds}`; }
            return `${minutes}:${seconds}`;
        };
        elements.durationEl.textContent = formatTime(duration);
        elements.currentTimeEl.textContent = formatTime(currentTime);
    };

    const setProgress = (e) => {
        const width = e.currentTarget.clientWidth;
        const clickX = e.offsetX;
        const duration = elements.audioPlayer.duration;
        if (duration) {
            elements.audioPlayer.currentTime = (clickX / width) * duration;
        }
    };

    const openLightbox = (clickedItem, galleryType) => {
        let gallerySource;
        if (galleryType === 'galleryImages') {
            // prefer carousel if present, else old grid/more grid
            if (elements.carouselEl) {
                gallerySource = Array.from(document.querySelectorAll('#image-carousel .carousel-item img'));
                // map to src strings to match previous logic
                currentGallery = gallerySource.map(img => img.src);
            } else {
                gallerySource = Array.from(document.querySelectorAll('#image-grid .grid-item, #more-images-grid .grid-item'));
                currentGallery = gallerySource.map(item => item.dataset.filePath);
            }
        } else {
            gallerySource = Array.from(document.querySelectorAll('#gif-grid .grid-item'));
            currentGallery = gallerySource.map(item => item.dataset.filePath);
        }

        // find index (clickedItem may be object with path property or an <img> element)
        let clickedPath = clickedItem && clickedItem.path ? clickedItem.path : (clickedItem && clickedItem.src ? clickedItem.src : null);
        currentIndex = currentGallery.indexOf(clickedPath);
        if (currentIndex === -1) currentIndex = 0;
        showImageAtIndex(currentIndex);
        elements.lightbox && elements.lightbox.classList.remove('hidden');
    };

    const showImageAtIndex = (index) => {
        if (!elements.lightboxImage) return;
        if (index < 0 || index >= currentGallery.length) return;
        elements.lightboxImage.src = currentGallery[index];
        if (elements.lightboxPrev) elements.lightboxPrev.style.display = index === 0 ? 'none' : 'block';
        if (elements.lightboxNext) elements.lightboxNext.style.display = index === currentGallery.length - 1 ? 'none' : 'block';
    };

    const backgrounds = {
        sfw: [ '/assets/backgrounds/sfw/bg1.jpg', '/assets/backgrounds/sfw/bg2.jpg', '/assets/backgrounds/sfw/bg3.jpg', '/assets/backgrounds/sfw/bg4.jpg', '/assets/backgrounds/sfw/bg5.jpg' ],
        nsfw: [ '/assets/backgrounds/nsfw/bg1.jpg', '/assets/backgrounds/nsfw/bg2.jpg', '/assets/backgrounds/nsfw/bg3.jpg', '/assets/backgrounds/nsfw/bg4.jpg', '/assets/backgrounds/nsfw/bg5.jpg' ]
    };
    
    const setBackground = (bgPath) => {
        document.body.style.backgroundImage = `url(${bgPath})`;
        localStorage.setItem('selectedBackground', bgPath);
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.classList.toggle('active', thumb.dataset.bgPath === bgPath);
        });
    };

    const generateThumbnails = (category) => {
        if (!elements.backgroundSwitcher) return;
        elements.backgroundSwitcher.innerHTML = '';
        if (!backgrounds[category]) return;
        backgrounds[category].forEach(bgPath => {
            const thumb = document.createElement('div');
            thumb.className = 'bg-thumbnail';
            thumb.style.backgroundImage = `url(${bgPath})`;
            thumb.dataset.bgPath = bgPath;
            elements.backgroundSwitcher.appendChild(thumb);
        });
        const savedBackground = localStorage.getItem('selectedBackground');
        if (savedBackground && backgrounds[category].includes(savedBackground)) {
            setBackground(savedBackground);
        }
    };

    // Helper to determine which gallery container to use
    const hasCarousel = !!elements.carouselEl;
    const galleryEl = elements.carouselEl || elements.imageGrid; // prefer carousel if present
    const moreGridEl = elements.moreImagesGrid; // may be null

    // We keep a small array for gallery items (used by old grid logic)
    const galleryItems = [];

    // Create grid item (old layout)
    const createGridItem = (item, type) => {
        const container = document.createElement('div');
        container.className = 'grid-item';
        container.dataset.filePath = item.path;
        container.dataset.originalName = item.originalName || '';
        const img = document.createElement('img');
        img.src = item.path;
        img.onclick = () => openLightbox(item, type);
        container.appendChild(img);
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Are you sure?')) return;
                await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: item.path, type }) });
                await initializePage();
            };
            container.appendChild(deleteBtn);
            if (type === 'galleryImages') {
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.textContent = '☰';
                container.appendChild(dragHandle);
            }
        }
        return container;
    };

    // Create carousel item (new layout)
    const createCarouselItem = (item, type) => {
        const container = document.createElement('div');
        container.className = 'carousel-item';
        container.dataset.filePath = item.path;
        container.dataset.originalName = item.originalName || '';
        const img = document.createElement('img');
        img.src = item.path;
        img.onclick = () => openLightbox({ path: item.path }, type);
        container.appendChild(img);
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Are you sure?')) return;
                await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: item.path, type }) });
                await initializePage();
            };
            // overlay delete button (positioned with CSS .delete-button exists)
            container.appendChild(deleteBtn);
        }
        return container;
    };

    // Append image into gallery depending on layout
    const addImageToGallery = (item) => {
        // If carousel exists, append there (we use horizontal scrolling)
        if (hasCarousel && elements.carouselEl) {
            const carouselItem = createCarouselItem(item, 'galleryImages');
            elements.carouselEl.appendChild(carouselItem);
            // optional: scroll to end so newly uploaded image is visible
            // small timeout to allow layout
            setTimeout(() => {
                try {
                    elements.carouselEl.scrollTo({ left: elements.carouselEl.scrollWidth, behavior: 'smooth' });
                } catch (err) { /* ignore */ }
            }, 100);
            return;
        }

        // Old layout: show up to 3 items in the main grid, rest goes to more-images-grid
        if (elements.imageGrid) {
            if (elements.imageGrid.children.length < 3) {
                elements.imageGrid.appendChild(createGridItem(item, 'galleryImages'));
            } else {
                if (elements.moreImagesContainer) elements.moreImagesContainer.classList.remove('hidden');
                if (elements.moreImagesGrid) elements.moreImagesGrid.appendChild(createGridItem(item, 'galleryImages'));
                if (elements.moreImagesTrigger) {
                    const countSpan = elements.moreImagesTrigger.querySelector('span');
                    if (countSpan) countSpan.textContent = elements.moreImagesGrid.children.length;
                }
            }
        } else {
            // fallback: attempt to append into galleryEl if present
            if (galleryEl) {
                const el = createGridItem(item, 'galleryImages');
                galleryEl.appendChild(el);
            }
        }
    };

    // Universal uploader unchanged, only logs more info
    const universalUploader = async (file, type) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        try {
            console.log(`[uploader] uploading file "${file.name}" as type "${type}"`);
            const response = await fetch('/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `${response.status} ${response.statusText}`);
            }
            const json = await response.json();
            console.log('[uploader] success', json);
            return json;
        } catch (error) {
            console.error(`Upload failed for ${type}:`, error);
            alert(`Upload failed: ${error.message}`);
            return null;
        }
    };

    const addStoryToList = (story) => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'story-item';
        storyDiv.innerHTML = `<div><h4>${story.title}</h4><p>${story.content.substring(0, 50)}...</p></div>`;
        storyDiv.querySelector('div').onclick = () => alert(`Title: ${story.title}\n\n${story.content}`);
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Delete this story?')) return;
                await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
                storyDiv.remove();
            };
            storyDiv.appendChild(deleteBtn);
        }
        elements.storyList && elements.storyList.prepend(storyDiv);
    };

    const addHomeworkToList = (file) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${file.path}" download="${file.originalName}">${file.originalName}</a>`;
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async () => {
                if (!confirm('Delete this file?')) return;
                await fetch('/api/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: file.path, type: 'homework' }) });
                li.remove();
            };
            li.appendChild(deleteBtn);
        }
        elements.homeworkList && elements.homeworkList.appendChild(li);
    };

    async function loadMusicLibrary() {
        try {
            const res = await fetch('/api/music');
            musicLibrary = await res.json();
            elements.playlist && (elements.playlist.innerHTML = '');
            if (musicLibrary.length > 0) {
                loadSong(musicLibrary[songIndex]);
                musicLibrary.forEach((song, index) => {
                    const li = document.createElement('li');
                    li.dataset.songSrc = song.src;
                    li.innerHTML = `<img src="${song.cover}" alt="cover"> <span>${song.title}</span>`;
                    li.addEventListener('click', () => {
                        songIndex = index;
                        loadSong(musicLibrary[songIndex]);
                        playSong();
                    });
                    elements.playlist && elements.playlist.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Could not load music library", error);
        }
    }

    async function initializePage() {
        if (isAdmin) document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        try {
            const response = await fetch('/api/data');
            const data = await response.json();

            if (elements.username) elements.username.childNodes[0].nodeValue = data.settings.username + ' ';
            if (elements.profilePic) elements.profilePic.src = data.settings.profilePicture;
            if (data.settings.banner && elements.banner) elements.banner.style.backgroundImage = `url(${data.settings.banner})`;
            if (elements.youtubeLink) elements.youtubeLink.href = data.settings.youtubeUrl;

            // Clear gallery areas (both possible layouts)
            if (elements.imageGrid) elements.imageGrid.innerHTML = '';
            if (elements.moreImagesGrid) elements.moreImagesGrid.innerHTML = '';
            if (elements.carouselEl) elements.carouselEl.innerHTML = '';
            if (elements.moreImagesContainer) elements.moreImagesContainer.classList.add('hidden');

            // Add gallery images using unified handler
            (data.galleryImages || []).forEach(addImageToGallery);

            // GIFs
            if (elements.gifGrid) {
                elements.gifGrid.innerHTML = '';
                (data.gifs || []).forEach(item => elements.gifGrid.appendChild(createGridItem(item, 'gifs')));
            }

            // Stories
            if (elements.storyList) {
                elements.storyList.innerHTML = '';
                (data.stories || []).forEach(addStoryToList);
            }

            // Homework
            if (elements.homeworkList) {
                elements.homeworkList.innerHTML = '';
                (data.homework || []).forEach(addHomeworkToList);
            }

            if (isAdmin && elements.imageGrid) {
                // apply Sortable only if the old grid is present
                new Sortable(elements.imageGrid, {
                    handle: '.drag-handle', animation: 150,
                    onEnd: async (evt) => {
                        const newOrder = Array.from(evt.target.children).map(item => ({ path: item.dataset.filePath, originalName: item.dataset.originalName }));
                        await fetch('/api/gallery/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newOrder }) });
                    }
                });
            }
        } catch (error) {
            console.error("Failed to initialize page data:", error);
        }
        await loadMusicLibrary();
    }
    
    // Set up background thumbnails / selection
    const savedBackground = localStorage.getItem('selectedBackground');
    let startingCategory = 'sfw';
    if (savedBackground && backgrounds.nsfw.includes(savedBackground)) {
        startingCategory = 'nsfw';
        const nsfwBtn = document.querySelector('#background-categories button[data-category="nsfw"]');
        const sfwBtn = document.querySelector('#background-categories button[data-category="sfw"]');
        nsfwBtn && nsfwBtn.classList.add('active');
        sfwBtn && sfwBtn.classList.remove('active');
    }
    generateThumbnails(startingCategory);
    setBackground(savedBackground || backgrounds.sfw[0]);
    
    initializePage();

    const themeToggleButton = document.getElementById('theme-toggle');
    function setTheme(theme) { document.body.className = ''; if (theme === 'dark') document.body.classList.add('dark-theme'); localStorage.setItem('theme', theme); }
    setTheme(localStorage.getItem('theme') || 'system');

    // --- EVENT LISTENERS ---

    // Audio controls
    elements.playPauseBtn && elements.playPauseBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));
    elements.prevBtn && elements.prevBtn.addEventListener('click', prevSong);
    elements.nextBtn && elements.nextBtn.addEventListener('click', nextSong);
    elements.audioPlayer && elements.audioPlayer.addEventListener('timeupdate', updateProgress);
    elements.progressContainer && elements.progressContainer.addEventListener('click', setProgress);
    elements.audioPlayer && elements.audioPlayer.addEventListener('ended', nextSong);
    elements.playlistToggle && elements.playlistToggle.addEventListener('click', () => { elements.playlist && elements.playlist.classList.toggle('hidden'); });

    // Lightbox nav
    elements.lightboxPrev && elements.lightboxPrev.addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; showImageAtIndex(currentIndex); } });
    elements.lightboxNext && elements.lightboxNext.addEventListener('click', () => { if (currentIndex < currentGallery.length - 1) { currentIndex++; showImageAtIndex(currentIndex); } });

    // Background categories
    elements.backgroundCategories && elements.backgroundCategories.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const category = e.target.dataset.category;
            document.querySelectorAll('#background-categories button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            generateThumbnails(category);
        }
    });

    // Background switcher thumbnails
    elements.backgroundSwitcher && elements.backgroundSwitcher.addEventListener('click', (e) => {
        if (e.target.classList.contains('bg-thumbnail')) {
            setBackground(e.target.dataset.bgPath);
        }
    });

    // More images hover widget and scroll arrows (old layout)
    elements.moreImagesTrigger && elements.moreImagesTrigger.addEventListener('mouseenter', () => elements.moreImagesWidget && elements.moreImagesWidget.classList.remove('hidden'));
    elements.moreImagesContainer && elements.moreImagesContainer.addEventListener('mouseleave', () => elements.moreImagesWidget && elements.moreImagesWidget.classList.add('hidden'));
    elements.scrollLeftButton && elements.scrollLeftButton.addEventListener('click', () => { elements.moreImagesGrid && (elements.moreImagesGrid.scrollLeft -= 110); });
    elements.scrollRightButton && elements.scrollRightButton.addEventListener('click', () => { elements.moreImagesGrid && (elements.moreImagesGrid.scrollLeft += 110); });

    // Carousel arrow behavior (new layout)
    if (elements.carouselLeft && elements.carouselRight && elements.carouselEl) {
        const scrollAmount = 190; // item width + gap (adjust if your CSS differs)
        elements.carouselLeft.addEventListener('click', () => {
            elements.carouselEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        elements.carouselRight.addEventListener('click', () => {
            elements.carouselEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    // Admin controls
    if (isAdmin) {
        document.getElementById('exit-admin-button') && (document.getElementById('exit-admin-button').onclick = () => { window.location.search = ''; });
        document.getElementById('clean-db-button') && (document.getElementById('clean-db-button').onclick = async () => {
            if (!confirm('This will remove all database entries for files that are missing. Are you sure?')) return;
            const response = await fetch('/api/sync-database', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
                alert(`Sync complete! ${result.cleanedCount} orphaned entries removed. The page will now reload.`);
                window.location.reload();
            } else {
                alert('Sync failed.');
            }
        });
        document.getElementById('admin-fab') && (document.getElementById('admin-fab').onclick = () => document.getElementById('admin-menu').classList.toggle('hidden'));

        if (elements.musicUploadButton && elements.musicUploadInput) {
            elements.musicUploadButton.addEventListener('click', async () => {
                const input = elements.musicUploadInput;
                if (!input.files[0]) return alert('Please select a music or cover file.');
                const data = await universalUploader(input.files[0], 'music');
                if (data) { alert(`Successfully uploaded ${data.originalName}`); await loadMusicLibrary(); }
                input.value = '';
            });
        }
    }

    themeToggleButton && themeToggleButton.addEventListener('click', () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));

    elements.lightbox && (elements.lightbox.querySelector('.close-button') && (elements.lightbox.querySelector('.close-button').onclick = () => elements.lightbox.classList.add('hidden')));

    // Profile picture upload click
    elements.profilePic && (elements.profilePic.onclick = () => document.getElementById('profile-picture-upload') && document.getElementById('profile-picture-upload').click());

    // Profile picture change handler
    const profileUpload = document.getElementById('profile-picture-upload');
    if (profileUpload) {
        profileUpload.onchange = async (e) => {
            if (!e.target.files[0]) return;
            const { path } = await universalUploader(e.target.files[0], 'profile') || {};
            if (path && elements.profilePic) elements.profilePic.src = path;
        };
    }

    // Banner change
    const bannerBtn = document.getElementById('change-banner-button');
    const bannerUpload = document.getElementById('banner-upload');
    if (bannerBtn && bannerUpload) {
        bannerBtn.onclick = () => bannerUpload.click();
        bannerUpload.onchange = async (e) => {
            if (!e.target.files[0]) return;
            const { path } = await universalUploader(e.target.files[0], 'banner') || {};
            if (path && elements.banner) elements.banner.style.backgroundImage = `url(${path})`;
        };
    }

    // Story submit
    const storyForm = document.getElementById('story-form');
    if (storyForm) {
        storyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('story-title').value;
            const content = document.getElementById('story-content').value;
            const response = await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
            addStoryToList(await response.json());
            e.target.reset();
        });
    }

    // Chat
    elements.chatForm && elements.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (elements.chatInput && elements.chatInput.value && elements.socket) {
            elements.socket.emit('chat message', elements.chatInput.value);
            elements.chatInput.value = '';
        }
    });
    if (elements.socket) {
        elements.socket.on('chat message', (msg) => {
            const item = document.createElement('li');
            item.textContent = msg;
            elements.messages && elements.messages.appendChild(item);
            elements.messages && (elements.messages.scrollTop = elements.messages.scrollHeight);
        });
    }

    // --- UPLOAD HANDLING (robust) ---
    // This function wires a choose button + upload button + hidden input
    const setupUploadPair = (options) => {
        // options: { chooseBtnId, uploadBtnId, inputId, type, onSuccess (function) }
        const chooseBtn = document.getElementById(options.chooseBtnId);
        const uploadBtn = document.getElementById(options.uploadBtnId);
        const input = document.getElementById(options.inputId);

        if (!input) {
            console.warn(`[upload] input "${options.inputId}" not found`);
            return;
        }

        // If choose or upload button missing, try to find them inside the same parent .upload-form
        if (!chooseBtn || !uploadBtn) {
            const parent = input.closest('.upload-form');
            if (parent) {
                if (!chooseBtn) chooseBtn = parent.querySelector('.choose-button, .glass-button, button');
                if (!uploadBtn) {
                    // choose the last button that likely is Upload
                    const buttons = Array.from(parent.querySelectorAll('button'));
                    uploadBtn = buttons.find(b => b.id && b.id.includes('upload')) || buttons[buttons.length - 1];
                }
            }
        }

        if (chooseBtn) {
            // ensure it doesn't submit any form accidentally
            chooseBtn.setAttribute('type', 'button');
            chooseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                input.click();
            });
        }

        if (uploadBtn) {
            uploadBtn.setAttribute('type', 'button');
            // Initially disable upload button until file chosen
            uploadBtn.disabled = !input.files || input.files.length === 0;

            uploadBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!input.files || !input.files[0]) {
                    alert('Please select a file.');
                    return;
                }
                uploadBtn.disabled = true;
                const file = input.files[0];
                const data = await universalUploader(file, options.type);
                if (data) {
                    // call onSuccess
                    try { options.onSuccess && options.onSuccess(data); } catch (err) { console.error(err); }
                }
                input.value = '';
                uploadBtn.disabled = false;
            });
        }

        // when file selected, enable upload button
        input.addEventListener('change', () => {
            const hasFile = input.files && input.files.length > 0;
            if (uploadBtn) uploadBtn.disabled = !hasFile;
            // optional: auto-upload when file selected - comment out if not desired
            // if (hasFile) uploadBtn && uploadBtn.click();
        });
    };

    // Attach upload pairs for gallery, gif and homework
    // We expect the following ids from your index.html:
    // gallery-choose-button, gallery-upload-button, gallery-upload-input
    // gif-choose-button, gif-upload-button, gif-upload-input
    // homework-choose-button, homework-upload-button, homework-upload-input
    // The code will gracefully handle cases where buttons are named differently if they are in the same .upload-form as the input.

    setupUploadPair({
        chooseBtnId: 'gallery-choose-button',
        uploadBtnId: 'gallery-upload-button',
        inputId: 'gallery-upload-input',
        type: 'gallery',
        onSuccess: (data) => {
            // add to gallery UI
            addImageToGallery(data);
        }
    });

    setupUploadPair({
        chooseBtnId: 'gif-choose-button',
        uploadBtnId: 'gif-upload-button',
        inputId: 'gif-upload-input',
        type: 'gif',
        onSuccess: (data) => {
            elements.gifGrid && elements.gifGrid.appendChild(createGridItem(data, 'gifs'));
        }
    });

    setupUploadPair({
        chooseBtnId: 'homework-choose-button',
        uploadBtnId: 'homework-upload-button',
        inputId: 'homework-upload-input',
        type: 'homework',
        onSuccess: (data) => {
            addHomeworkToList(data);
        }
    });

    // Keep legacy setupUpload calls commented out (we replaced them with setupUploadPair).
    // setupUpload('gallery-upload-button', 'gallery-upload-input', 'gallery', addImageToGallery);

    // profile pic, banner, and other previously defined handlers are above

    // end of DOMContentLoaded
});

// Lenis smooth scrolling setup (unchanged)
const lenis = new Lenis({
  duration: 1.2,    // adjust smoothness speed
  easing: (t) => t, // linear easing, replace if you want custom easing
  smooth: true,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)
