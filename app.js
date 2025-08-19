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

// Инициализация приложения
function initApp() {
    console.log("🚀 Инициализация приложения");
    console.log("📱 User ID:", tg.initDataUnsafe.user.id);
    
    setupEventListeners();
    showScreen('upload');
    updateStatusBar('Готов к работе');
    
    // Предзагрузка случайного фото
    loadRandomPhoto();
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log("🔧 Настройка обработчиков событий");
    
    // Загрузка фото
    elements.uploadArea.addEventListener('click', () => {
        console.log("📁 Клик по области загрузки");
        elements.photoInput.click();
    });
    
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.photoInput.addEventListener('change', handleFileSelect);
    elements.uploadBtn.addEventListener('click', handleUpload);

    // Оценка фото
    elements.stars.addEventListener('click', handleStarClick);
    elements.submitRating.addEventListener('click', handleRatingSubmit);
    elements.rateAnother.addEventListener('click', () => {
        console.log("🔄 Запрос еще одного фото");
        showScreen('upload');
        loadRandomPhoto();
    });

    // Глобальная обработка ошибок
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
}

// Показ экрана
function showScreen(screenName) {
    console.log(`🖥️ Переход на экран: ${screenName}`);
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    switch(screenName) {
        case 'upload':
            elements.uploadScreen.classList.add('active');
            break;
        case 'rate':
            elements.rateScreen.classList.add('active');
            break;
        case 'thanks':
            elements.thanksScreen.classList.add('active');
            break;
    }

    currentState.screen = screenName;
}

// Обновление статус бара
function updateStatusBar(message, isError = false) {
    console.log(isError ? `❌ ${message}` : `✅ ${message}`);
    elements.statusBar.textContent = message;
    elements.statusBar.style.color = isError ? '#e74c3c' : '#666';
}

// Загрузка случайного фото
async function loadRandomPhoto() {
    try {
        updateStatusBar('🔄 Загружаем фото для оценки...');
        console.log("📡 Запрос случайного фото");
        
        const response = await fetch('http://localhost:5000/get_photo', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log("📩 Ответ сервера:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📊 Данные фото:", data);

        if (data.success && data.photo) {
            currentState.currentPhoto = data.photo;
            elements.currentPhoto.src = data.photo.photo_url;
            elements.currentPhoto.onload = () => {
                updateStatusBar('✅ Фото загружено! Оцените его');
            };
        } else {
            throw new Error(data.error || 'Нет доступных фото');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки фото:', error);
        updateStatusBar('⚠️ Используем тестовое фото', true);
        
        // Fallback на тестовое фото
        currentState.currentPhoto = {
            id: 'fallback-photo',
            photo_url: 'https://via.placeholder.com/500x500?text=Example+Photo',
            user_id: 'demo-user',
            total_ratings: 42,
            average_rating: 8.5
        };
        elements.currentPhoto.src = currentState.currentPhoto.photo_url;
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
    console.log("📁 Обработка файла:", file.name);
    
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
    console.log("🚀 Начало загрузки файла:", currentState.selectedFile.name);

    try {
        const formData = new FormData();
        formData.append('photo', currentState.selectedFile);
        formData.append('userId', tg.initDataUnsafe.user.id.toString());

        console.log("📨 Отправка запроса на сервер...");
        
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        });

        console.log("📩 Ответ получен. Статус:", response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Ошибка сервера:", errorText);
            throw new Error(`Ошибка сервера: ${response.status}`);
        }

        const data = await response.json();
        console.log("📊 Данные ответа:", data);

        if (data.success) {
            updateStatusBar('✅ Фото загружено!');
            console.log("🎉 Фото успешно загружено!");
            
            // Переходим к оценке через 1 секунду
            setTimeout(() => {
                showScreen('rate');
                loadRandomPhoto();
            }, 1000);
            
        } else {
            throw new Error(data.error || 'Неизвестная ошибка');
        }
        
    } catch (error) {
        console.error('❌ Полная ошибка загрузки:', error);
        updateStatusBar('❌ Ошибка загрузки', true);
        
        // Fallback: переходим к оценке даже при ошибке
        setTimeout(() => {
            showScreen('rate');
            updateStatusBar('⚠️ Режим демо: используем тестовое фото');
            loadRandomPhoto();
        }, 1000);
    }
}

// Оценка фото
function handleStarClick(e) {
    if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.value);
        currentState.currentRating = rating;

        // Обновляем звезды
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });

        elements.ratingValue.textContent = `${rating}/10`;
        elements.submitRating.disabled = false;
        
        console.log("⭐ Выбрана оценка:", rating);
    }
}

async function handleRatingSubmit() {
    if (!currentState.currentRating || !currentState.currentPhoto) return;

    elements.submitRating.disabled = true;
    updateStatusBar('📨 Отправляем оценку...');
    console.log("⭐ Отправка оценки:", currentState.currentRating);

    try {
        const response = await fetch('http://localhost:5000/rate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                photoId: currentState.currentPhoto.id,
                rating: currentState.currentRating,
                userId: tg.initDataUnsafe.user.id.toString()
            })
        });

        console.log("📩 Ответ оценки:", response.status);
        
        const data = await response.json();
        console.log("📊 Ответ оценки:", data);

        if (data.success) {
            showScreen('thanks');
            updateStatusBar('✅ Оценка отправлена!');
        } else {
            throw new Error(data.error || 'Ошибка отправки оценки');
        }
    } catch (error) {
        console.error('❌ Ошибка отправки оценки:', error);
        updateStatusBar('✅ Спасибо за оценку! (режим демо)');
        showScreen('thanks');
    }
}

// Обработка ошибок
function handleError(error) {
    console.error('❌ Глобальная ошибка:', error);
    updateStatusBar('⚠️ Произошла ошибка', true);
}

function handlePromiseRejection(event) {
    console.error('❌ Необработанное promise:', event.reason);
    updateStatusBar('⚠️ Ошибка приложения', true);
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);

// Глобальные утилиты для дебага
window.debugApp = {
    getState: () => currentState,
    reloadPhoto: () => loadRandomPhoto(),
    showScreen: (screen) => showScreen(screen),
    testUpload: () => {
        console.log("🧪 Тестовый upload");
        handleUpload();
    }
};

console.log("🔧 Debug mode: window.debugApp доступен");
