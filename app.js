// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Состояние приложения
let currentState = {
    screen: 'upload',
    selectedFile: null,
    currentRating: 0,
    currentPhoto: null
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

// База демо-фото
const demoPhotos = [
    {
        id: 'photo-1',
        user_id: 'user-1',
        photo_url: 'https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Awesome+Sunset',
        total_ratings: 42,
        average_rating: 8.7
    },
    {
        id: 'photo-2', 
        user_id: 'user-2',
        photo_url: 'https://via.placeholder.com/500x500/4ECDC4/FFFFFF?text=Nature+Beauty',
        total_ratings: 28,
        average_rating: 9.2
    },
    {
        id: 'photo-3',
        user_id: 'user-3',
        photo_url: 'https://via.placeholder.com/500x500/45B7D1/FFFFFF?text=City+Lights',
        total_ratings: 35,
        average_rating: 7.8
    },
    {
        id: 'photo-4',
        user_id: 'user-4',
        photo_url: 'https://via.placeholder.com/500x500/96CEB4/FFFFFF?text=Ocean+View',
        total_ratings: 51,
        average_rating: 8.9
    },
    {
        id: 'photo-5',
        user_id: 'user-5',
        photo_url: 'https://via.placeholder.com/500x500/FECA57/FFFFFF?text=Mountains',
        total_ratings: 19,
        average_rating: 6.5
    }
];

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
function loadRandomPhoto() {
    try {
        updateStatusBar('🔄 Загружаем фото...');
        
        // Выбираем случайное фото из демо-базы
        const randomIndex = Math.floor(Math.random() * demoPhotos.length);
        currentState.currentPhoto = demoPhotos[randomIndex];
        
        elements.currentPhoto.src = currentState.currentPhoto.photo_url;
        elements.currentPhoto.onload = () => {
            updateStatusBar('✅ Фото загружено! Оцените его');
        };
        
        elements.currentPhoto.onerror = () => {
            elements.currentPhoto.src = 'https://via.placeholder.com/500x500/FF6B6B/FFFFFF?text=Error+Loading';
            updateStatusBar('✅ Фото готово к оценке!');
        };
        
    } catch (error) {
        console.error('Ошибка загрузки фото:', error);
        elements.currentPhoto.src = 'https://via.placeholder.com/500x500/5C6BC0/FFFFFF?text=Rate+Me';
        updateStatusBar('✅ Демо фото готово!');
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
function handleUpload() {
    if (!currentState.selectedFile) return;

    elements.uploadBtn.disabled = true;
    updateStatusBar('📤 Загружаем фото...');

    // Имитируем загрузку
    setTimeout(() => {
        updateStatusBar('✅ Фото загружено!');
        
        // Переходим к оценке
        setTimeout(() => {
            showScreen('rate');
        }, 1000);
        
    }, 1500);
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

function handleRatingSubmit() {
    if (!currentState.currentRating || !currentState.currentPhoto) return;

    elements.submitRating.disabled = true;
    updateStatusBar('📨 Отправляем оценку...');

    // Имитируем отправку
    setTimeout(() => {
        showScreen('thanks');
        updateStatusBar('✅ Оценка отправлена!');
    }, 1000);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Глобальные функции для дебага
window.debugApp = {
    forceRateScreen: function() {
        showScreen('rate');
    },
    testUpload: function() {
        currentState.selectedFile = { name: 'test.jpg', size: 1024000 };
        elements.uploadBtn.disabled = false;
        elements.uploadArea.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px;">📸</div>
                <p>Тестовое фото</p>
            </div>
        `;
        updateStatusBar('✅ Тестовое фото готово');
    }
};

console.log("🔧 Приложение загружено! Debug: window.debugApp");
