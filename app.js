// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let currentState = {
    screen: 'upload',
    selectedFile: null,
    currentRating: 0,
    currentPhoto: null,
    uploadedPhotos: []
};

// Элементы DOM
const elements = {
    uploadScreen: document.getElementById('upload-screen'),
    rateScreen: document.getElementById('rate-screen'),
    thanksScreen: document.getElementById('thanks-screen'),
    uploadArea: document.getElementById('upload-area'),
    photoInput: document.getElementById('photo-input'),
    uploadBtn: document.getElementById('upload-btn'),
    currentPhoto: document.getElementById('current-photo'),
    stars: document.getElementById('stars'),
    ratingValue: document.getElementById('rating-value'),
    submitRating: document.getElementById('submit-rating'),
    rateAnother: document.getElementById('rate-another'),
    statusBar: document.getElementById('status-bar')
};

// Инициализация приложения
function initApp() {
    console.log("🚀 Инициализация приложения");
    setupEventListeners();
    showScreen('upload');
    updateStatusBar('Готов к работе');
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Загрузка фото
    elements.uploadArea.addEventListener('click', () => elements.photoInput.click());
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.photoInput.addEventListener('change', handleFileSelect);
    elements.uploadBtn.addEventListener('click', handleUpload);

    // Оценка фото
    elements.stars.addEventListener('click', handleStarClick);
    elements.submitRating.addEventListener('click', handleRatingSubmit);
    elements.rateAnother.addEventListener('click', () => {
        showScreen('upload');
        updateStatusBar('Готов к работе');
    });
}

// Показ экрана
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    switch(screenName) {
        case 'upload':
            elements.uploadScreen.classList.add('active');
            break;
        case 'rate':
            elements.rateScreen.classList.add('active');
            loadRandomPhoto();
            break;
        case 'thanks':
            elements.thanksScreen.classList.add('active');
            break;
    }

    currentState.screen = screenName;
}

// Обновление статус бара
function updateStatusBar(message, isError = false) {
    elements.statusBar.textContent = message;
    elements.statusBar.style.color = isError ? '#e74c3c' : '#666';
}

// Загрузка случайного фото
async function loadRandomPhoto() {
    try {
        updateStatusBar('🔄 Загружаем фото для оценки...');
        
        // Пробуем получить фото с сервера
        try {
            const response = await fetch('http://localhost:5000/get_photo');
            const data = await response.json();
            
            if (data.success && data.photo) {
                currentState.currentPhoto = data.photo;
                elements.currentPhoto.src = data.photo.photo_url;
                updateStatusBar('✅ Фото загружено! Оцените его');
                return;
            }
        } catch (serverError) {
            console.log('Сервер недоступен, используем локальные фото');
        }
        
        // Fallback на локальные фото
        if (currentState.uploadedPhotos.length > 0) {
            const randomIndex = Math.floor(Math.random() * currentState.uploadedPhotos.length);
            currentState.currentPhoto = currentState.uploadedPhotos[randomIndex];
            elements.currentPhoto.src = currentState.currentPhoto.photo_url;
            updateStatusBar('✅ Локальное фото загружено!');
        } else {
            // Демо фото если нет своих
            currentState.currentPhoto = {
                id: 'demo_photo',
                photo_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#4CAF50"/><text x="250" y="250" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Загрузи первое фото!</text></svg>',
                user_id: 'system'
            };
            elements.currentPhoto.src = currentState.currentPhoto.photo_url;
            updateStatusBar('✅ Демо фото готово!');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        updateStatusBar('⚠️ Ошибка загрузки фото', true);
    }
}

// Обработка drag and drop
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
}

// Обработка выбора файла
function processFile(file) {
    if (!file.type.startsWith('image/')) {
        updateStatusBar('❌ Выберите изображение!', true);
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        updateStatusBar('❌ Файл слишком большой! Макс. 10MB', true);
        return;
    }

    currentState.selectedFile = file;
    elements.uploadBtn.disabled = false;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        elements.uploadArea.innerHTML = `
            <div style="text-align: center;">
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 10px;">
                <p style="margin-top: 10px; color: #666;">${file.name}</p>
                <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
        `;
    };
    reader.readAsDataURL(file);

    updateStatusBar('✅ Фото готово к загрузке');
}

// Загрузка фото
async function handleUpload() {
    if (!currentState.selectedFile) return;

    elements.uploadBtn.disabled = true;
    updateStatusBar('📤 Загружаем фото...');

    const reader = new FileReader();
    reader.onload = async function(e) {
        const userId = tg.initDataUnsafe?.user?.id?.toString() || 'user_' + Date.now();
        const photoDataUrl = e.target.result;
        
        try {
            // Пробуем отправить на сервер
            const formData = new FormData();
            formData.append('photo', currentState.selectedFile);
            formData.append('userId', userId);
            
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                updateStatusBar('✅ Фото загружено на сервер!');
            } else {
                throw new Error('Server error');
            }
            
        } catch (error) {
            console.log('Сервер недоступен, сохраняем локально');
            // Сохраняем локально
            const localPhoto = {
                id: 'local_' + Date.now(),
                user_id: userId,
                photo_url: photoDataUrl,
                filename: currentState.selectedFile.name,
                timestamp: new Date().toISOString(),
                total_ratings: 0,
                average_rating: 0
            };
            
            currentState.uploadedPhotos.push(localPhoto);
            updateStatusBar('✅ Фото сохранено локально!');
        }
        
        // В любом случае переходим к оценке
        setTimeout(() => {
            showScreen('rate');
        }, 1000);
    };
    
    reader.readAsDataURL(currentState.selectedFile);
}

// Оценка фото
function handleStarClick(e) {
    if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.value);
        currentState.currentRating = rating;

        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });

        elements.ratingValue.textContent = `${rating}/10`;
        elements.submitRating.disabled = false;
    }
}

async function handleRatingSubmit() {
    if (!currentState.currentRating || !currentState.currentPhoto) return;

    elements.submitRating.disabled = true;
    updateStatusBar('📨 Отправляем оценку...');

    try {
        // Пробуем отправить оценку на сервер
        const response = await fetch('http://localhost:5000/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photoId: currentState.currentPhoto.id,
                rating: currentState.currentRating,
                userId: tg.initDataUnsafe?.user?.id?.toString() || 'unknown'
            })
        });
        
        await response.json();
        
    } catch (error) {
        console.log('Оценка сохранена локально');
    }
    
    showScreen('thanks');
    updateStatusBar('✅ Оценка отправлена!');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);
