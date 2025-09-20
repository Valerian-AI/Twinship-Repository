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

// ---------------- Gallery Data Storage ----------------
let galleryData = {
    sfw: [],
    nsfw: []
};
let currentGalleryType = 'sfw';

// ---------------- Uploader Helper ----------------
async function uploadFile(file, type, category = null) {
    if (!file) return;

    console.log(`[uploader] uploading file "${file.name}" as type "${type}"${category ? ` (${category})` : ''}`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (category) {
        formData.append("category", category);
    }

    try {
        const res = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        console.log("[uploader] success", data);

        // Handle different upload types
        if (type === "gallery" && category) {
            // Add to appropriate gallery category
            galleryData[category].push(data);
            // If modal is open for this category, refresh it
            const modal = document.getElementById('gallery-modal');
            if (!modal.classList.contains('hidden') && currentGalleryType === category) {
                populateGalleryModal(category);
            }
        } else if (type === "gif") {
            addImageToGrid(data.path, "gif-grid");
        } else if (type === "homework") {
            addFileToList(data.path, "homework-list");
        }

        return data;

    } catch (err) {
        console.error("[uploader] error", err);
        throw err;
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

// ---------------- Gallery Modal Functions ----------------
function openGalleryModal(category) {
    currentGalleryType = category;
    const modal = document.getElementById('gallery-modal');
    const modalTitle = document.getElementById('gallery-modal-title');
    
    modalTitle.textContent = category.toUpperCase() + ' Gallery';
    modal.classList.remove('hidden');
    
    populateGalleryModal(category);
}

function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    modal.classList.add('hidden');
}

function populateGalleryModal(category) {
    const grid = document.getElementById('gallery-modal-grid');
    grid.innerHTML = '';
    
    const images = galleryData[category] || [];
    
    images.forEach((item, index) => {
        const container = document.createElement('div');
        container.className = 'grid-item';
        
        const img = document.createElement('img');
        img.src = item.path;
        img.alt = item.originalName || 'Gallery Image';
        img.onclick = () => openLightbox(item, category, index);
        
        container.appendChild(img);
        
        // Add delete button for admin
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm('Are you sure you want to delete this image?')) return;
                
                try {
                    await fetch('/api/media', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            filePath: item.path, 
                            type: 'gallery',
                            category: category 
                        })
                    });
                    
                    // Remove from local data
                    galleryData[category].splice(index, 1);
                    // Refresh modal
                    populateGalleryModal(category);
                    
                } catch (error) {
                    console.error('Delete failed:', error);
                    alert('Failed to delete image');
                }
            };
            container.appendChild(deleteBtn);
        }
        
        grid.appendChild(container);
    });
}

// ---------------- Lightbox Functions ----------------
let currentGallery = [];
let currentIndex = 0;

function openLightbox(clickedItem, galleryType, startIndex = 0) {
    if (galleryType === 'sfw' || galleryType === 'nsfw') {
        currentGallery = galleryData[galleryType].map(item => item.path);
        currentIndex = startIndex;
    } else {
        // Handle other gallery types (gifs, etc.)
        const gallerySource = Array.from(document.querySelectorAll('#gif-grid .grid-item'));
        currentGallery = gallerySource.map(item => item.dataset.filePath);
        currentIndex = currentGallery.indexOf(clickedItem.path);
        if (currentIndex === -1) currentIndex = 0;
    }
    
    showImageAtIndex(currentIndex);
    document.getElementById('lightbox').classList.remove('hidden');
}

function showImageAtIndex(index) {
    const lightboxImage = document.querySelector('.lightbox-content');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    
    if (!lightboxImage || index < 0 || index >= currentGallery.length) return;
    
    lightboxImage.src = currentGallery[index];
    
    if (lightboxPrev) lightboxPrev.style.display = index === 0 ? 'none' : 'block';
    if (lightboxNext) lightboxNext.style.display = index === currentGallery.length - 1 ? 'none' : 'block';
}

// ---------------- GIF Upload ----------------
const gifInput = document.getElementById("gif-upload-input");
const gifUploadBtn = document.getElementById("gif-upload-button");

gifUploadBtn?.addEventListener("click", () => {
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

homeworkUploadBtn?.addEventListener("click", () => {
    if (homeworkInput.files.length > 0) {
        uploadFile(homeworkInput.files[0], "homework");
        homeworkInput.value = "";
    } else {
        alert("Please select a file first.");
    }
});

// ---------------- Placeholder Fix ----------------
document.getElementById("album-art").onerror = function () {
    this.src = "https://via.placeholder.com/150";
};
document.getElementById("profile-picture-display").onerror = function () {
    this.src = "https://via.placeholder.com/100";
};

    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';

    let musicLibrary = [];
    let songIndex = 0;
    let isPlaying = false;

    // DOM elements
    const elements = {
        body: document.body,
        username: document.getElementById('username-display'),
        profilePic: document.getElementById('profile-picture-display'),
        banner: document.getElementById('banner-display'),
        youtubeLink: document.getElementById('youtube-link'),
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
        socket: (typeof io === 'function') ? io() : null,
        backgroundCategories: document.getElementById('background-categories'),
        backgroundSwitcher: document.getElementById('background-switcher'),
        // Gallery elements
        galleryModal: document.getElementById('gallery-modal'),
        galleryModalGrid: document.getElementById('gallery-modal-grid'),
        modalGalleryUploadInput: document.getElementById('modal-gallery-upload-input'),
        modalGalleryUploadButton: document.getElementById('modal-gallery-upload-button')
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

    // Create grid item for GIFs and other content
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
        }
        return container;
    };

    // Universal uploader
    const universalUploader = async (file, type, category = null) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (category) {
            formData.append('category', category);
        }
        try {
            console.log(`[uploader] uploading file "${file.name}" as type "${type}"${category ? ` (${category})` : ''}`);
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

            // Load gallery data by category
            galleryData.sfw = (data.galleryImages || []).filter(img => img.category === 'sfw' || !img.category);
            galleryData.nsfw = (data.galleryImages || []).filter(img => img.category === 'nsfw');

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

    // Gallery Widget Click Handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-widget')) {
            const widget = e.target.closest('.gallery-widget');
            const category = widget.dataset.category;
            openGalleryModal(category);
        }
    });

    // Gallery Modal Close Handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-close-button')) {
            closeGalleryModal();
        }
        if (e.target.id === 'gallery-modal' && !e.target.closest('.gallery-modal-content')) {
            closeGalleryModal();
        }
    });

    // Modal Gallery Upload Handler
    if (elements.modalGalleryUploadButton) {
        elements.modalGalleryUploadButton.addEventListener('click', async () => {
            const input = elements.modalGalleryUploadInput;
            if (!input.files[0]) return alert('Please select a file.');
            
            const data = await universalUploader(input.files[0], 'gallery', currentGalleryType);
            if (data) {
                galleryData[currentGalleryType].push(data);
                populateGalleryModal(currentGalleryType);
                input.value = '';
            }
        });
    }

    // Audio controls
    elements.playPauseBtn && elements.playPauseBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));
    elements.prevBtn && elements.prevBtn.addEventListener('click', prevSong);
    elements.nextBtn && elements.nextBtn.addEventListener('click', nextSong);
    elements.audioPlayer && elements.audioPlayer.addEventListener('timeupdate', updateProgress);
    elements.progressContainer && elements.progressContainer.addEventListener('click', setProgress);
    elements.audioPlayer && elements.audioPlayer.addEventListener('ended', nextSong);
    elements.playlistToggle && elements.playlistToggle.addEventListener('click', () => { elements.playlist && elements.playlist.classList.toggle('hidden'); });

    // Lightbox navigation
    elements.lightboxPrev && elements.lightboxPrev.addEventListener('click', () => { 
        if (currentIndex > 0) { 
            currentIndex--; 
            showImageAtIndex(currentIndex); 
        } 
    });
    elements.lightboxNext && elements.lightboxNext.addEventListener('click', () => { 
        if (currentIndex < currentGallery.length - 1) { 
            currentIndex++; 
            showImageAtIndex(currentIndex); 
        } 
    });

    // Close lightbox
    elements.lightbox && elements.lightbox.querySelector('.close-button') && 
    (elements.lightbox.querySelector('.close-button').onclick = () => elements.lightbox.classList.add('hidden'));

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
    }

    themeToggleButton && themeToggleButton.addEventListener('click', () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));

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

    // Keyboard shortcuts for lightbox
    document.addEventListener('keydown', (e) => {
        if (!elements.lightbox.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                currentIndex--;
                showImageAtIndex(currentIndex);
            } else if (e.key === 'ArrowRight' && currentIndex < currentGallery.length - 1) {
                currentIndex++;
                showImageAtIndex(currentIndex);
            } else if (e.key === 'Escape') {
                elements.lightbox.classList.add('hidden');
            }
        }
        
        if (!elements.galleryModal.classList.contains('hidden') && e.key === 'Escape') {
            closeGalleryModal();
        }
    });

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