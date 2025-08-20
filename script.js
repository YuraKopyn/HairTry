
let uploadedImage = null;

document.getElementById('upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            uploadedImage = img;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

function applyHair() {
    if (!uploadedImage) {
        alert('Спочатку завантаж фото!');
        return;
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Проста "зачіска" - червоний еліпс над головою
    ctx.fillStyle = 'rgba(200,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(canvas.width/2, canvas.height/4, canvas.width/4, canvas.height/6, 0, 0, 2 * Math.PI);
    ctx.fill();
}
