/** @jsxImportSource npm:hono/jsx */
import { Hono } from "npm:hono";

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Image to Text Converter</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        {/* Tesseract.js for OCR */}
        <script src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'></script>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Padauk:wght@400;700&display=swap');
          body { font-family: 'Inter', 'Padauk', sans-serif; background-color: #0f172a; color: white; }
          .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }
          .loader-bar { transition: width 0.3s ease; }
        `}</style>
      </head>
      <body class="min-h-screen flex flex-col items-center p-4">
        
        {/* Header */}
        <header class="w-full max-w-2xl flex justify-between items-center py-6">
            <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>IMG 2 TEXT
            </h1>
            <a href="#" class="text-gray-400 hover:text-white"><i class="fa-brands fa-github text-xl"></i></a>
        </header>

        <main class="w-full max-w-2xl space-y-6">
            
            {/* 1. Upload Section */}
            <div class="glass rounded-2xl p-6 text-center border-dashed border-2 border-slate-600 hover:border-blue-500 transition cursor-pointer relative group" onclick="document.getElementById('fileInput').click()">
                <input type="file" id="fileInput" class="hidden" accept="image/*" onchange="loadImage(event)" />
                
                <div id="upload-placeholder" class="py-8">
                    <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                        <i class="fa-solid fa-cloud-arrow-up text-3xl text-blue-400"></i>
                    </div>
                    <p class="text-lg font-bold text-slate-200">Click to Upload Image</p>
                    <p class="text-sm text-slate-400 mt-1">Supports JPG, PNG, BMP</p>
                </div>

                <div id="image-preview-container" class="hidden relative">
                    <img id="preview" class="max-h-64 mx-auto rounded-lg shadow-lg" />
                    <button onclick="event.stopPropagation(); clearImage()" class="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            {/* 2. Controls */}
            <div class="flex gap-3">
                <select id="lang-select" class="glass text-white px-4 py-3 rounded-xl flex-grow outline-none focus:border-blue-500 appearance-none cursor-pointer">
                    <option value="eng">🇬🇧 English</option>
                    <option value="mya">🇲🇲 Myanmar (Burmese)</option>
                    <option value="eng+mya">🌏 English + Myanmar</option>
                </select>
                <button onclick="convertText()" id="convert-btn" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-bolt"></i> Convert
                </button>
            </div>

            {/* 3. Progress Bar */}
            <div id="progress-container" class="hidden w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div id="progress-bar" class="bg-blue-500 h-2.5 rounded-full loader-bar" style="width: 0%"></div>
            </div>
            <p id="status-text" class="text-xs text-center text-slate-400 hidden">Initializing...</p>

            {/* 4. Result Area */}
            <div class="glass rounded-2xl p-4 relative">
                <div class="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                    <span class="text-xs font-bold text-slate-400 uppercase">Extracted Text</span>
                    <button onclick="copyText()" class="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                </div>
                <textarea id="result-text" class="w-full h-48 bg-transparent text-slate-200 outline-none resize-none font-mono text-sm leading-relaxed" placeholder="Text will appear here..."></textarea>
            </div>

        </main>

        <footer class="mt-auto py-6 text-center text-xs text-slate-500">
            <p>Powered by Tesseract.js & Deno</p>
        </footer>

        {/* LOGIC SCRIPT */}
        <script dangerouslySetInnerHTML={{__html: `
            let selectedFile = null;

            function loadImage(event) {
                const file = event.target.files[0];
                if (file) {
                    selectedFile = file;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('preview').src = e.target.result;
                        document.getElementById('upload-placeholder').classList.add('hidden');
                        document.getElementById('image-preview-container').classList.remove('hidden');
                        document.getElementById('result-text').value = ""; // Clear old text
                    };
                    reader.readAsDataURL(file);
                }
            }

            function clearImage() {
                selectedFile = null;
                document.getElementById('fileInput').value = "";
                document.getElementById('upload-placeholder').classList.remove('hidden');
                document.getElementById('image-preview-container').classList.add('hidden');
                document.getElementById('result-text').value = "";
            }

            async function convertText() {
                if (!selectedFile) {
                    alert("Please upload an image first!");
                    return;
                }

                const btn = document.getElementById('convert-btn');
                const progressContainer = document.getElementById('progress-container');
                const progressBar = document.getElementById('progress-bar');
                const statusText = document.getElementById('status-text');
                const lang = document.getElementById('lang-select').value;

                // Reset UI
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
                progressContainer.classList.remove('hidden');
                statusText.classList.remove('hidden');
                document.getElementById('result-text').value = "";

                try {
                    // Start OCR
                    const { data: { text } } = await Tesseract.recognize(
                        selectedFile,
                        lang,
                        {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    const percent = Math.round(m.progress * 100);
                                    progressBar.style.width = percent + "%";
                                    statusText.innerText = "Scanning... " + percent + "%";
                                } else {
                                    statusText.innerText = m.status;
                                }
                            }
                        }
                    );

                    document.getElementById('result-text').value = text;
                    statusText.innerText = "Completed!";
                    progressBar.style.width = "100%";

                } catch (error) {
                    console.error(error);
                    alert("Error converting image. Please try again.");
                    statusText.innerText = "Error occurred";
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Convert';
                    setTimeout(() => {
                        progressContainer.classList.add('hidden');
                        statusText.classList.add('hidden');
                        progressBar.style.width = "0%";
                    }, 3000);
                }
            }

            function copyText() {
                const textArea = document.getElementById('result-text');
                textArea.select();
                document.execCommand('copy');
                // Simple Toast
                const originalBtnText = document.querySelector('button[onclick="copyText()"]').innerHTML;
                document.querySelector('button[onclick="copyText()"]').innerHTML = '<i class="fa-solid fa-check"></i> Copied';
                setTimeout(() => {
                    document.querySelector('button[onclick="copyText()"]').innerHTML = originalBtnText;
                }, 2000);
            }
        `}} />
      </body>
    </html>
  );
});

Deno.serve(app.fetch);
